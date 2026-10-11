import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const css = read('style.css');
const root = css.match(/:root\s*\{([^}]+)\}/)[1];
const vars = Object.fromEntries([...root.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const color = (v) => (v.startsWith('#') ? v : vars[v]);

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [luminance(color(a)), luminance(color(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test('配色の変数が読める', () => {
  for (const k of ['bg', 'card', 'txt', 'muted', 'accent', 'accent-strong', 'accent-weak', 'ok-text', 'ng-text', 'border']) {
    assert.match(vars[k] || '', /^#[0-9a-f]{6}$/i, k);
  }
});

test('文字と背景の組はすべて 4.5:1 以上', () => {
  const pairs = [
    ['txt', 'bg', '本文'], ['txt', 'card', 'カードの本文'], ['muted', 'card', '補足'], ['muted', 'bg', 'タブ・副題・フッター'],
    ['muted', '#FCFCFD', '情報パネルの補足'], ['#FFFFFF', 'accent', '選択中のタブ・主要ボタン・トースト（情報）'],
    ['#FFFFFF', 'ok-text', 'トースト（成功）・コピー完了'], ['ok-text', '#FCFCFD', '使用可能'], ['ng-text', '#FCFCFD', '使用不可'],
    ['ng-text', 'card', '鍵のマスの誤り'], ['accent-strong', '#FCFCFD', '詳細情報を表示'], ['accent-strong', 'accent-weak', 'コピーのホバー・選択中のサイズ'],
    ['#4B5563', '#F3F4F6', '処理後の平文'], ['#1F3A8A', 'card', '処理ログの見出し'], ['#92400E', '#FEF3C7', '警告'],
    ['txt', 'accent-weak', 'タブのホバー・逆元の行'], ['ng-text', '#FEF2F2', '誤りのあるマス'],
  ];
  for (const [fg, bg, name] of pairs) {
    const r = ratio(fg, bg);
    assert.ok(r >= 4.5, `${name}: ${fg} / ${bg} = ${r.toFixed(2)}`);
  }
});

test('CSS が使う色はこの表にあるものだけ（使える組の外の色を足していない）', () => {
  // 上の組に出てくる値と、飾り（線・影・面）の値
  const allowed = new Set(['#FFFFFF', '#FCFCFD', '#F3F4F6', '#4B5563', '#1F3A8A', '#92400E', '#FEF3C7', '#FEF2F2', '#F59E0B',
    '#1F2937', '#FAFAFF', '#D8DEE9', '#F3F7FF', '#CBD5E1', '#1E40AF', '#F9FAFB']
    .map((x) => x.toUpperCase()));
  for (const v of Object.values(vars)) allowed.add(v.toUpperCase());
  const used = [...css.replace(/:root\s*\{[^}]+\}/, '').matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toUpperCase());
  for (const c of used) assert.ok(allowed.has(c), c);
});
