/* ============================================================================
 * Hill CipherLab - Main Script
 * ============================================================================
 *
 * 概要:
 *   - Hill暗号（2×2 / 3×3行列）の暗号化・復号を実装
 *   - モジュラー演算（mod 26）で行列の逆行列を計算
 *   - 鍵の可逆性検証（gcd(det, 26) == 1）
 *
 * 主要機能:
 *   1. 鍵生成タブ: 行列入力、ランダム生成、逆行列計算、検証
 *   2. 暗号化タブ: 平文→暗号文変換、処理ログ表示
 *   3. 復号タブ: 暗号文→平文変換、暗号文同期機能
 *   4. 座学タブ: 教育的説明（アコーディオン形式）
 *
 * セキュリティ対策:
 *   - XSS防止: テキストのサニタイゼーション
 *   - DoS防止: 入力長制限（10000文字）
 *   - 安全なDOM操作
 * ============================================================================
 */

(() => {
  'use strict';

  // ===== 計算部（js/hill-core.js）=====
  const H = globalThis.HillCore;
  const MOD = H.MOD;
  const { gcd, mod, modInv } = H;

  const toAlphaNums = (s) => H.toNums(H.normalizeText(s).letters);
  const fromAlphaNums = (arr) => H.toLetters(arr);

  const padBlocks = (nums, n) => {
    const r = nums.slice();
    while (r.length % n !== 0) r.push(23); // 'X' = 23
    return r;
  };

  const chunk = (arr, n) => {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  };

  const det2 = (M) => mod(H.det(M));
  const det3 = (M) => mod(H.det(M));
  const adjugate2 = (M) => H.adjugate(M).map((row) => row.map((x) => mod(x)));
  const adjugate3 = adjugate2;
  const matMulVec = (M, v) => H.matVec(M, v);
  const matScalar = (M, s) => M.map(row => row.map(x => mod(x*s)));

  const matrixToHTML = (M) => {
    if (!M) return '-';
    const rows = M.map(r => r.map(x => String(mod(x)).padStart(2,' ')).join('  '));
    return `<pre>  ${rows.join('\n  ')}</pre>`;
  };

  // ===== DOM要素の取得 =====
  const size2Btn = document.getElementById('size2');
  const size3Btn = document.getElementById('size3');
  const matrixArea = document.getElementById('matrixArea');

  const detKEl = document.getElementById('detK');
  const detKmodEl = document.getElementById('detKmod');
  const gcdEl = document.getElementById('gcdVal');
  const detInvEl = document.getElementById('detInv');
  const invertibleEl = document.getElementById('invertible');
  const invMatrixEl = document.getElementById('invMatrix');

  const plaintextEl = document.getElementById('plaintext');
  const processedPlaintextEl = document.getElementById('processed-plaintext');
  const ciphertextEncryptEl = document.getElementById('ciphertext-encrypt');
  const ciphertextDecryptEl = document.getElementById('ciphertext-decrypt');
  const plaintextDecryptEl = document.getElementById('plaintext-decrypt');
  const logEncryptEl = document.getElementById('log-encrypt');
  const logDecryptEl = document.getElementById('log-decrypt');
  const warningEncryptEl = document.getElementById('warning-encrypt');
  const warningDecryptEl = document.getElementById('warning-decrypt');

  const btnRandom = document.getElementById('btnRandom');
  const btnIdentity = document.getElementById('btnIdentity');
  const btnClearKey = document.getElementById('btnClearKey');

  const btnEncrypt = document.getElementById('btnEncrypt');
  const btnDecrypt = document.getElementById('btnDecrypt');
  const btnClearEncrypt = document.getElementById('btnClearEncrypt');
  const btnClearDecrypt = document.getElementById('btnClearDecrypt');
  const btnCopyEncrypt = document.getElementById('btnCopyEncrypt');
  const btnCopyDecrypt = document.getElementById('btnCopyDecrypt');
  const btnSyncCiphertext = document.getElementById('btnSyncCiphertext');

  const toastEl = document.getElementById('toast');

  // ===== グローバル状態 =====
  let N = 2; // ブロックサイズ（行列のサイズ: 2または3）
  let inputs = []; // 行列入力フィールドの配列

  // ===== UI関数 =====

  /**
   * 行列入力UIを描画（サイズ変更時に呼ばれる）
   * 単位行列で初期化し、入力イベントとキーナビゲーションを設定
   */
  const renderMatrixInputs = () => {
    // 既存の入力フィールドを安全に削除（XSS対策）
    while (matrixArea.firstChild) {
      matrixArea.removeChild(matrixArea.firstChild);
    }

    const wrap = document.createElement('div');
    wrap.className = `matrixGrid cols-${N}`;
    inputs = [];
    for (let i=0;i<N;i++){
      for (let j=0;j<N;j++){
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.value = (i===j)? 1 : 0; // 単位行列で初期化
        inp.min = -999; inp.max = 999;
        inp.dataset.row = String(i);
        inp.dataset.col = String(j);
        inp.addEventListener('input', () => updateKeyInfo());
        inp.addEventListener('keydown', handleArrowKeys);
        wrap.appendChild(inp);
        inputs.push(inp);
      }
    }
    matrixArea.appendChild(wrap);
    updateKeyInfo();
  };

  /**
   * 行列入力の矢印キーナビゲーション
   * 上下左右キーで隣接セルに移動
   * @param {KeyboardEvent} e - キーボードイベント
   */
  const handleArrowKeys = (e) => {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    let newRow = row, newCol = col;

    switch(e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(N - 1, row + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(N - 1, col + 1);
        e.preventDefault();
        break;
      default:
        return;
    }

    const targetIdx = newRow * N + newCol;
    if (inputs[targetIdx]) {
      inputs[targetIdx].focus();
      inputs[targetIdx].select();
    }
  };

  const readMatrix = () => {
    const M = [];
    let idx = 0;
    for (let i=0;i<N;i++){
      const row = [];
      for (let j=0;j<N;j++){
        const v = parseInt(inputs[idx++].value || '0', 10);
        row.push(mod(v));
      }
      M.push(row);
    }
    return M;
  };

  const setMatrix = (M) => {
    let idx = 0;
    for (let i=0;i<N;i++){
      for (let j=0;j<N;j++){
        inputs[idx++].value = mod(M[i][j]);
      }
    }
    updateKeyInfo();
  };

  const updateKeyInfo = () => {
    const K = readMatrix();
    let det;
    if (N===2) det = det2(K);
    else det = det3(K);
    const detMod = mod(det);
    const g = gcd(detMod, MOD);
    const invDet = (g===1) ? modInv(detMod) : null;
    detKEl.textContent = String(((N===2)
      ? (K[0][0]*K[1][1] - K[0][1]*K[1][0])
      : (
        K[0][0]*(K[1][1]*K[2][2]-K[1][2]*K[2][1]) -
        K[0][1]*(K[1][0]*K[2][2]-K[1][2]*K[2][0]) +
        K[0][2]*(K[1][0]*K[2][1]-K[1][1]*K[2][0])
      )));

    detKmodEl.textContent = String(detMod);
    gcdEl.textContent = String(g);
    detInvEl.textContent = (invDet==null)? '—' : String(invDet);
    invertibleEl.innerHTML = (g===1)
      ? '<span class="ok">✓ 使用可能</span>'
      : '<span class="ng">✗ 使用不可</span>';

    if (g===1){
      // compute inverse
      const adj = (N===2)? adjugate2(K) : adjugate3(K);
      const Kinv = matScalar(adj, invDet);
      invMatrixEl.innerHTML = matrixToHTML(Kinv);
    } else {
      invMatrixEl.textContent = '-';
    }
  };

  // Generate random invertible matrix
  const randomInvertible = () => {
    const trials = 500;
    for (let t=0;t<trials;t++){
      const M = Array.from({length:N},()=>Array(N).fill(0).map(()=>mod(Math.floor(Math.random()*26))));
      const d = (N===2)? det2(M) : det3(M);
      if (gcd(d, MOD) === 1) return M;
    }
    // fallback: identity
    return Array.from({length:N}, (_,i)=>Array.from({length:N},(_,j)=> i===j?1:0));
  };

  // Show/hide warning message
  const showWarning = (el, msg) => {
    // Sanitize message to prevent XSS
    const sanitizedMsg = String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    el.textContent = sanitizedMsg;
    el.classList.remove('hidden');
  };
  const hideWarning = (el) => {
    el.classList.add('hidden');
  };

  // Toast notification
  let toastTimeout;
  const showToast = (message, type = 'info') => {
    if (toastTimeout) clearTimeout(toastTimeout);

    // Sanitize message to prevent XSS
    const sanitizedMessage = String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    toastEl.textContent = sanitizedMessage;

    // Validate type parameter
    const validTypes = ['info', 'success'];
    const safeType = validTypes.includes(type) ? type : 'info';
    toastEl.className = `toast ${safeType}`;

    // Trigger reflow for animation
    void toastEl.offsetWidth;

    toastEl.classList.add('show');

    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  };

  // Update processed plaintext display
  const updateProcessedPlaintext = () => {
    const raw = plaintextEl.value;
    if (!raw) {
      processedPlaintextEl.textContent = '-';
      return;
    }
    // Limit input length to prevent DoS
    const limitedInput = raw.slice(0, 10000);
    const Pnums = padBlocks(toAlphaNums(limitedInput), N);
    const processed = fromAlphaNums(Pnums);
    processedPlaintextEl.textContent = processed;
  };

  // Encrypt/Decrypt
  const encrypt = () => {
    hideWarning(warningEncryptEl);
    const K = readMatrix();
    const d = (N===2)? det2(K) : det3(K);
    if (gcd(d, MOD)!==1){
      showWarning(warningEncryptEl, '鍵が不可逆です（gcd(det,26)≠1）。「鍵生成」タブで使用可能な鍵を生成してください。');
      return;
    }

    // Limit input length to prevent DoS
    const limitedInput = plaintextEl.value.slice(0, 10000);
    const Pnums = padBlocks(toAlphaNums(limitedInput), N);

    // Prevent excessive computation
    if (Pnums.length > 10000) {
      showWarning(warningEncryptEl, '入力が長すぎます。10000文字以内にしてください。');
      return;
    }

    const blocks = chunk(Pnums, N);
    const out = [];
    const steps = [];
    blocks.forEach((b, idx) => {
      const c = matMulVec(K, b);
      steps.push(`${idx+1}) P=${JSON.stringify(b)}  ->  C=${JSON.stringify(c)}`);
      out.push(...c);
    });
    ciphertextEncryptEl.value = fromAlphaNums(out);
    logEncryptEl.textContent = steps.join('\n');
  };

  const decrypt = () => {
    hideWarning(warningDecryptEl);
    const K = readMatrix();
    const d = (N===2)? det2(K) : det3(K);
    if (gcd(d, MOD)!==1){
      showWarning(warningDecryptEl, '鍵が不可逆です（gcd(det,26)≠1）。「鍵生成」タブで使用可能な鍵を生成してください。');
      return;
    }
    const invDet = modInv(d);
    const adj = (N===2)? adjugate2(K) : adjugate3(K);
    const Kinv = matScalar(adj, invDet);

    // Limit input length to prevent DoS
    const limitedInput = ciphertextDecryptEl.value.slice(0, 10000);
    const Cnums = padBlocks(toAlphaNums(limitedInput), N);

    // Prevent excessive computation
    if (Cnums.length > 10000) {
      showWarning(warningDecryptEl, '入力が長すぎます。10000文字以内にしてください。');
      return;
    }

    const blocks = chunk(Cnums, N);
    const out = [];
    const steps = [];
    blocks.forEach((b, idx) => {
      const p = matMulVec(Kinv, b);
      steps.push(`${idx+1}) C=${JSON.stringify(b)}  ->  P=${JSON.stringify(p)}`);
      out.push(...p);
    });
    plaintextDecryptEl.value = fromAlphaNums(out);
    logDecryptEl.textContent = steps.join('\n');
  };

  // Events
  size2Btn.addEventListener('click', () => {
    N = 2;
    size2Btn.classList.add('active');
    size3Btn.classList.remove('active');
    renderMatrixInputs();
    updateProcessedPlaintext();
  });

  size3Btn.addEventListener('click', () => {
    N = 3;
    size3Btn.classList.add('active');
    size2Btn.classList.remove('active');
    renderMatrixInputs();
    updateProcessedPlaintext();
  });

  btnIdentity.addEventListener('click', () => {
    const M = Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=> i===j?1:0));
    setMatrix(M);
  });

  btnClearKey.addEventListener('click', () => {
    const M = Array.from({length:N},()=>Array.from({length:N},()=>0));
    setMatrix(M);
  });

  btnRandom.addEventListener('click', () => setMatrix(randomInvertible()));

  btnEncrypt.addEventListener('click', encrypt);
  btnDecrypt.addEventListener('click', decrypt);

  // Update processed plaintext on input
  plaintextEl.addEventListener('input', updateProcessedPlaintext);

  btnClearEncrypt.addEventListener('click', () => {
    plaintextEl.value = '';
    ciphertextEncryptEl.value = '';
    logEncryptEl.textContent = '';
    processedPlaintextEl.textContent = '-';
    hideWarning(warningEncryptEl);
    showToast('暗号化タブをクリアしました', 'info');
  });

  btnClearDecrypt.addEventListener('click', () => {
    ciphertextDecryptEl.value = '';
    plaintextDecryptEl.value = '';
    logDecryptEl.textContent = '';
    hideWarning(warningDecryptEl);
    showToast('復号タブをクリアしました', 'info');
  });

  // Copy to clipboard
  btnCopyEncrypt.addEventListener('click', async () => {
    const text = ciphertextEncryptEl.value;
    if (!text) {
      showToast('コピーする内容がありません', 'info');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      btnCopyEncrypt.textContent = '✓ コピー完了';
      btnCopyEncrypt.classList.add('copied');
      showToast('暗号文をコピーしました', 'success');

      setTimeout(() => {
        btnCopyEncrypt.textContent = '📋 コピー';
        btnCopyEncrypt.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
      showToast('コピーに失敗しました', 'info');
    }
  });

  btnCopyDecrypt.addEventListener('click', async () => {
    const text = plaintextDecryptEl.value;
    if (!text) {
      showToast('コピーする内容がありません', 'info');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      btnCopyDecrypt.textContent = '✓ コピー完了';
      btnCopyDecrypt.classList.add('copied');
      showToast('平文をコピーしました', 'success');

      setTimeout(() => {
        btnCopyDecrypt.textContent = '📋 コピー';
        btnCopyDecrypt.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
      showToast('コピーに失敗しました', 'info');
    }
  });

  // Sync ciphertext from encrypt tab
  btnSyncCiphertext.addEventListener('click', () => {
    const encryptedText = ciphertextEncryptEl.value;
    if (!encryptedText) {
      showWarning(warningDecryptEl, '暗号化タブでまだ暗号文が生成されていません。先に「暗号化」タブで平文を暗号化してください。');
      return;
    }

    // Limit sync length to prevent issues
    const limitedText = encryptedText.slice(0, 10000);
    ciphertextDecryptEl.value = limitedText;
    hideWarning(warningDecryptEl);
    showToast('暗号文を同期しました', 'success');

    // Visual feedback on button
    btnSyncCiphertext.textContent = '✓ 同期完了';
    btnSyncCiphertext.classList.add('copied');

    setTimeout(() => {
      btnSyncCiphertext.textContent = '🔄 同期';
      btnSyncCiphertext.classList.remove('copied');
    }, 2000);
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab buttons
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // Init
  renderMatrixInputs();

})();
