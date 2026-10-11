import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';

load('js/hill-core.js');
load('js/english-stats.js');
load('js/hill-attack.js');
load('js/samples.js');
const H = globalThis.HillCore;
const A = globalThis.HillAttack;
const S = globalThis.HillSamples;
const E = globalThis.HillEnglish;

const K2 = [[3, 3], [2, 5]];
const K3 = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
const LETTERS = H.normalizeText(S.TEXT).letters;

test('暗号文単独攻撃: 2×2と3×3のサンプルの鍵と全文を復元', () => {
  for (const s of S.COA) {
    const plain = LETTERS.slice(0, s.letters);
    const r = A.ciphertextOnly(s.n, H.encrypt(s.key, plain).output);
    assert.equal(r.ok, true);
    assert.deepEqual(r.best.key, s.key);
    assert.equal(r.best.plaintext, plain);
    assert.equal(r.rowsTried + r.rowsSkipped, 26 ** s.n);
    for (const x of [r.best, ...r.alternatives]) assert.equal(H.encrypt(x.key, x.plaintext).output, H.encrypt(s.key, plain).output);
  }
});

test('解読の入力制限は切り捨てずに誤りを返す', () => {
  assert.equal(A.knownPlaintext(2, 'A'.repeat(10001), 'ABCD').error.key, 'err.tooLong');
  assert.equal(A.knownPlaintext(2, ' '.repeat(100001), 'ABCD').error.key, 'err.inputTooLong');
  assert.equal(A.cribSearch(2, 'A'.repeat(2002), 'HELP').error.key, 'err.tooLong');
  assert.equal(A.cribSearch(2, 'A'.repeat(300), 'A'.repeat(201)).error.key, 'err.tooLong');
  assert.equal(A.ciphertextOnly(3, 'A'.repeat(10002)).error.key, 'err.tooLong');
  assert.equal(A.ciphertextOnly(2, 'ABC').error.key, 'err.length');
  assert.equal(A.ciphertextOnly(2, 'ABCD').error.key, 'coa.err.short');
});

test('クリブの端の不完全なブロックも一致する必要がある', () => {
  const ct = H.encrypt(S.CRIB.key, LETTERS.slice(0, S.CRIB.letters)).output;
  for (const crib of ['THELIGHTHOUSE', 'XHELIGHTHOUSE', 'THELIGHTHOUSX']) {
    const r = A.cribSearch(3, ct, crib);
    for (const x of r.results) assert.equal(x.plaintext.slice(x.pos, x.pos + crib.length), crib);
    if (crib !== 'THELIGHTHOUSE') assert.ok(!r.results.some((x) => x.pos === 80));
  }
});

/** 再現できる擬似乱数（テスト用。core.test.js と同じ形） */
function lcg(seed) {
  let s = seed >>> 0;
  return (k) => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 8) % k;
  };
}

test('英語の統計: 単文字の確率の和がほぼ 1、バイグラムは 26×26', () => {
  const sum = E.UNIGRAM.reduce((s, v) => s + 10 ** (v / E.SCALE), 0);
  assert.ok(Math.abs(sum - 1) < 0.02, String(sum));
  assert.equal(E.BIGRAM.length, 26);
  assert.ok(E.BIGRAM.every((r) => r.length === 26 && r.every((v) => Number.isInteger(v) && v <= 0 && v >= E.FLOOR)));
  // E と T が多く、Z と Q が少ない
  const order = E.UNIGRAM.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map((x) => H.ALPHABET[x[1]]);
  assert.deepEqual(order.slice(0, 2), ['E', 'T']);
  assert.ok(['Q', 'Z', 'J', 'X'].includes(order[25]));
  assert.equal(E.SOURCES.length, 10);
});

test('中国剰余定理: 26 通りの (mod 2, mod 13) の組と 0〜25 が 1 対 1', () => {
  const seen = new Set();
  for (let a = 0; a < 2; a++) {
    for (let b = 0; b < 13; b++) {
      const x = A.crt(a, b);
      assert.equal(x % 2, a);
      assert.equal(x % 13, b);
      seen.add(x);
    }
  }
  assert.equal(seen.size, 26);
});

test('既知平文攻撃: HELP / HIAT から README の鍵が直接（K = C·P⁻¹）求まる', () => {
  const r = A.knownPlaintext(2, 'HELP', 'HIAT');
  assert.equal(r.status, 'solved');
  assert.deepEqual(r.key, K2);
  assert.deepEqual(r.inverse, [[15, 17], [20, 9]]);
  assert.deepEqual(r.direct.indices, [0, 1]);
  assert.deepEqual(r.direct.P, [[7, 11], [4, 15]]);
  assert.equal(r.direct.detP, 9);
  assert.deepEqual(r.direct.K, K2);
  assert.equal(r.decrypted, 'HELP');
});

test('既知平文攻撃: 平文の英字がすべて偶数番目（ACEG）だと mod 2 の情報がなく、16 通り残る', () => {
  const c = H.encrypt(K2, 'ACEG').output;
  assert.equal(c, 'GKEM');
  const r = A.knownPlaintext(2, 'ACEG', c);
  assert.equal(r.status, 'ambiguous');
  assert.equal(r.rank2, 0);
  assert.equal(r.rank13, 2);
  assert.equal(r.candidates2, 16);
  assert.equal(r.candidates13, 1);
  assert.equal(r.key, null);
  assert.equal(r.direct, null);
  // mod 13 の側だけは決まっている
  assert.deepEqual(r.key13, H.reduce(K2, 13));
});

test('既知平文攻撃: ACEGHELP にすると決まる（直接解ける組はブロック 3・4）', () => {
  const c = H.encrypt(K2, 'ACEGHELP').output;
  const r = A.knownPlaintext(2, 'ACEGHELP', c);
  assert.equal(r.status, 'solved');
  assert.deepEqual(r.key, K2);
  assert.deepEqual(r.direct.indices, [2, 3]);
});

test('既知平文攻撃: どの組も mod 26 で可逆でなくても、mod 2 と mod 13 に分けると解ける', () => {
  // ブロック (1,0)・(0,2)・(2,1)…: どの 2 つを選んでも行列式が偶数か 13 の倍数になる組を探して確かめる
  const rnd = lcg(2026);
  let found = 0;
  for (let t = 0; t < 4000 && found < 20; t++) {
    const plain = Array.from({ length: 8 }, () => H.ALPHABET[rnd(26)]).join('');
    const c = H.encrypt(K2, plain).output;
    const r = A.knownPlaintext(2, plain, c);
    if (r.status === 'solved' && r.direct === null) {
      found++;
      assert.deepEqual(r.key, K2, plain);
    }
  }
  assert.equal(found, 20);
});

test('既知平文攻撃: 3×3（ATTACKATDAWN は先頭がどれも A なので決まらず、RETREAT… は決まる）', () => {
  const dawn = H.encrypt(K3, 'ATTACKATDAWN');
  const r1 = A.knownPlaintext(3, 'ATTACKATDAWN', dawn.output);
  assert.equal(r1.status, 'ambiguous');
  assert.equal(r1.rank2, 2);
  assert.equal(r1.rank13, 2);
  assert.equal(r1.candidates2, 8);
  assert.equal(r1.candidates13, 2197);
  const ret = H.encrypt(K3, 'RETREATNOWPLEASE');
  const r2 = A.knownPlaintext(3, ret.processed, ret.output);
  assert.equal(r2.status, 'solved');
  assert.deepEqual(r2.key, K3);
});

test('既知平文攻撃: 説明できない組・鍵にならない行列・足りない長さ', () => {
  assert.equal(A.knownPlaintext(2, 'AAAA', 'ABCD').status, 'inconsistent');
  // 非可逆な行列で作った「暗号文」からは、その行列が一意に決まるが鍵ではない
  const bad = [[2, 0], [0, 1]];
  const P = 'HELPMEOK';
  const C = H.toLetters(A.blocksOf(H.toNums(P), 2).flatMap((b) => H.matVec(bad, b)));
  const r = A.knownPlaintext(2, P, C);
  assert.equal(r.status, 'notInvertible');
  assert.deepEqual(r.key, bad);
  assert.deepEqual(A.knownPlaintext(3, 'ABCDEF', 'GHIJKL').error, { key: 'kpa.err.short', params: { n: 3, need: 9, have: 6 } });
  assert.equal(A.knownPlaintext(2, '', 'AB').error.key, 'kpa.err.empty');
});

test('例: 既知平文攻撃の 5 つの例の結果', () => {
  const got = S.KPA.map((s) => {
    const c = H.encrypt(s.key, s.plain);
    return [s.id, A.knownPlaintext(s.n, c.processed, c.output).status];
  });
  assert.deepEqual(got, [['help', 'solved'], ['even', 'ambiguous'], ['evenMore', 'solved'], ['dawn', 'ambiguous'], ['retreat', 'solved']]);
});

test('クリブの位置探し: 例文の 240 字に THE LIGHTHOUSE を当てると、位置 80 で鍵が見つかり 1 位になる', () => {
  const ct = H.encrypt(S.CRIB.key, LETTERS.slice(0, S.CRIB.letters)).output;
  const r = A.cribSearch(S.CRIB.n, ct, S.CRIB.crib);
  assert.equal(r.ok, true);
  assert.equal(r.tried, S.CRIB.letters - 13 + 1);
  assert.equal(LETTERS.indexOf('THELIGHTHOUSE'), 80);
  assert.equal(r.results[0].pos, 80);
  assert.deepEqual(r.results[0].key, S.CRIB.key);
  assert.equal(r.results[0].plaintext, LETTERS.slice(0, S.CRIB.letters));
  for (const x of r.results) assert.equal(x.plaintext.slice(x.pos, x.pos + 13), 'THELIGHTHOUSE');
});

test('クリブの位置探し: 入力の誤り', () => {
  assert.equal(A.cribSearch(3, 'ABCD', 'THELIGHTHOUSE').error.key, 'err.length');
  assert.deepEqual(A.cribSearch(3, 'ABCDEFGHIJKL', 'THELIGHT').error, { key: 'crib.err.short', params: { n: 3, need: 9, have: 8 } });
  assert.equal(A.cribSearch(2, 'ABCD', 'ABCDEF').error.key, 'crib.err.longer');
  assert.equal(A.cribSearch(2, '', 'ABCD').error.key, 'crib.err.noCipher');
});
