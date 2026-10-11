/* ============================================================================
 * Hill CipherLab - Main Script（画面の処理）
 * ============================================================================
 *
 * 概要:
 *   - 計算は js/hill-core.js（HillCore）、文言は js/messages.js（HillMessages）に置き、
 *     ここでは DOM の読み書きだけを行う
 *   - 鍵・平文・暗号文のどれを変えても、結果と処理ログをその場で計算し直す
 *     （古い鍵の結果が画面に残らないようにする）
 *
 * 主要機能:
 *   1. 鍵生成タブ: 行列入力（整数だけ）、ランダム生成（crypto.getRandomValues）、逆行列と計算過程
 *   2. 暗号化タブ: 平文→暗号文、処理ログ（ブロックごとの積和と mod 26）
 *   3. 復号タブ: 暗号文→平文。英字の数がブロックの倍数でなければ復号しない
 *   4. 座学タブ: 教育的説明（アコーディオン形式）
 *
 * セキュリティ対策:
 *   - 入力は textContent / textarea.value でだけ描画する（innerHTML を使わない）
 *   - 入力の上限（英字 10,000 字、入力欄 100,000 文字）
 * ============================================================================
 */

(() => {
  'use strict';

  const H = globalThis.HillCore;
  const { t, tm } = globalThis.HillMessages;

  // 処理ログに出すブロックの数の上限（結果の欄にはすべて入る）
  const LOG_BLOCKS = 200;

  // ===== DOM要素の取得 =====
  const $ = (id) => document.getElementById(id);

  const size2Btn = $('size2');
  const size3Btn = $('size3');
  const matrixArea = $('matrixArea');
  const keyErrorsEl = $('keyErrors');

  const detKEl = $('detK');
  const detKmodEl = $('detKmod');
  const gcdEl = $('gcdVal');
  const detInvEl = $('detInv');
  const invertibleEl = $('invertible');
  const keyReasonEl = $('keyReason');
  const keyRatioEl = $('keyRatio');
  const invMatrixEl = $('invMatrix');
  const invStepsEl = $('invStepsBody');

  const plaintextEl = $('plaintext');
  const processedPlaintextEl = $('processed-plaintext');
  const encryptInfoEl = $('encrypt-info');
  const ciphertextEncryptEl = $('ciphertext-encrypt');
  const ciphertextDecryptEl = $('ciphertext-decrypt');
  const decryptStatusEl = $('decrypt-status');
  const plaintextDecryptEl = $('plaintext-decrypt');
  const logEncryptEl = $('log-encrypt');
  const logDecryptEl = $('log-decrypt');
  const warningEncryptEl = $('warning-encrypt');
  const warningDecryptEl = $('warning-decrypt');
  const srStatusEl = $('sr-status');

  const btnRandom = $('btnRandom');
  const btnIdentity = $('btnIdentity');
  const btnClearKey = $('btnClearKey');

  const btnEncrypt = $('btnEncrypt');
  const btnDecrypt = $('btnDecrypt');
  const btnClearEncrypt = $('btnClearEncrypt');
  const btnClearDecrypt = $('btnClearDecrypt');
  const btnCopyEncrypt = $('btnCopyEncrypt');
  const btnCopyDecrypt = $('btnCopyDecrypt');
  const btnSyncCiphertext = $('btnSyncCiphertext');

  const toastEl = $('toast');

  // ===== 状態 =====
  let N = 2; // ブロックサイズ（行列のサイズ: 2または3）
  let inputs = []; // 行列入力フィールドの配列
  // いまの鍵: { ok: true, matrix, analysis } または { ok: false, errors }
  let keyState = { ok: false, errors: [] };

  // ===== 小さな描画の道具 =====

  const clear = (el) => {
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  };

  /** 行列を表（両側に括弧の線）で描く */
  const matrixTable = (M, label) => {
    const table = el('table', 'mat');
    if (label) table.setAttribute('aria-label', label);
    const body = el('tbody');
    for (const row of M) {
      const tr = el('tr');
      for (const x of row) tr.appendChild(el('td', null, x));
      body.appendChild(tr);
    }
    table.appendChild(body);
    return table;
  };

  const fmtCount = (n) => n.toLocaleString('en-US');

  // ===== 鍵の入力 =====

  /**
   * 行列入力UIを描画（サイズ変更時に呼ばれる）
   * 単位行列で初期化し、入力イベントとキーナビゲーションを設定
   */
  const renderMatrixInputs = () => {
    clear(matrixArea);
    const wrap = document.createElement('div');
    wrap.className = `matrixGrid cols-${N}`;
    inputs = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.value = i === j ? '1' : '0'; // 単位行列で初期化
        inp.min = String(-H.LIMITS.cellAbs);
        inp.max = String(H.LIMITS.cellAbs);
        inp.step = '1';
        inp.dataset.row = String(i);
        inp.dataset.col = String(j);
        inp.setAttribute('aria-label', t('key.cellLabel', { row: i + 1, col: j + 1 }));
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
    const row = Number(e.target.dataset.row);
    const col = Number(e.target.dataset.col);
    let newRow = row;
    let newCol = col;
    switch (e.key) {
      case 'ArrowUp': newRow = Math.max(0, row - 1); break;
      case 'ArrowDown': newRow = Math.min(N - 1, row + 1); break;
      case 'ArrowLeft': newCol = Math.max(0, col - 1); break;
      case 'ArrowRight': newCol = Math.min(N - 1, col + 1); break;
      default: return;
    }
    e.preventDefault();
    const target = inputs[newRow * N + newCol];
    if (target) {
      target.focus();
      target.select();
    }
  };

  /** マスの値を読む。number 入力が数として読めない文字（badInput）は「整数でない」として扱う */
  const readCells = () => inputs.map((inp) => (inp.validity && inp.validity.badInput ? 'x' : inp.value));

  const setMatrix = (M) => {
    inputs.forEach((inp, idx) => {
      inp.value = String(M[Math.floor(idx / N)][idx % N]);
    });
    updateKeyInfo();
  };

  const showKeyErrors = (errors) => {
    clear(keyErrorsEl);
    inputs.forEach((inp, idx) => {
      const bad = errors.some((e) => e.index === idx);
      inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
    });
    for (const e of errors) {
      const params = Object.assign({ row: Math.floor(e.index / N) + 1, col: (e.index % N) + 1 }, e.params);
      keyErrorsEl.appendChild(el('li', null, t(e.key, params)));
    }
    keyErrorsEl.hidden = errors.length === 0;
  };

  const setStatus = (ok, key) => {
    clear(invertibleEl);
    invertibleEl.appendChild(el('span', ok ? 'ok' : 'ng', t(key)));
  };

  const updateKeyInfo = () => {
    const parsed = H.parseCells(readCells(), N);
    showKeyErrors(parsed.errors);
    if (!parsed.ok) {
      keyState = { ok: false, errors: parsed.errors };
      for (const node of [detKEl, detKmodEl, gcdEl, detInvEl]) node.textContent = t('key.none');
      setStatus(false, 'key.invalidInput');
      keyReasonEl.textContent = t('key.reason.invalid');
      clear(invMatrixEl);
      invMatrixEl.textContent = t('key.none');
      clear(invStepsEl);
      refreshOutputs();
      return;
    }
    const a = H.analyzeKey(parsed.matrix);
    keyState = { ok: true, matrix: parsed.matrix, analysis: a };
    detKEl.textContent = String(a.det);
    detKmodEl.textContent = String(a.detMod);
    gcdEl.textContent = String(a.gcd);
    detInvEl.textContent = a.detInv == null ? t('key.none') : String(a.detInv);
    setStatus(a.invertible, a.invertible ? 'key.usable' : 'key.unusable');
    keyReasonEl.textContent = t(a.invertible ? 'key.reason.ok' : `key.reason.${a.reason}`, { detMod: a.detMod, gcd: a.gcd });
    clear(invMatrixEl);
    if (a.invertible) invMatrixEl.appendChild(matrixTable(a.inverse, 'K⁻¹'));
    else invMatrixEl.textContent = t('key.inverseNone');
    renderSteps(a);
    refreshOutputs();
  };

  const updateRatio = () => {
    const c = H.invertibleCount(N);
    keyRatioEl.textContent = t('key.ratio', {
      n: N, total: fmtCount(c.total), count: fmtCount(c.count), percent: (c.ratio * 100).toFixed(1),
    });
  };

  // ===== 逆行列の計算過程 =====

  const detExpression = (K) => {
    if (K.length === 2) return `${K[0][0]}×${K[1][1]} − ${K[0][1]}×${K[1][0]}`;
    const m = (i, j) => H.minorMatrix(K, i, j);
    return K[0].map((x, j) => {
      const s = m(0, j);
      const term = `${x}×(${s[0][0]}×${s[1][1]} − ${s[0][1]}×${s[1][0]})`;
      return j === 0 ? term : `${j % 2 ? '−' : '+'} ${term}`;
    }).join(' ');
  };

  const stepBlock = (titleKey, params) => {
    const box = el('div', 'step');
    box.appendChild(el('h4', null, t(titleKey, params)));
    invStepsEl.appendChild(box);
    return box;
  };

  const matrixRow = (items) => {
    const row = el('div', 'mat-row');
    for (const [label, M] of items) {
      const fig = el('figure', 'mat-fig');
      fig.appendChild(matrixTable(M, label));
      fig.appendChild(el('figcaption', null, label));
      row.appendChild(fig);
    }
    return row;
  };

  const renderSteps = (a) => {
    clear(invStepsEl);
    const K = a.Kmod;
    const s1 = stepBlock('steps.det');
    if (keyState.matrix.some((row, i) => row.some((x, j) => x !== K[i][j]))) s1.appendChild(el('p', 'muted', t('steps.detModNote')));
    s1.appendChild(el('p', 'mono', `${detExpression(K)} = ${H.det(K)}`));
    s1.appendChild(el('p', 'mono', t('steps.detResult', { det: H.det(K), detMod: a.detMod })));

    const s2 = stepBlock('steps.inv');
    const table = el('table', 'euclid');
    const head = el('tr');
    for (const h of t('steps.invHead', { a: a.detMod }).split('|')) head.appendChild(el('th', null, h));
    const thead = el('thead');
    thead.appendChild(head);
    table.appendChild(thead);
    const body = el('tbody');
    for (const st of a.euclid.steps) {
      // 余りが 1 になった行の係数 t が逆元（mod 26 で正にした値）
      const tr = el('tr', st.r === 1 ? 'hit' : null);
      for (const v of [st.q == null ? '' : st.q, st.r, st.t]) tr.appendChild(el('td', null, v));
      body.appendChild(tr);
    }
    table.appendChild(body);
    s2.appendChild(table);
    if (!a.invertible) {
      s2.appendChild(el('p', null, t('steps.invNone', { a: a.detMod, gcd: a.gcd })));
      return;
    }
    s2.appendChild(el('p', null, t('steps.invResult', { a: a.detMod, inv: a.detInv, prod: a.detMod * a.detInv })));

    const s3 = stepBlock('steps.cof');
    s3.appendChild(matrixRow([[t('steps.raw'), a.cof], [t('steps.mod'), a.cofMod]]));
    const s4 = stepBlock('steps.adj');
    s4.appendChild(matrixRow([['adj(K)', a.adjMod]]));
    const s5 = stepBlock('steps.scale', { inv: a.detInv });
    const scaled = a.adjMod.map((row) => row.map((x) => x * a.detInv));
    s5.appendChild(matrixRow([[t('steps.scaled', { inv: a.detInv }), scaled], ['K⁻¹', a.inverse]]));
    const s6 = stepBlock('steps.check');
    s6.appendChild(matrixRow([['K', K], ['K⁻¹', a.inverse], ['K × K⁻¹', a.check]]));
  };

  // ===== 警告・通知 =====

  const showWarning = (box, message) => {
    box.textContent = message;
    box.hidden = false;
  };
  const hideWarning = (box) => {
    box.textContent = '';
    box.hidden = true;
  };

  let toastTimeout;
  const showToast = (message, type = 'info') => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastEl.textContent = String(message);
    const safeType = ['info', 'success'].includes(type) ? type : 'info';
    toastEl.className = `toast ${safeType}`;
    void toastEl.offsetWidth; // アニメーションをやり直すための reflow
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2500);
  };

  const announce = (message) => {
    srStatusEl.textContent = '';
    // 同じ文でも読み上げ直すように、次の描画で入れる
    requestAnimationFrame(() => { srStatusEl.textContent = message; });
  };

  // ===== 処理ログ =====

  const formatLog = (result, keyLabelKey) => {
    const lines = [t(keyLabelKey)];
    result.blocks.slice(0, LOG_BLOCKS).forEach((b, idx) => {
      lines.push(t('log.block', { index: idx + 1, letters: H.toLetters(b.input), nums: b.input.join(', ') }));
      for (const r of b.rows) {
        const expr = r.terms.map((x) => `${x.k}×${x.v}`).join(' + ');
        lines.push(t('log.row', { expr, sum: r.sum, value: r.value, letter: H.ALPHABET[r.value] }));
      }
      lines.push(t('log.result', { letters: H.toLetters(b.output) }));
    });
    if (result.blocks.length > LOG_BLOCKS) lines.push(t('log.more', { count: fmtCount(result.blocks.length - LOG_BLOCKS) }));
    return lines.join('\n');
  };

  // ===== 暗号化・復号（鍵・入力のどれが変わっても呼ぶ） =====

  const updateProcessedPlaintext = () => {
    const raw = plaintextEl.value;
    const norm = H.normalizeText(raw);
    const padCount = norm.letters.length === 0 ? 0 : (N - (norm.letters.length % N)) % N;
    processedPlaintextEl.textContent = norm.letters ? norm.letters + H.PAD_DEFAULT.repeat(padCount) : t('text.processedEmpty');
    const info = [];
    if (norm.letters) info.push(t('text.letters', { count: fmtCount(norm.letters.length) }));
    if (padCount) info.push(t('text.padInfo', { pad: H.PAD_DEFAULT, count: padCount }));
    if (norm.ignored) info.push(t('text.ignoredInfo', { count: fmtCount(norm.ignored) }));
    encryptInfoEl.textContent = info.join(' ');
  };

  const clearEncryptOutput = () => {
    ciphertextEncryptEl.value = '';
    logEncryptEl.textContent = '';
  };

  const clearDecryptOutput = () => {
    plaintextDecryptEl.value = '';
    logDecryptEl.textContent = '';
  };

  /** 暗号化。fromButton のときは結果を読み上げる */
  const runEncrypt = (fromButton = false) => {
    updateProcessedPlaintext();
    hideWarning(warningEncryptEl);
    if (!plaintextEl.value.trim()) {
      clearEncryptOutput();
      return;
    }
    if (!keyState.ok) {
      clearEncryptOutput();
      showWarning(warningEncryptEl, t('err.key'));
      return;
    }
    const r = H.encrypt(keyState.matrix, plaintextEl.value);
    if (!r.ok) {
      clearEncryptOutput();
      showWarning(warningEncryptEl, tm(r.error));
      return;
    }
    ciphertextEncryptEl.value = r.output;
    logEncryptEl.textContent = r.blocks.length ? formatLog(r, 'log.keyEnc') : '';
    if (fromButton) announce(t('sr.encrypted', { count: fmtCount(r.output.length) }));
  };

  /** 復号。長さの不足は、入力中は控えめに、ボタンでは警告として出す */
  const runDecrypt = (fromButton = false) => {
    hideWarning(warningDecryptEl);
    decryptStatusEl.textContent = '';
    if (!ciphertextDecryptEl.value.trim()) {
      clearDecryptOutput();
      return;
    }
    if (!keyState.ok) {
      clearDecryptOutput();
      showWarning(warningDecryptEl, t('err.key'));
      return;
    }
    const r = H.decrypt(keyState.matrix, ciphertextDecryptEl.value);
    if (!r.ok) {
      clearDecryptOutput();
      if (r.error.key === 'err.length' && !fromButton) decryptStatusEl.textContent = t('err.lengthSoft', r.error.params);
      else showWarning(warningDecryptEl, tm(r.error));
      return;
    }
    plaintextDecryptEl.value = r.output;
    logDecryptEl.textContent = r.blocks.length ? formatLog(r, 'log.keyDec') : '';
    decryptStatusEl.textContent = t('text.letters', { count: fmtCount(r.letters.length) });
    if (fromButton) announce(t('sr.decrypted', { count: fmtCount(r.output.length) }));
  };

  const refreshOutputs = () => {
    runEncrypt();
    runDecrypt();
    document.dispatchEvent(new Event('hillkeychange'));
  };

  // ===== イベント =====

  const setSize = (n) => {
    N = n;
    size2Btn.classList.toggle('active', n === 2);
    size3Btn.classList.toggle('active', n === 3);
    size2Btn.setAttribute('aria-pressed', String(n === 2));
    size3Btn.setAttribute('aria-pressed', String(n === 3));
    updateRatio();
    renderMatrixInputs();
  };

  size2Btn.addEventListener('click', () => setSize(2));
  size3Btn.addEventListener('click', () => setSize(3));

  btnIdentity.addEventListener('click', () => setMatrix(H.identity(N)));
  btnClearKey.addEventListener('click', () => setMatrix(H.zeros(N)));
  btnRandom.addEventListener('click', () => {
    const { matrix, tries } = H.randomInvertible(N);
    setMatrix(matrix);
    showToast(t('key.randomDone', { tries }), 'success');
  });

  btnEncrypt.addEventListener('click', () => runEncrypt(true));
  btnDecrypt.addEventListener('click', () => runDecrypt(true));
  plaintextEl.addEventListener('input', () => runEncrypt());
  ciphertextDecryptEl.addEventListener('input', () => runDecrypt());

  btnClearEncrypt.addEventListener('click', () => {
    plaintextEl.value = '';
    runEncrypt();
    showToast(t('toast.clearedEncrypt'), 'info');
  });

  btnClearDecrypt.addEventListener('click', () => {
    ciphertextDecryptEl.value = '';
    runDecrypt();
    showToast(t('toast.clearedDecrypt'), 'info');
  });

  /** ボタンの文言を一時的に変えて戻す */
  const flash = (btn, doneKey, backKey) => {
    btn.textContent = t(doneKey);
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = t(backKey);
      btn.classList.remove('copied');
    }, 2000);
  };

  const copyText = async (text, btn, doneToastKey) => {
    if (!text) {
      showToast(t('toast.nothingToCopy'), 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      flash(btn, 'btn.copied', 'btn.copy');
      showToast(t(doneToastKey), 'success');
    } catch (err) {
      showToast(t('toast.copyFailed'), 'info');
    }
  };

  btnCopyEncrypt.addEventListener('click', () => copyText(ciphertextEncryptEl.value, btnCopyEncrypt, 'toast.copiedCipher'));
  btnCopyDecrypt.addEventListener('click', () => copyText(plaintextDecryptEl.value, btnCopyDecrypt, 'toast.copiedPlain'));

  // 暗号化タブの暗号文を復号タブへ写す
  btnSyncCiphertext.addEventListener('click', () => {
    const encryptedText = ciphertextEncryptEl.value;
    if (!encryptedText) {
      showWarning(warningDecryptEl, t('err.syncEmpty'));
      return;
    }
    ciphertextDecryptEl.value = encryptedText;
    runDecrypt(true);
    showToast(t('toast.synced'), 'success');
    flash(btnSyncCiphertext, 'btn.synced', 'btn.sync');
  });

  // タブの切り替え（WAI-ARIA のタブ。選んだタブだけ Tab キーで止まり、左右・Home・End で移る）
  const tabs = [...document.querySelectorAll('.tab')];
  const selectTab = (tab, focus = false) => {
    for (const x of tabs) {
      const on = x === tab;
      x.classList.toggle('active', on);
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
    }
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.toggle('active', content.id === `tab-${tab.dataset.tab}`);
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[(next + tabs.length) % tabs.length], true);
    });
  });

  // 初期化
  setSize(2);

  // ほかの画面（解読タブなど）から使う部品
  globalThis.HillApp = {
    getKey: () => ({ n: N, ...keyState }),
    refresh: () => { updateKeyInfo(); updateRatio(); },
    setKey(n, M) {
      setSize(n);
      setMatrix(M);
    },
    selectTab(name) {
      const tab = tabs.find((x) => x.dataset.tab === name);
      if (tab) selectTab(tab);
    },
    el, clear, matrixTable, showToast, fmtCount, announce,
  };
})();
