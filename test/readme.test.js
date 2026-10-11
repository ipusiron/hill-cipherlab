import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { read, core } from './load.js';

const H = core();
const readme = read('README.md');
const fmt = (n) => Number(n).toLocaleString('en-US');
const K2 = [[3, 3], [2, 5]];
const K3 = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
const bm = (M) => `\\begin{bmatrix} ${M.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
const vec = (v) => `\\begin{bmatrix} ${v.join(' \\\\ ')} \\end{bmatrix}`;

/** YAML メタデータとコードブロックを除いた本文の行 */
function proseLines(src) {
  const out = [];
  let inCode = false;
  for (const line of src.slice(src.indexOf('\n-->\n') + 5).split('\n')) {
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (!inCode) out.push(line);
  }
  return out;
}

test('YAML メタデータ: HTML コメントの中、キーの順序、ブロック形式、固定の値', () => {
  const m = readme.match(/^<!--\n---\n([\s\S]*?)\n---\n-->\n/);
  assert.ok(m, '先頭が <!-- と --- で始まる');
  const yaml = m[1];
  const keys = [...yaml.matchAll(/^([a-z_]+):/gm)].map((x) => x[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  assert.match(yaml, /^id: day093$/m);
  assert.match(yaml, /^slug: hill-cipherlab$/m);
  assert.match(yaml, /^repo_url: "https:\/\/github\.com\/ipusiron\/hill-cipherlab"$/m);
  assert.match(yaml, /^demo_url: "https:\/\/ipusiron\.github\.io\/hill-cipherlab\/"$/m);
  assert.match(yaml, /^hub: true$/m);
  for (const k of ['category_ja', 'category_en', 'tags']) {
    assert.match(yaml, new RegExp(`^${k}:\\n  - `, 'm'), `${k} はブロック形式`);
  }
});

test('シリーズの定型: H1・Day の行・プロジェクトのリンク', () => {
  assert.match(readme, /^# Hill CipherLab - ヒル暗号ツール$/m);
  assert.match(readme, /^\*\*Day093 - 生成AIで作るセキュリティツール100\*\*$/m);
  assert.ok(readme.includes('https://akademeia.info/?page_id=42163'));
  assert.ok(!readme.includes('page_id=44607'));
  for (const h of ['## 🌐 デモページ', '## 📸 スクリーンショット', '## 🎯 ユースケース', '## 🔒 セキュリティ', '## 🧪 テスト',
    '## 📁 ディレクトリー構造', '## 💻 動作環境', '## 📄 ライセンス', '## 🛠️ このツールについて']) {
    assert.ok(readme.includes(`\n${h}\n`), h);
  }
});

test('画像: README の参照はすべて実在し、assets/ の PNG は README から参照されているものだけ', () => {
  const refs = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s));
  assert.equal(refs.length, 3);
  for (const r of refs) assert.ok(fs.existsSync(new URL(`../${r}`, import.meta.url)), r);
  const pngs = fs.readdirSync(new URL('../assets/', import.meta.url)).filter((f) => f.endsWith('.png')).map((f) => `assets/${f}`);
  assert.deepEqual(pngs.sort(), refs.slice().sort());
});

test('ディレクトリー構造: 全ファイルが載り、全行に説明があり、# の桁がそろう', () => {
  const block = readme.split('## 📁 ディレクトリー構造')[1].split('```')[1];
  const lines = block.split('\n').filter((l) => l.trim() && l.trim() !== 'hill-cipherlab/');
  const cols = new Set();
  const listed = [];
  const stack = [];
  for (const line of lines) {
    const m = line.match(/^([│├└─\s]*)(\S+)\s+# \S/);
    assert.ok(m, `説明がない: ${line}`);
    cols.add(line.indexOf('# '));
    const depth = m[1].length / 4;
    stack.length = depth;
    stack.push(m[2]);
    if (!m[2].endsWith('/')) listed.push(stack.join(''));
  }
  assert.equal(cols.size, 1, '# の桁がそろっている');
  const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const actual = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['.git', '.claude', 'node_modules'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else actual.push(path.relative(root, p).split(path.sep).join('/'));
    }
  };
  walk(root);
  assert.deepEqual(listed.slice().sort(), actual.sort());
});

test('README の例: HELP → HIAT の途中の値と逆行列', () => {
  const e = H.encrypt(K2, 'HELP');
  assert.equal(e.output, 'HIAT');
  assert.ok(readme.includes('暗号文c="HIAT"'));
  for (const b of e.blocks) {
    assert.ok(readme.includes(vec(b.rows.map((r) => r.sum))), `積和 ${b.rows.map((r) => r.sum)}`);
    assert.ok(readme.includes(vec(b.output)), `剰余 ${b.output}`);
  }
  const a = H.analyzeKey(K2);
  assert.ok(readme.includes(`\\det(K) = 3 \\times 5 - 3 \\times 2 = 15 - 6 = ${a.det}`));
  assert.ok(readme.includes(`9^{-1} \\equiv ${a.detInv} \\pmod{26}`));
  assert.ok(readme.includes(`9 \\times 3 = ${9 * a.detInv} \\equiv 1`));
  assert.ok(readme.includes(bm(a.inverse)));
  // 検算 K·K⁻¹ の整数のままの値（105・78・130・79）
  const raw = K2.map((row) => a.inverse[0].map((_, j) => row.reduce((s, x, k) => s + x * a.inverse[k][j], 0)));
  assert.deepEqual(raw, [[105, 78], [130, 79]]);
  assert.ok(readme.includes(bm(raw)));
  const d = H.decrypt(K2, 'HIAT');
  assert.equal(d.output, 'HELP');
  for (const b of d.blocks) assert.ok(readme.includes(vec(b.rows.map((r) => r.sum))), `復号の積和 ${b.rows.map((r) => r.sum)}`);
  // 余因子・随伴の例
  assert.ok(readme.includes(`\\mathrm{Cof}(K) = ${bm(H.cofactorMatrix(K2))}`));
  assert.ok(readme.includes(`\\mathrm{adj}(K) = ${bm(H.adjugate(K2))}`));
});

test('README の例: シナリオ3の 3×3 の鍵（ACT → POH）と逆行列', () => {
  assert.ok(readme.includes(`K = ${JSON.stringify(K3).replace(/,/g, ', ')}`));
  assert.equal(H.encrypt(K3, 'ACT').output, 'POH');
  assert.ok(readme.includes('暗号文 "POH"'));
  assert.ok(readme.includes(`逆行列は${JSON.stringify(H.inverse(K3))}`));
  // 2×2 に詰めた誤りの鍵を載せていない
  assert.ok(!readme.includes('[[6, 24], [1, 13]]'));
});

test('README の例: 4×4 の係数行列の行列式と、1か所変えた行列', () => {
  const A = [[24, 7, 18, 3], [4, 16, 5, 19], [17, 2, 6, 3], [20, 3, 6, 11]];
  const d = H.det(A);
  assert.ok(readme.includes(`\\det A = ${d} \\equiv ${H.mod(d)} \\pmod{26}`));
  assert.equal(H.gcd(H.mod(d), 26), 2);
  const B = A.map((r) => r.slice());
  B[0][0] = 25;
  const dB = H.mod(H.det(B));
  assert.equal(H.gcd(dB, 26), 1);
  assert.ok(readme.includes(`左上の24を25に変えると $\\det A \\equiv ${dB} \\pmod{26}$`));
});

test('可逆な鍵の数と割合', () => {
  const c2 = H.invertibleCount(2);
  const c3 = H.invertibleCount(3);
  const p2 = (c2.ratio * 100).toFixed(1);
  const p3 = (c3.ratio * 100).toFixed(1);
  assert.ok(readme.includes(`2×2は${fmt(c2.total)}通りのうち${fmt(c2.count)}通り（約${p2}%）、3×3は約${p3}%`));
  assert.ok(readme.includes(`使える鍵は約${p2}%から約${p3}%へ`));
  assert.ok(readme.includes(`可逆な鍵の割合（約${p2}%・約${p3}%）`));
  assert.ok(readme.includes(`2×2の全${fmt(c2.total)}通り`));
  // 3×3 の上限: 10,000 字はパディング後 10,002 字
  const e = H.encrypt(K3, 'A'.repeat(H.LIMITS.letters));
  assert.ok(readme.includes(`3×3で${fmt(H.LIMITS.letters)}字なら、パディング後は${fmt(e.processed.length)}字`));
});

test('ユースケース「このツールならではの使い方」の数値', () => {
  // 逆元の表
  const inv7 = H.egcdSteps(7).inverse;
  assert.equal(H.analyzeKey([[7, 0], [0, 1]]).det, 7);
  assert.ok(readme.includes(`7 × ${inv7} = ${7 * inv7} ≡ 1なので7⁻¹ ≡ ${inv7}`));
  // 実数の逆行列
  const adj = H.adjugate(K2).map((r) => r.map((x) => String(x).replace('-', '−')));
  assert.ok(readme.includes(`adj(K) = [[${adj[0].join(',')}],[${adj[1].join(',')}]]、det(K) = ${H.det(K2)}`));
  // 中国剰余定理
  const g2 = H.glCount(2, 2);
  const g13 = H.glCount(2, 13);
  assert.equal(g2 * g13, H.invertibleCount(2).count);
  assert.ok(readme.includes(`（${g2} × ${fmt(g13)} = ${fmt(g2 * g13)}）`));
  assert.ok(readme.includes(`mod 2で可逆な行列${g2}通りと、mod 13で可逆な行列${fmt(g13)}通り`));
  // 同じ文字が違う文字になる
  const e = H.encrypt(K2, 'Hello world');
  const blocks = Object.fromEntries(e.blocks.map((b) => [H.toLetters(b.input), H.toLetters(b.output)]));
  assert.ok(readme.includes(`LLの組では${blocks.LL[0]}と${blocks.LL[1]}に、LDの組では${blocks.LD[0]}に変わります（暗号文${e.output}）`));
  // 謎解き: HELP の 2 ブロックの計算は 4 行
  const h = H.encrypt(K2, 'HELP');
  const rows = h.blocks.reduce((s, b) => s + b.rows.length, 0);
  assert.ok(readme.includes(`HELP → ${h.output}なら、${h.blocks.length}ブロックの計算が${rows}行で出ます`));
  // 13 の倍数の鍵の例
  assert.equal(H.analyzeKey([[13, 0], [0, 1]]).reason, 'mult13');
  assert.ok(readme.includes('`det(K) = 13` の行列（例: [[13,0],[0,1]]）'));
});

test('ツールへのリンク（シリーズの暗号ツール）', () => {
  for (const slug of ['caesar-cipher-wheel', 'vigenere-cipher-tool', 'porta-cipherlab', 'playfair-cipherlab', 'affine-cipherlab',
    'frequency-analyzer', 'cipher-clairvoyance']) {
    assert.ok(readme.includes(`https://ipusiron.github.io/${slug}/`), slug);
  }
});

test('表記: 禁止語・長音・文末のコロン・過去の版の説明', () => {
  const prose = proseLines(readme).join('\n');
  const banned = [/全て/, /分か[らりるっ]/, /既に/, /無い/, /復号化/, /出来/, /インターフェース/,
    /リポジトリ(?!ー)/, /ユーザ(?!ー)/, /サーバ(?!ー)/, /ブラウザ(?!ー)/, /パラメータ(?!ー)/, /フォルダ(?!ー)/, /マネージャ(?!ー)/,
    /以前は/, /改修前/, /初期の実装/];
  for (const re of banned) assert.equal(prose.match(re), null, String(re));
  for (const line of proseLines(readme)) assert.ok(!/[：:]\s*$/.test(line) || /^\s*\|/.test(line), `文末のコロン: ${line}`);
});

test('強調（**）は H2 の節ごとに2か所まで', () => {
  const sections = readme.split(/\n## /);
  for (const s of sections) {
    const count = (s.match(/\*\*[^*\n]+\*\*/g) || []).length;
    assert.ok(count <= 2, `${s.split('\n')[0]}: ${count}`);
  }
});
