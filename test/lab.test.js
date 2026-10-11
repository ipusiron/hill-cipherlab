import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.js';
load('js/hill-core.js');
load('js/hill-lab.js');
const H = globalThis.HillCore;
const L = globalThis.HillLab;
test('上限の3×3平文はパディング後も復号できる', () => {
  const k = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
  const e = H.encrypt(k, 'A'.repeat(10000));
  assert.equal(e.output.length, 10002);
  assert.equal(H.decrypt(k, e.output).output, e.processed);
  assert.equal(H.decrypt(k, 'A'.repeat(10003)).error.key, 'err.tooLong');
});
test('線形性は2×2と3×3で成り立ち、暗号化とも一致する', () => {
  for (const key of [[[3, 3], [2, 5]], [[6, 24, 1], [13, 16, 10], [20, 17, 15]]]) {
    const n = key.length;
    for (let i = 0; i < 26; i++) {
      const p = H.toLetters(Array(n).fill(i));
      const q = 'HELP'.slice(0, n);
      const r = L.linearity(key, p, q);
      assert.deepEqual(r.left, r.right);
      assert.equal(H.toLetters(r.ca), H.encrypt(key, p).output);
      assert.equal(H.toLetters(r.left), H.encrypt(key, H.toLetters(r.sum)).output);
    }
  }
  const r = L.linearity([[3, 3], [2, 5]], 'HE', 'LP');
  assert.equal(H.toLetters(r.left), 'HB');
  assert.equal(L.linearity(H.identity(3), 'HE', 'LP').error.key, 'lab.length');
});
test('URL入力は英字と可逆なJSON行列だけを受け入れる', () => {
  assert.deepEqual(L.parseFragment('#text=HIAT&key=%5B%5B3%2C3%5D%2C%5B2%2C5%5D%5D'), {
    ok: true, text: 'HIAT', key: [[3, 3], [2, 5]],
  });
  for (const s of ['#key={}', '#key=[[2,4],[6,8]]', '#key=[[1.5,0],[0,1]]', '#text=%3Csvg%3E', '#text=%E0%A4%A',
    '#key=[[1000,0],[0,1]]', '#key=[[1,0],[0]]', '#text=' + 'A'.repeat(10001)]) {
    assert.equal(L.parseFragment(s).ok, false, s.slice(0, 60));
  }
  assert.equal(L.parseFragment('#text=' + 'A'.repeat(10000)).ok, true);
  assert.deepEqual(L.parseFragment(''), { ok: true, text: null, key: null });
});
