import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const html = read('index.html');
const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';

test('CSP: 外部を読まず、インラインのスクリプトとスタイルを許さない', () => {
  assert.ok(csp, 'CSP の meta がある');
  for (const part of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
    "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(csp.includes(part), part);
  }
  assert.ok(!csp.includes('unsafe-inline'));
  assert.ok(!csp.includes('unsafe-eval'));
  // meta の CSP では frame-ancestors は効かない。X-Content-Type-Options も meta では効かない
  assert.ok(!csp.includes('frame-ancestors'));
  assert.ok(!/X-Content-Type-Options|X-Frame-Options/i.test(html));
  assert.ok(!/https?:/.test(csp), '外部のホストを許していない');
});

test('referrer・favicon・noscript・言語', () => {
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /<link rel="icon" href="data:,">/);
  assert.match(html, /<noscript>/);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/);
});

test('インラインのイベントハンドラー・style 属性・インラインのスクリプトがない', () => {
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'on〜= の属性がない');
  assert.ok(!/\sstyle\s*=/i.test(html), 'style 属性がない');
  assert.ok(!/<style[\s>]/i.test(html), 'style 要素がない');
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.deepEqual(scripts.map((m) => (m[1].match(/src="([^"]+)"/) || [])[1]), ['js/hill-core.js', 'js/messages.js', 'script.js']);
  for (const m of scripts) {
    assert.equal(m[2].trim(), '', 'script の中身は空');
    assert.match(m[1], /\sdefer/);
    // file:// でも動くように、ES module にしない
    assert.ok(!/type="module"/.test(m[1]));
  }
});

test('画面の処理が使う要素の id がそろっていて、重複しない', () => {
  const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const ids = new Set(all);
  assert.equal(all.length, ids.size, 'id の重複がない');
  const used = new Set([...read('script.js').matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map((m) => m[1]));
  assert.ok(used.size > 30, String(used.size));
  for (const id of used) assert.ok(ids.has(id), `#${id}`);
});

test('タブは WAI-ARIA のタブの形（tablist・tab・tabpanel が対応する）', () => {
  assert.match(html, /class="tabs" role="tablist"/);
  const re = new RegExp('<button class="tab[^"]*" id="(tabbtn-[a-z]+)" data-tab="([a-z]+)" role="tab" '
    + 'aria-selected="(true|false)" aria-controls="(tab-[a-z]+)"', 'g');
  const tabs = [...html.matchAll(re)];
  assert.equal(tabs.length, 4);
  assert.equal(tabs.filter((m) => m[3] === 'true').length, 1);
  for (const m of tabs) {
    assert.equal(m[4], `tab-${m[2]}`);
    assert.match(html, new RegExp(`<section id="${m[4]}" class="tab-content[^"]*" role="tabpanel" aria-labelledby="${m[1]}">`));
  }
});

test('ラベル: label は入力と結び付き、警告・通知は読み上げられる', () => {
  for (const m of html.matchAll(/<label([^>]*)>/g)) assert.match(m[1], /\sfor="[^"]+"/, m[0]);
  for (const m of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.match(html, new RegExp(`id="${m[1]}"`), m[1]);
  assert.match(html, /id="warning-encrypt" class="warning" role="alert" hidden/);
  assert.match(html, /id="warning-decrypt" class="warning" role="alert" hidden/);
  assert.match(html, /id="toast" class="toast" role="status" aria-live="polite"/);
  assert.match(html, /id="sr-status" class="sr-only" aria-live="polite"/);
});

test('復号の例は暗号化の結果と同じ形（パディングの X を生のまま書かない）', () => {
  assert.match(html, /id="ciphertext-decrypt"[^>]*placeholder="例: HIAT"/);
  assert.ok(!html.includes('HIATXXX'));
});

test('表記: リポジトリー（長音）', () => {
  assert.ok(!/リポジトリ(?!ー)/.test(html));
});
