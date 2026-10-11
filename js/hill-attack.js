/* ============================================================================
 * Hill CipherLab - 解読の計算部（DOM に依存しない通常のスクリプト。globalThis.HillAttack に置く）
 * ============================================================================
 *
 * - 既知平文攻撃: 平文と暗号文の組から K を求める。26 = 2 × 13 なので、mod 2 と mod 13 で
 *   別々に連立一次方程式を解き、中国剰余定理で mod 26 に戻す（平文の行列が mod 26 で非可逆でも解ける）
 * - クリブの位置探し: 平文の一部（クリブ）しかわからないとき、暗号文のどの位置に当たるかを全部試す
 * - 暗号文単独攻撃: K⁻¹ を 1 行ずつ総当たりし、戻した文字の英語らしさで順位をつけ、上位の行を組み合わせる
 *   （Bauer & Millward, "Cracking Matrix Encryption Row by Row", Cryptologia 31(1), 2007）
 * - 画面に出す文言は持たず、{ key, params } の形で返す（文言は js/messages.js）
 * ============================================================================
 */
(function (root) {
  'use strict';

  const H = root.HillCore;
  const msg = (key, params) => (params ? { key, params } : { key });
  const { mod } = H;

  // 暗号文単独攻撃で行の採点に使う英字の数の上限と、組み合わせる上位の行の数
  const COA = { scoreLetters: 1200, top: { 2: 12, 3: 20 }, minBlocks: 6, alternatives: 5 };
  // クリブの位置探しで、候補の採点に使う英字の数と、返す候補の数
  const CRIB = { scoreLetters: 400, results: 10 };
  // 英字の目安（参照実装で、無作為の鍵と英文の切り出しを試した結果。README の表と同じ値）
  const GUIDE = { 2: 30, 3: 90 };

  const english = () => root.HillEnglish;

  /** 数の列を n 個ずつのブロックにする（余りは捨てる） */
  function blocksOf(nums, n) {
    const out = [];
    for (let i = 0; i + n <= nums.length; i += n) out.push(nums.slice(i, i + n));
    return out;
  }

  /** 中国剰余定理: x ≡ a (mod 2) かつ x ≡ b (mod 13) を満たす 0〜25 の x（13·1 ≡ 1 mod 2、2·7 ≡ 1 mod 13） */
  const crt = (a, b) => mod(13 * a + 14 * b);

  /**
   * GF(p) 上で、すべてのブロック j について K·p_j ≡ c_j となる K を求める（p は素数）
   * Pᵀ·Kᵀ = Cᵀ を掃き出し法で解く。返り値: { p, rank, consistent, key（一意に決まらなければ null）, free }
   * free = 一意に決まらないときに残る候補の数の指数（p^free 通り）
   */
  function solveModP(P, C, n, p) {
    const M = P.map((pb, j) => [...pb.map((x) => mod(x, p)), ...C[j].map((x) => mod(x, p))]);
    let rank = 0;
    for (let col = 0; col < n && rank < M.length; col++) {
      const pr = M.findIndex((row, i) => i >= rank && row[col] !== 0);
      if (pr < 0) continue;
      [M[rank], M[pr]] = [M[pr], M[rank]];
      const inv = H.modInv(M[rank][col], p);
      M[rank] = M[rank].map((x) => mod(x * inv, p));
      for (let i = 0; i < M.length; i++) {
        if (i !== rank && M[i][col] !== 0) {
          const f = M[i][col];
          M[i] = M[i].map((x, k) => mod(x - f * M[rank][k], p));
        }
      }
      rank++;
    }
    const consistent = M.slice(rank).every((row) => row.slice(n).every((x) => x === 0));
    const free = n * (n - rank);
    if (!consistent || rank < n) return { p, rank, consistent, key: null, free };
    // 上の n 行が [I | Kᵀ] になっている
    const KT = M.slice(0, n).map((row) => row.slice(n));
    return { p, rank, consistent, key: H.transpose(KT), free };
  }

  /** 平文のブロックと暗号文のブロックから、mod 2 と mod 13 で解いて mod 26 の K を組み立てる */
  function solveBlocks(P, C, n) {
    const r2 = solveModP(P, C, n, 2);
    const r13 = solveModP(P, C, n, 13);
    const out = { mod2: r2, mod13: r13, consistent: r2.consistent && r13.consistent, key: null, invertible: false };
    if (out.consistent && r2.key && r13.key) {
      out.key = r2.key.map((row, i) => row.map((x, j) => crt(x, r13.key[i][j])));
      out.invertible = H.analyzeKey(out.key).invertible;
    }
    return out;
  }

  /** 平文の行列（列＝ブロック）が mod 26 で可逆になる n 個のブロックを、先頭から探す（直接 K = C·P⁻¹ で解ける組） */
  function findDirect(P, C, n, limit = 12) {
    const m = Math.min(P.length, limit);
    const pick = (start, chosen) => {
      if (chosen.length === n) {
        const Pm = H.transpose(chosen.map((j) => P[j]));
        const a = H.analyzeKey(Pm);
        if (!a.invertible) return null;
        const Cm = H.transpose(chosen.map((j) => C[j]));
        return { indices: chosen.slice(), P: Pm, Pinv: a.inverse, detP: a.detMod, C: Cm, K: H.matMul(Cm, a.inverse) };
      }
      for (let j = start; j < m; j++) {
        const r = pick(j + 1, [...chosen, j]);
        if (r) return r;
      }
      return null;
    };
    return pick(0, []);
  }

  /**
   * 既知平文攻撃。平文と暗号文は先頭からそろっているものとする（英字以外は除く）
   * status: 'solved'（鍵が一意に決まり可逆）／'ambiguous'（ブロックが足りず候補が残る）／
   *         'notInvertible'（決まった行列が鍵として使えない）／'inconsistent'（この大きさのヒル暗号では説明できない）
   */
  function knownPlaintext(n, plainText, cipherText) {
    const p = H.normalizeText(plainText).letters;
    const c = H.normalizeText(cipherText).letters;
    if (!p || !c) return { ok: false, error: msg('kpa.err.empty') };
    const len = Math.min(p.length, c.length);
    const m = Math.floor(len / n);
    if (m < n) return { ok: false, error: msg('kpa.err.short', { n, need: n * n, have: len }) };
    const P = blocksOf(H.toNums(p.slice(0, m * n)), n);
    const C = blocksOf(H.toNums(c.slice(0, m * n)), n);
    const s = solveBlocks(P, C, n);
    let status = 'ambiguous';
    if (!s.consistent) status = 'inconsistent';
    else if (s.key) status = s.invertible ? 'solved' : 'notInvertible';
    const result = {
      ok: true, n, status, blocks: m, used: m * n, plainLetters: p.length, cipherLetters: c.length,
      rank2: s.mod2.rank, rank13: s.mod13.rank, key2: s.mod2.key, key13: s.mod13.key, key: s.key,
      candidates2: 2 ** s.mod2.free, candidates13: 13 ** s.mod13.free, direct: findDirect(P, C, n),
    };
    if (status === 'solved') {
      result.inverse = H.inverse(s.key);
      if (c.length % n === 0) result.decrypted = H.decrypt(s.key, c).output;
    }
    return result;
  }

  /** 英字の列の英語らしさ（バイグラムの log10 の平均。高いほど英語らしい） */
  function bigramScore(nums) {
    const E = english();
    if (nums.length < 2) return -Infinity;
    let s = 0;
    for (let i = 0; i + 1 < nums.length; i++) s += E.BIGRAM[nums[i]][nums[i + 1]];
    return s / (nums.length - 1) / E.SCALE;
  }

  /**
   * クリブの位置探し。平文の一部 crib が暗号文のどこかに対応すると仮定し、すべての位置で既知平文攻撃を試す
   * 鍵が一意に決まり可逆になった位置を、復号した文の英語らしさで並べる
   */
  function cribSearch(n, cipherText, crib) {
    const c = H.normalizeText(cipherText).letters;
    const w = H.normalizeText(crib).letters;
    if (!c) return { ok: false, error: msg('crib.err.noCipher') };
    if (c.length % n !== 0) return { ok: false, error: msg('err.length', { count: c.length, n, rem: c.length % n, missing: n - (c.length % n) }) };
    if (w.length < n * n) return { ok: false, error: msg('crib.err.short', { n, need: n * n, have: w.length }) };
    if (w.length > c.length) return { ok: false, error: msg('crib.err.longer', { crib: w.length, cipher: c.length }) };
    const C = blocksOf(H.toNums(c), n);
    const head = H.toNums(c.slice(0, CRIB.scoreLetters - (CRIB.scoreLetters % n)));
    const results = [];
    let tried = 0;
    let enough = 0;
    for (let pos = 0; pos + w.length <= c.length; pos++) {
      tried++;
      const idx = [];
      for (let b = Math.ceil(pos / n); (b + 1) * n <= pos + w.length; b++) idx.push(b);
      if (idx.length < n) continue;
      enough++;
      const P = idx.map((b) => H.toNums(w.slice(b * n - pos, b * n - pos + n)));
      const s = solveBlocks(P, idx.map((b) => C[b]), n);
      if (!s.key || !s.invertible) continue;
      const inv = H.inverse(s.key);
      const plain = [];
      for (const b of blocksOf(head, n)) plain.push(...H.matVec(inv, b));
      results.push({ pos, blocks: idx.length, key: s.key, inverse: inv, score: bigramScore(plain) });
    }
    results.sort((a, b) => b.score - a.score || a.pos - b.pos);
    const top = results.slice(0, CRIB.results).map((r) => Object.assign(r, { plaintext: H.decrypt(r.key, c).output }));
    return { ok: true, n, letters: c.length, cribLetters: w.length, tried, enough, found: results.length, results: top };
  }

  /** 0〜26^n−1 の番号を、長さ n の行ベクトル（各成分 0〜25）にする */
  function rowOf(index, n) {
    const r = new Array(n);
    for (let k = n - 1; k >= 0; k--) {
      r[k] = index % 26;
      index = Math.floor(index / 26);
    }
    return r;
  }

  /**
   * 暗号文単独攻撃（行ごとの総当たり）
   * 1. K⁻¹ の候補の行 r（26^n 通り）ごとに、各ブロック c で r·c mod 26 を計算すると、平文のブロックの
   *    その位置の文字の列になる。正しい行なら英語の単文字の分布に近いので、log 確率の和で順位をつける
   * 2. 上位の行を並べ替えて K⁻¹ の候補を作り、可逆なものを復号して、バイグラムの英語らしさで選ぶ
   */
  function ciphertextOnly(n, cipherText) {
    const E = english();
    const c = H.normalizeText(cipherText).letters;
    if (!c) return { ok: false, error: msg('coa.err.empty') };
    if (c.length % n !== 0) return { ok: false, error: msg('err.length', { count: c.length, n, rem: c.length % n, missing: n - (c.length % n) }) };
    if (c.length < n * COA.minBlocks) return { ok: false, error: msg('coa.err.short', { need: n * COA.minBlocks, have: c.length }) };
    const used = Math.min(c.length, COA.scoreLetters - (COA.scoreLetters % n));
    const B = blocksOf(H.toNums(c.slice(0, used)), n);
    const total = 26 ** n;
    const rows = [];
    let skipped = 0;
    for (let idx = 0; idx < total; idx++) {
      const r = rowOf(idx, n);
      // 成分がすべて偶数か、すべて 13 の倍数の行は、可逆な行列の行になれない
      if (r.reduce((g, x) => H.gcd(g, x), 26) !== 1) {
        skipped++;
        continue;
      }
      let s = 0;
      for (const b of B) {
        let v = 0;
        for (let k = 0; k < n; k++) v += r[k] * b[k];
        s += E.UNIGRAM[v % 26];
      }
      rows.push({ row: r, score: s / B.length / E.SCALE });
    }
    rows.sort((a, b) => b.score - a.score);
    const top = rows.slice(0, COA.top[n]);
    const combos = [];
    let tried = 0;
    const pick = (chosen) => {
      if (chosen.length === n) {
        const Ki = chosen.map((x) => x.row);
        if (H.gcd(mod(H.det(Ki)), 26) !== 1) return;
        tried++;
        const plain = [];
        for (const b of B) plain.push(...H.matVec(Ki, b));
        combos.push({ inverse: Ki, score: bigramScore(plain) });
        return;
      }
      for (const x of top) if (!chosen.includes(x)) pick([...chosen, x]);
    };
    pick([]);
    combos.sort((a, b) => b.score - a.score);
    const withText = (x) => {
      const key = H.inverse(x.inverse);
      return { inverse: x.inverse, key, score: x.score, plaintext: H.decrypt(key, c).output };
    };
    return {
      ok: true, n, letters: c.length, scored: used, rowsTried: rows.length, rowsSkipped: skipped, combosTried: tried,
      rows: rows.slice(0, 10), best: combos.length ? withText(combos[0]) : null,
      alternatives: combos.slice(1, COA.alternatives).map(withText), guide: GUIDE[n], short: c.length < GUIDE[n],
    };
  }

  root.HillAttack = { COA, CRIB, GUIDE, blocksOf, crt, solveModP, solveBlocks, findDirect, knownPlaintext, bigramScore, cribSearch, rowOf, ciphertextOnly };
})(typeof globalThis !== 'undefined' ? globalThis : this);
