import test from 'node:test';
import assert from 'node:assert/strict';
import { read, load } from './load.js';

const M = load('js/messages.js').HillMessages;
const script = read('script.js');
const coreSrc = read('js/hill-core.js');

test('script.js が引くキーはすべて辞書にある', () => {
  const keys = new Set([...script.matchAll(/\bt\(\s*'([a-zA-Z0-9.]+)'/g)].map((m) => m[1]));
  // テンプレートで組み立てるキー（key.reason.${reason}）
  for (const r of ['ok', 'even', 'mult13', 'both', 'invalid']) keys.add(`key.reason.${r}`);
  assert.ok(keys.size > 30, String(keys.size));
  for (const k of keys) assert.ok(Object.hasOwn(M.dict.ja, k), k);
});

test('計算部が返すキーはすべて辞書にある', () => {
  const keys = new Set([...coreSrc.matchAll(/'((?:err)\.[a-zA-Z0-9.]+)'/g)].map((m) => m[1]));
  assert.ok(keys.size >= 7, String(keys.size));
  for (const k of keys) assert.ok(Object.hasOwn(M.dict.ja, k), k);
});

test('{name} の埋め込み', () => {
  assert.equal(M.t('text.letters', { count: 4 }), '英字 4 字');
  assert.equal(M.tm({ key: 'err.notInvertible', params: { gcd: 2 } }).includes('= 2'), true);
  assert.equal(M.t('no.such.key'), 'no.such.key');
});

test('画面の処理と計算部に日本語の文字列を置かない（文言は辞書へ）', () => {
  const code = (src) => src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  for (const [name, src] of [['script.js', script], ['js/hill-core.js', coreSrc]]) {
    const hit = code(src).match(/[\u3040-\u30ff\u3400-\u9fff]/);
    assert.equal(hit, null, `${name} に日本語: ${hit && hit[0]}`);
  }
});
