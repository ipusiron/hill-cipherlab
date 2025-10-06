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

  // ===== 定数定義 =====
  const MOD = 26; // モジュラー演算の法（A-Zの文字数）

  // ===== ユーティリティ関数 =====

  /**
   * 最大公約数を計算（ユークリッドの互除法）
   * @param {number} a - 整数1
   * @param {number} b - 整数2
   * @returns {number} - aとbの最大公約数
   */
  const gcd = (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };

  /**
   * モジュラー演算（常に正の剰余を返す）
   * @param {number} a - 被除数
   * @param {number} m - 法（デフォルト: 26）
   * @returns {number} - 0 <= r < m の範囲の剰余
   */
  const mod = (a, m=MOD) => {
    let r = a % m;
    return r < 0 ? r + m : r;
  };

  /**
   * 拡張ユークリッドの互除法でモジュラー逆元を計算
   * @param {number} a - 逆元を求める数
   * @param {number} m - 法（デフォルト: 26）
   * @returns {number|null} - 逆元（存在しない場合はnull）
   */
  const modInv = (a, m=MOD) => {
    a = mod(a, m);
    if (a === 0) return null; // 0には逆元が存在しない
    let [t, newT] = [0, 1];
    let [r, newR] = [m, a];
    while (newR !== 0) {
      const q = Math.floor(r / newR);
      [t, newT] = [newT, t - q * newT];
      [r, newR] = [newR, r - q * newR];
    }
    if (r !== 1) return null; // gcd(a,m) ≠ 1 なら逆元なし
    return mod(t, m);
  };

  /**
   * 文字列を数値配列に変換（A=0, B=1, ..., Z=25）
   * @param {string} s - 入力文字列
   * @returns {number[]} - 数値配列（英字以外は除外）
   */
  const toAlphaNums = (s) =>
    (s.toUpperCase().match(/[A-Z]/g) || []).map(ch => ch.charCodeAt(0) - 65);

  /**
   * 数値配列を文字列に変換（0=A, 1=B, ..., 25=Z）
   * @param {number[]} arr - 数値配列
   * @returns {string} - 英大文字の文字列
   */
  const fromAlphaNums = (arr) =>
    arr.map(n => String.fromCharCode(65 + mod(n))).join('');

  /**
   * 配列をnの倍数になるようXでパディング
   * @param {number[]} nums - 数値配列
   * @param {number} n - ブロックサイズ
   * @returns {number[]} - パディング後の配列
   */
  const padBlocks = (nums, n) => {
    const r = nums.slice();
    while (r.length % n !== 0) r.push(23); // 'X' = 23
    return r;
  };

  /**
   * 配列をnサイズのブロックに分割
   * @param {number[]} arr - 入力配列
   * @param {number} n - ブロックサイズ
   * @returns {number[][]} - ブロックの配列
   */
  const chunk = (arr, n) => {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  };

  // ===== 行列演算 =====

  /**
   * 2×2行列の行列式を計算（mod 26）
   * @param {number[][]} M - 2×2行列
   * @returns {number} - 行列式（mod 26）
   */
  const det2 = (M) => mod(M[0][0]*M[1][1] - M[0][1]*M[1][0], MOD);

  /**
   * 3×3行列の行列式を計算（mod 26）
   * @param {number[][]} M - 3×3行列
   * @returns {number} - 行列式（mod 26）
   */
  const det3 = (M) => {
    const a = M[0][0], b = M[0][1], c = M[0][2];
    const d = M[1][0], e = M[1][1], f = M[1][2];
    const g = M[2][0], h = M[2][1], i = M[2][2];
    const D = a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
    return mod(D, MOD);
  };

  /**
   * 3×3行列の小行列式（minor）を計算
   * @param {number[][]} M - 3×3行列
   * @param {number} row - 除外する行
   * @param {number} col - 除外する列
   * @returns {number} - 小行列式（mod 26）
   */
  const minor2Det = (M, row, col) => {
    const m = [];
    for (let r = 0; r < 3; r++) if (r !== row) {
      const rowArr = [];
      for (let c = 0; c < 3; c++) if (c !== col) {
        rowArr.push(M[r][c]);
      }
      m.push(rowArr);
    }
    return mod(m[0][0]*m[1][1] - m[0][1]*m[1][0], MOD);
  };

  /**
   * 2×2行列の随伴行列（adjugate）を計算
   * @param {number[][]} M - 2×2行列 [[a,b],[c,d]]
   * @returns {number[][]} - 随伴行列 [[d,-b],[-c,a]]（各要素 mod 26）
   */
  const adjugate2 = (M) => {
    const [[a,b],[c,d]] = M;
    return [
      [ mod(d), mod(-b) ],
      [ mod(-c), mod(a) ]
    ];
  };

  /**
   * 3×3行列の随伴行列（adjugate）を計算
   * 手順: 余因子行列を作成 → 転置
   * @param {number[][]} M - 3×3行列
   * @returns {number[][]} - 随伴行列（mod 26）
   */
  const adjugate3 = (M) => {
    // 余因子行列を計算
    const cof = Array.from({length:3},()=>Array(3).fill(0));
    for (let i=0;i<3;i++){
      for (let j=0;j<3;j++){
        const sign = ((i+j)%2===0)? 1 : -1;
        cof[i][j] = mod(sign * minor2Det(M, i, j));
      }
    }
    // 転置して随伴行列を得る
    const adj = Array.from({length:3},()=>Array(3).fill(0));
    for (let i=0;i<3;i++){
      for (let j=0;j<3;j++){
        adj[i][j] = cof[j][i];
      }
    }
    return adj;
  };

  /**
   * 行列とベクトルの乗算（mod 26）
   * @param {number[][]} M - n×n行列
   * @param {number[]} v - 長さnのベクトル
   * @returns {number[]} - 結果ベクトル（各要素 mod 26）
   */
  const matMulVec = (M, v) => {
    const n = M.length;
    const res = Array(n).fill(0);
    for (let i=0;i<n;i++){
      let s = 0;
      for (let j=0;j<n;j++) s += M[i][j]*v[j];
      res[i] = mod(s);
    }
    return res;
  };

  /**
   * 行列のスカラー倍（mod 26）
   * @param {number[][]} M - 行列
   * @param {number} s - スカラー値
   * @returns {number[][]} - スカラー倍した行列（各要素 mod 26）
   */
  const matScalar = (M, s) => M.map(row => row.map(x => mod(x*s)));

  /**
   * 行列をHTML整形して表示
   * @param {number[][]|null} M - 表示する行列
   * @returns {string} - HTML文字列
   */
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
