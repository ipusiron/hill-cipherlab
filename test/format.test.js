import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read } from './load.js';

// 1 行に詰め込んだ（minify した）ファイルを見つける。行の長さの上限と、行数の下限
const files = () => [
  'script.js', 'style.css', 'index.html',
  ...fs.readdirSync(new URL('../js/', import.meta.url)).map((f) => `js/${f}`),
  ...fs.readdirSync(new URL('./', import.meta.url)).map((f) => `test/${f}`),
].filter((f) => /\.(js|css|html)$/.test(f));

test('行の長さ: JS・CSS・テストは 160 文字以下、index.html は 250 文字以下', () => {
  for (const f of files()) {
    const limit = f.endsWith('.html') ? 250 : 160;
    read(f).split('\n').forEach((line, i) => {
      assert.ok(line.length <= limit, `${f}:${i + 1} が ${line.length} 文字`);
    });
  }
});

test('主要なファイルの行数が下限を下回らない', () => {
  const min = { 'script.js': 300, 'style.css': 400, 'index.html': 150, 'js/hill-core.js': 250 };
  for (const [f, n] of Object.entries(min)) {
    const lines = read(f).split('\n').length;
    assert.ok(lines >= n, `${f} は ${lines} 行`);
  }
});

test('改行は LF、末尾に改行がある、タブを使わない', () => {
  for (const f of files()) {
    const s = read(f);
    assert.ok(!s.includes('\r'), `${f} に CR がある`);
    assert.ok(s.endsWith('\n'), `${f} の末尾に改行がない`);
    assert.ok(!s.includes('\t'), `${f} にタブがある`);
  }
});
