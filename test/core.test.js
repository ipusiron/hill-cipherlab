import test from 'node:test';
import assert from 'node:assert/strict';
import { core } from './load.js';

const H = core();

// 期待値はすべて参照実装（Python、作業の記録に保管）で出した値
const K2 = [[3, 3], [2, 5]];
const K3 = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];

/** 再現できる擬似乱数（テスト用） */
function lcg(seed) {
  let s = seed >>> 0;
  return (k) => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 8) % k;
  };
}

test('剰余・最大公約数・逆元', () => {
  assert.equal(H.mod(-1), 25);
  assert.equal(H.mod(52), 0);
  assert.equal(H.gcd(54, 26), 2);
  assert.equal(H.modInv(9), 3);
  assert.equal(H.modInv(13), null);
  assert.equal(H.modInv(0), null);
  // 26 と互いに素な 12 個の数はすべて逆元を持ち、掛けると 1 になる
  const units = [];
  for (let a = 0; a < 26; a++) if (H.modInv(a) !== null) units.push(a);
  assert.deepEqual(units, [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]);
  for (const a of units) assert.equal(H.mod(a * H.modInv(a)), 1);
});

test('拡張ユークリッドの途中の行（9 の逆元）', () => {
  const e = H.egcdSteps(9);
  assert.equal(e.gcd, 1);
  assert.equal(e.inverse, 3);
  assert.deepEqual(e.steps, [
    { q: null, r: 26, t: 0 },
    { q: null, r: 9, t: 1 },
    { q: 2, r: 8, t: -2 },
    { q: 1, r: 1, t: 3 },
    { q: 8, r: 0, t: -26 },
  ]);
  // どの行も r ≡ t·a (mod 26)
  for (const s of e.steps) assert.equal(H.mod(s.r), H.mod(s.t * 9));
});

test('入力を英字にそろえる（全角・小文字・記号）', () => {
  assert.deepEqual(H.normalizeText('Hello, world!'), { letters: 'HELLOWORLD', ignored: 2 });
  assert.deepEqual(H.normalizeText('ＨＥＬＰ'), { letters: 'HELP', ignored: 0 });
  assert.deepEqual(H.normalizeText(' A\tB\nC '), { letters: 'ABC', ignored: 0 });
  assert.deepEqual(H.normalizeText('あいABC123'), { letters: 'ABC', ignored: 5 });
  assert.deepEqual(H.normalizeText(''), { letters: '', ignored: 0 });
  assert.deepEqual(H.normalizeText(null), { letters: '', ignored: 0 });
  assert.deepEqual(H.toNums('AZ'), [0, 25]);
  assert.equal(H.toLetters([0, 25, 26, -1]), 'AZAZ');
});

test('行列式・余因子・随伴（整数のまま）', () => {
  assert.equal(H.det(K2), 9);
  assert.equal(H.det([[2, -1], [1, 1]]), 3);
  assert.equal(H.det(K3), 441);
  assert.equal(H.det([[24, 7, 18, 3], [4, 16, 5, 19], [17, 2, 6, 3], [20, 3, 6, 11]]), -13204);
  assert.deepEqual(H.cofactorMatrix(K2), [[5, -2], [-3, 3]]);
  assert.deepEqual(H.adjugate(K2), [[5, -3], [-2, 3]]);
});

test('鍵の検証: README の鍵 [[3,3],[2,5]]', () => {
  const a = H.analyzeKey(K2);
  assert.equal(a.det, 9);
  assert.equal(a.detMod, 9);
  assert.equal(a.gcd, 1);
  assert.equal(a.detInv, 3);
  assert.equal(a.invertible, true);
  assert.equal(a.reason, null);
  assert.deepEqual(a.inverse, [[15, 17], [20, 9]]);
  assert.deepEqual(a.check, [[1, 0], [0, 1]]);
});

test('鍵の検証: 3×3（キーワード GYBNQKURP の鍵）', () => {
  const a = H.analyzeKey(K3);
  assert.equal(a.detMod, 25);
  assert.equal(a.detInv, 25);
  assert.deepEqual(a.inverse, [[8, 5, 10], [21, 8, 21], [21, 12, 8]]);
  assert.ok(H.isIdentity(a.check));
});

test('鍵の検証: 使えない理由（偶数・13 の倍数・両方）', () => {
  const cases = [
    [[[6, 24], [1, 13]], 54, 2, 'even'],
    [[[2, 4], [6, 8]], -8, 2, 'even'],
    [[[13, 0], [0, 1]], 13, 13, 'mult13'],
    [[[2, 0], [0, 13]], 26, 26, 'both'],
    [[[0, 0], [0, 0]], 0, 26, 'both'],
  ];
  for (const [K, det, g, reason] of cases) {
    const a = H.analyzeKey(K);
    assert.equal(a.det, det, JSON.stringify(K));
    assert.equal(a.gcd, g);
    assert.equal(a.reason, reason);
    assert.equal(a.invertible, false);
    assert.equal(a.inverse, null);
    assert.equal(a.detInv, null);
  }
});

test('負の数の鍵は mod 26 の値と同じ鍵になる', () => {
  const a = H.analyzeKey([[2, -1], [1, 1]]);
  assert.equal(a.det, 3);
  assert.equal(a.detMod, 3);
  assert.deepEqual(a.Kmod, [[2, 25], [1, 1]]);
  const b = H.analyzeKey([[2, 25], [1, 1]]);
  assert.deepEqual(a.inverse, b.inverse);
});

test('2×2 の全 456,976 通り: 可逆な鍵の数と、逆行列を掛けると単位行列になること', () => {
  let count = 0;
  for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) for (let c = 0; c < 26; c++) for (let d = 0; d < 26; d++) {
    const K = [[a, b], [c, d]];
    const r = H.analyzeKey(K);
    if (r.invertible) {
      count++;
      if ((a * 26 + b) % 97 === 0) assert.ok(H.isIdentity(r.check));
    }
  }
  assert.equal(count, 157248);
  const c2 = H.invertibleCount(2);
  assert.equal(c2.count, 157248n);
  assert.equal(c2.total, 456976n);
  assert.equal(c2.ratio.toFixed(4), '0.3441');
});

test('3×3 の可逆な鍵の数（GF(2) と GF(13) の積）と、乱数の鍵 2,000 個の逆行列', () => {
  const c3 = H.invertibleCount(3);
  assert.equal(c3.count, 1634038189056n);
  assert.equal(c3.ratio.toFixed(4), '0.3010');
  assert.equal(H.glCount(3, 2), 168n);
  const rnd = lcg(93);
  let invertible = 0;
  for (let i = 0; i < 2000; i++) {
    const K = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => rnd(26)));
    const r = H.analyzeKey(K);
    if (r.invertible) {
      invertible++;
      assert.ok(H.isIdentity(r.check));
      assert.ok(H.isIdentity(H.matMul(r.inverse, r.Kmod)));
    }
  }
  // 30.1% 前後になる（乱数の種を固定しているので値は決まる）
  assert.ok(invertible > 540 && invertible < 660, String(invertible));
});

test('既知解答: README の HELP → HIAT とその復号', () => {
  const e = H.encrypt(K2, 'HELP');
  assert.equal(e.ok, true);
  assert.equal(e.output, 'HIAT');
  assert.equal(e.padCount, 0);
  assert.deepEqual(e.blocks.map((b) => [b.input, b.output]), [[[7, 4], [7, 8]], [[11, 15], [0, 19]]]);
  // README の式の途中の値（33・34、78・97）
  assert.deepEqual(e.blocks[0].rows.map((r) => r.sum), [33, 34]);
  assert.deepEqual(e.blocks[1].rows.map((r) => r.sum), [78, 97]);
  const d = H.decrypt(K2, 'HIAT');
  assert.equal(d.output, 'HELP');
  assert.deepEqual(d.blocks[0].rows.map((r) => r.sum), [241, 212]);
  assert.deepEqual(d.blocks[1].rows.map((r) => r.sum), [323, 171]);
});

test('既知解答: Hello world と 3×3 の ACT → POH', () => {
  const e = H.encrypt(K2, 'Hello world');
  assert.equal(e.processed, 'HELLOWORLD');
  assert.equal(e.output, 'HIOZEIPJQL');
  assert.equal(H.encrypt(K3, 'ACT').output, 'POH');
  assert.equal(H.decrypt(K3, 'POH').output, 'ACT');
  const e3 = H.encrypt(K3, 'Hello world');
  assert.equal(e3.processed, 'HELLOWORLDXX');
  assert.equal(e3.padCount, 2);
});

test('全角の英字も同じ暗号文になる', () => {
  assert.equal(H.encrypt(K2, 'ＨＥＬＰ').output, 'HIAT');
  assert.equal(H.encrypt(K2, 'h e l p').output, 'HIAT');
});

test('パディングの文字を変えられる', () => {
  const e = H.encrypt(K3, 'HELLO', { pad: 'Q' });
  assert.equal(e.processed, 'HELLOQ');
});

test('往復: 乱数の鍵と文で、暗号化→復号が元の英字（パディング込み）に戻る', () => {
  const rnd = lcg(7);
  for (const n of [2, 3]) {
    for (let i = 0; i < 200; i++) {
      const { matrix } = H.randomInvertible(n, rnd);
      const len = 1 + rnd(40);
      const text = Array.from({ length: len }, () => H.ALPHABET[rnd(26)]).join('');
      const e = H.encrypt(matrix, text);
      assert.equal(e.ok, true);
      const d = H.decrypt(matrix, e.output);
      assert.equal(d.output, e.processed);
      assert.equal(d.output.slice(0, len), text);
    }
  }
});

test('復号: 英字の数がブロックの倍数でなければ止める（パディングしない）', () => {
  const d = H.decrypt(K2, 'HIA');
  assert.equal(d.ok, false);
  assert.deepEqual(d.error, { key: 'err.length', params: { count: 3, n: 2, rem: 1, missing: 1 } });
  const d3 = H.decrypt(K3, 'HIATX');
  assert.deepEqual(d3.error.params, { count: 5, n: 3, rem: 2, missing: 1 });
  // 記号や空白は数えない
  assert.equal(H.decrypt(K2, 'hi at!').output, 'HELP');
});

test('非可逆の鍵では暗号化も復号もしない', () => {
  const K = [[6, 24], [1, 13]];
  assert.deepEqual(H.encrypt(K, 'ACT').error, { key: 'err.notInvertible', params: { gcd: 2 } });
  assert.equal(H.decrypt(K, 'AB').ok, false);
});

test('上限: 英字ちょうど 10,000 字は 3×3 でも暗号化でき、10,001 字は止める', () => {
  const e = H.encrypt(K3, 'A'.repeat(10000));
  assert.equal(e.ok, true);
  assert.equal(e.processed.length, 10002);
  assert.equal(e.output.length, 10002);
  const over = H.encrypt(K3, 'A'.repeat(10001));
  assert.deepEqual(over.error, { key: 'err.tooLong', params: { limit: 10000, count: 10001 } });
  // 英字が上限内でも、入力欄そのものが長すぎれば止める
  const raw = H.encrypt(K2, ' '.repeat(100001));
  assert.equal(raw.error.key, 'err.inputTooLong');
  // 復号は英字の数そのもので判定する（10,002 字の暗号文は上限を超える）
  assert.equal(H.decrypt(K3, e.output).error.key, 'err.tooLong');
  assert.equal(H.decrypt(K2, 'AB'.repeat(5000)).ok, true);
});

test('空の入力は空の結果', () => {
  const e = H.encrypt(K2, '');
  assert.equal(e.ok, true);
  assert.equal(e.output, '');
  assert.equal(e.padCount, 0);
  assert.equal(H.decrypt(K2, '   ').output, '');
});

test('鍵のマスの読み取り: 整数だけを受け付ける', () => {
  const ok = H.parseCells(['3', ' 3 ', '２', '-5'], 2);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.matrix, [[3, 3], [2, -5]]);
  const minus = H.parseCells(['\u22125', '+7', '0', '999'], 2);
  assert.deepEqual(minus.matrix, [[-5, 7], [0, 999]]);
  const bad = H.parseCells(['', '3.9', '1e2', '1000'], 2);
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors.map((e) => [e.index, e.key]), [
    [0, 'err.cell.empty'], [1, 'err.cell.notInteger'], [2, 'err.cell.notInteger'], [3, 'err.cell.range'],
  ]);
});

test('乱数の鍵: 必ず可逆で、crypto.getRandomValues を使う', () => {
  for (const n of [2, 3]) {
    for (let i = 0; i < 50; i++) {
      const { matrix } = H.randomInvertible(n);
      assert.equal(H.analyzeKey(matrix).invertible, true);
      assert.ok(matrix.flat().every((x) => Number.isInteger(x) && x >= 0 && x < 26));
    }
  }
  const counts = Array(26).fill(0);
  for (let i = 0; i < 26000; i++) counts[H.cryptoRandomBelow(26)]++;
  assert.ok(counts.every((c) => c > 800 && c < 1200));
  // 取れなければ単位行列を返す
  const never = H.randomInvertible(2, () => 0, 5);
  assert.deepEqual(never, { matrix: [[1, 0], [0, 1]], tries: 5 });
});
