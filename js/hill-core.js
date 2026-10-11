/* ============================================================================
 * Hill CipherLab - 計算部（DOM に依存しない通常のスクリプト。globalThis.HillCore に置く）
 * ============================================================================
 *
 * - 文字の数値化（A=0 … Z=25）、行列式・余因子・随伴・逆行列（mod 26）、暗号化・復号
 * - 画面に出す文言は持たず、{ key, params } の形で返す（文言は js/messages.js）
 * - 画面（script.js）とテスト（test/*.test.js）の両方から読む
 * ============================================================================
 */
(function (root) {
  'use strict';

  const MOD = 26;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const SIZES = [2, 3];
  // letters: 処理する英字の上限（パディングの前）／inputChars: 入力欄の文字数の上限／cellAbs: 鍵のマスの絶対値の上限
  const LIMITS = { letters: 10000, inputChars: 100000, cellAbs: 999 };
  const PAD_DEFAULT = 'X';

  const msg = (key, params) => (params ? { key, params } : { key });

  // ===== 整数の計算 =====

  /** 常に 0 以上 m 未満を返す剰余 */
  const mod = (a, m = MOD) => ((a % m) + m) % m;

  /** 最大公約数（ユークリッドの互除法） */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  }

  /**
   * 拡張ユークリッドの互除法で a の逆元（mod m）を求め、表に出す途中の行も返す
   * 行は { q, r, t }（r = 余り、t = a に掛ける係数。r ≡ t·a (mod m)）
   */
  function egcdSteps(a, m = MOD) {
    a = mod(a, m);
    const steps = [{ q: null, r: m, t: 0 }, { q: null, r: a, t: 1 }];
    let [r0, r1, t0, t1] = [m, a, 0, 1];
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      [r0, r1] = [r1, r0 - q * r1];
      [t0, t1] = [t1, t0 - q * t1];
      steps.push({ q, r: r1, t: t1 });
    }
    return { gcd: r0, inverse: r0 === 1 ? mod(t0, m) : null, steps };
  }

  /** a の逆元（mod m）。存在しなければ null */
  const modInv = (a, m = MOD) => egcdSteps(a, m).inverse;

  // ===== 文字と数値 =====

  /**
   * 入力を英字の列にそろえる。全角英字は NFKC で半角に、小文字は大文字にする
   * 空白・改行は数えず、それ以外の英字でない文字は ignored に数える
   */
  function normalizeText(s) {
    const t = String(s == null ? '' : s).normalize('NFKC').toUpperCase();
    let letters = '';
    let ignored = 0;
    for (const ch of t) {
      if (ch >= 'A' && ch <= 'Z') letters += ch;
      else if (!/\s/.test(ch)) ignored += 1;
    }
    return { letters, ignored };
  }

  const toNums = (letters) => [...letters].map((c) => c.charCodeAt(0) - 65);
  const toLetters = (nums) => nums.map((n) => ALPHABET[mod(n)]).join('');

  // ===== 行列 =====

  const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)));
  const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));
  const transpose = (M) => M[0].map((_, j) => M.map((row) => row[j]));
  const reduce = (M, m = MOD) => M.map((row) => row.map((x) => mod(x, m)));

  /** i 行・j 列を除いた小行列 */
  const minorMatrix = (M, i, j) => M.filter((_, r) => r !== i).map((row) => row.filter((__, c) => c !== j));

  /** 行列式（整数のまま。余因子展開。n は 6 まで） */
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    let s = 0;
    for (let j = 0; j < n; j++) {
      if (M[0][j] !== 0) s += (j % 2 ? -1 : 1) * M[0][j] * det(minorMatrix(M, 0, j));
    }
    return s;
  }

  /** 余因子行列（整数のまま）。(i, j) 成分 = (−1)^(i+j)·det(M_ij) */
  function cofactorMatrix(M) {
    const n = M.length;
    if (n === 1) return [[1]];
    return M.map((_, i) => M.map((__, j) => ((i + j) % 2 ? -1 : 1) * det(minorMatrix(M, i, j))));
  }

  /** 随伴行列（余因子行列の転置。整数のまま） */
  const adjugate = (M) => transpose(cofactorMatrix(M));

  function matMul(A, B, m = MOD) {
    return A.map((row) => B[0].map((_, j) => mod(row.reduce((s, x, k) => s + x * B[k][j], 0), m)));
  }

  function matVec(M, v, m = MOD) {
    return M.map((row) => mod(row.reduce((s, x, k) => s + x * v[k], 0), m));
  }

  const isIdentity = (M) => M.every((row, i) => row.every((x, j) => x === (i === j ? 1 : 0)));

  /**
   * 鍵の検証。K は画面に入力した整数のまま（負の数も可）
   * reason: null（使える）／'even'（det が偶数）／'mult13'（13 の倍数）／'both'（26 の倍数）
   */
  function analyzeKey(K) {
    const n = K.length;
    const d = det(K);
    const detMod = mod(d);
    const g = gcd(detMod, MOD);
    const even = detMod % 2 === 0;
    const m13 = detMod % 13 === 0;
    const reason = g === 1 ? null : (even && m13 ? 'both' : (even ? 'even' : 'mult13'));
    const euclid = egcdSteps(detMod);
    const Kmod = reduce(K);
    const cof = cofactorMatrix(Kmod);
    const adj = transpose(cof);
    const result = {
      n, det: d, detMod, gcd: g, invertible: g === 1, reason, detInv: euclid.inverse, euclid,
      Kmod, cof, cofMod: reduce(cof), adj, adjMod: reduce(adj), inverse: null, check: null,
    };
    if (g === 1) {
      result.inverse = result.adjMod.map((row) => row.map((x) => mod(x * euclid.inverse)));
      result.check = matMul(Kmod, result.inverse);
    }
    return result;
  }

  /** 逆行列（mod 26）。存在しなければ null */
  const inverse = (K) => analyzeKey(K).inverse;

  // ===== 鍵の入力 =====

  /**
   * 鍵のマスの文字列を整数に読む。全角の数字・マイナス記号も受け付ける
   * 返り値: { ok, matrix（整数のまま）, errors: [{ index, key }] }
   */
  function parseCells(values, n) {
    const errors = [];
    const nums = values.map((raw, index) => {
      const s = String(raw == null ? '' : raw).normalize('NFKC').trim().replace(/^[\u2212\u2012\u2013\u2014]/, '-');
      if (s === '') {
        errors.push({ index, key: 'err.cell.empty' });
        return 0;
      }
      if (!/^[+-]?\d+$/.test(s)) {
        errors.push({ index, key: 'err.cell.notInteger' });
        return 0;
      }
      const v = Number(s);
      if (Math.abs(v) > LIMITS.cellAbs) {
        errors.push({ index, key: 'err.cell.range', params: { limit: LIMITS.cellAbs } });
        return 0;
      }
      return v;
    });
    const matrix = Array.from({ length: n }, (_, i) => nums.slice(i * n, i * n + n));
    return { ok: errors.length === 0, matrix, errors };
  }

  // ===== 暗号化・復号 =====

  /** 1 ブロックの計算の中身（行ごとの積和と剰余）。画面の処理ログに使う */
  function blockSteps(M, v) {
    return M.map((row) => {
      const terms = row.map((k, j) => ({ k, v: v[j] }));
      const sum = terms.reduce((s, t) => s + t.k * t.v, 0);
      return { terms, sum, value: mod(sum) };
    });
  }

  function runBlocks(M, nums) {
    const n = M.length;
    const blocks = [];
    const out = [];
    for (let i = 0; i < nums.length; i += n) {
      const input = nums.slice(i, i + n);
      const rows = blockSteps(M, input);
      const output = rows.map((r) => r.value);
      blocks.push({ input, output, rows });
      out.push(...output);
    }
    return { blocks, out };
  }

  function checkInput(text) {
    const raw = String(text == null ? '' : text);
    if (raw.length > LIMITS.inputChars) return { error: msg('err.inputTooLong', { limit: LIMITS.inputChars }) };
    const norm = normalizeText(raw);
    if (norm.letters.length > LIMITS.letters) {
      return { error: msg('err.tooLong', { limit: LIMITS.letters, count: norm.letters.length }) };
    }
    return { norm };
  }

  /**
   * 暗号化。K は整数の行列（入力のまま）。英字以外は除き、足りない分を pad で埋める
   * 返り値: { ok, letters, processed, padCount, ignored, output, blocks } または { ok: false, error }
   */
  function encrypt(K, text, opts = {}) {
    const pad = opts.pad || PAD_DEFAULT;
    const a = analyzeKey(K);
    if (!a.invertible) return { ok: false, error: msg('err.notInvertible', { gcd: a.gcd }) };
    const c = checkInput(text);
    if (c.error) return { ok: false, error: c.error };
    const n = K.length;
    const { letters, ignored } = c.norm;
    const padCount = letters.length === 0 ? 0 : (n - (letters.length % n)) % n;
    const processed = letters + pad.repeat(padCount);
    const { blocks, out } = runBlocks(a.Kmod, toNums(processed));
    return { ok: true, letters, processed, padCount, ignored, output: toLetters(out), blocks, key: a.Kmod };
  }

  /**
   * 復号。英字の数がブロックの大きさの倍数でなければ、パディングせずに止める
   * 返り値: { ok, letters, ignored, output, blocks } または { ok: false, error }
   */
  function decrypt(K, text) {
    const a = analyzeKey(K);
    if (!a.invertible) return { ok: false, error: msg('err.notInvertible', { gcd: a.gcd }) };
    const c = checkInput(text);
    if (c.error) return { ok: false, error: c.error };
    const n = K.length;
    const { letters, ignored } = c.norm;
    const rem = letters.length % n;
    if (rem !== 0) {
      return { ok: false, error: msg('err.length', { count: letters.length, n, rem, missing: n - rem }) };
    }
    const { blocks, out } = runBlocks(a.inverse, toNums(letters));
    return { ok: true, letters, ignored, output: toLetters(out), blocks, key: a.inverse };
  }

  // ===== 乱数と鍵の数 =====

  /** crypto.getRandomValues で 0 以上 k 未満の整数を偏りなく作る（拒否サンプリング） */
  function cryptoRandomBelow(k) {
    const c = root.crypto;
    if (!c || typeof c.getRandomValues !== 'function') throw new Error('crypto.getRandomValues is not available');
    const limit = Math.floor(0x100000000 / k) * k;
    const buf = new Uint32Array(1);
    for (;;) {
      c.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % k;
    }
  }

  /** 可逆な鍵を乱数で作る。randomBelow は差し替えられる（テスト用）。返り値: { matrix, tries } */
  function randomInvertible(n, randomBelow = cryptoRandomBelow, maxTries = 1000) {
    for (let tries = 1; tries <= maxTries; tries++) {
      const M = Array.from({ length: n }, () => Array.from({ length: n }, () => randomBelow(MOD)));
      if (gcd(mod(det(M)), MOD) === 1) return { matrix: M, tries };
    }
    return { matrix: identity(n), tries: maxTries };
  }

  /** GF(p) 上の n×n 正則行列の個数 */
  function glCount(n, p) {
    const P = BigInt(p);
    const pn = P ** BigInt(n);
    let r = 1n;
    for (let k = 0; k < n; k++) r *= pn - P ** BigInt(k);
    return r;
  }

  /**
   * mod 26 で可逆な n×n 行列の個数。26 = 2 × 13 なので GF(2) と GF(13) の個数の積（中国剰余定理）
   * 返り値: { count, total, ratio }（count・total は BigInt）
   */
  function invertibleCount(n) {
    const count = glCount(n, 2) * glCount(n, 13);
    const total = BigInt(MOD) ** BigInt(n * n);
    return { count, total, ratio: Number((count * 1000000000n) / total) / 1e9 };
  }

  root.HillCore = {
    MOD, ALPHABET, SIZES, LIMITS, PAD_DEFAULT,
    mod, gcd, egcdSteps, modInv,
    normalizeText, toNums, toLetters,
    identity, zeros, transpose, reduce, minorMatrix, det, cofactorMatrix, adjugate, matMul, matVec, isIdentity,
    analyzeKey, inverse, parseCells,
    blockSteps, encrypt, decrypt,
    cryptoRandomBelow, randomInvertible, glCount, invertibleCount,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
