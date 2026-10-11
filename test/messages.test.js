import test from 'node:test';
import assert from 'node:assert/strict';
import { read, load } from './load.js';

const M = load('js/messages.js').HillMessages;
const script = read('script.js');
const coreSrc = read('js/hill-core.js');

test('日英のキーとプレースホルダーが一致する', () => {
  assert.deepEqual(Object.keys(M.dict.en).sort(), Object.keys(M.dict.ja).sort());
  for (const k of Object.keys(M.dict.ja)) {
    const args = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(args(M.dict.ja[k]), args(M.dict.en[k]), k);
    assert.ok(M.dict.en[k].length > 0);
  }
});

test('解読と実験の文言・誤りにも未登録キーがない', () => {
  for (const f of ['js/attack-view.js', 'js/lab-view.js', 'js/hill-lab.js', 'js/hill-attack.js']) {
    for (const m of read(f).matchAll(/['"]((?:kpa|coa|crib|attack|lab|import|err)\.[a-zA-Z0-9.]+)['"]/g)) {
      assert.ok(Object.hasOwn(M.dict.ja, m[1]), `${f}: ${m[1]}`);
    }
  }
  for (const status of ['solved', 'ambiguous', 'notInvertible', 'inconsistent']) {
    assert.ok(Object.hasOwn(M.dict.en, `kpa.status.${status}`));
  }
});

test('静的HTMLの日本語のテキストと属性に英訳がある', () => {
  const pairs = load('js/static-messages.js').HillStaticMessages;
  const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '').replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
  const texts = [...html.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim());
  texts.push(...[...html.matchAll(/(?:title|placeholder|aria-label)="([^"]+)"/g)].map((m) => m[1]));
  for (const s of texts.filter((x) => /[\u3040-\u30ff\u3400-\u9fff]/.test(x))) assert.ok(Object.hasOwn(pairs, s), s);
});

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
