# Hill CipherLab - 技術実装詳細

このドキュメントでは、Hill CipherLabの技術的な実装、アルゴリズム、設計上の工夫について詳しく解説します。
コードの抜粋は、`js/hill-core.js`（計算部）と `script.js`（画面の処理）の現行のものです。

---

## 目次

1. [コア暗号アルゴリズム](#1-コア暗号アルゴリズム)
2. [モジュラー演算の実装](#2-モジュラー演算の実装)
3. [行列演算の実装](#3-行列演算の実装)
4. [UI/UXの工夫](#4-uiuxの工夫)
5. [セキュリティ対策](#5-セキュリティ対策)
6. [パフォーマンス](#6-パフォーマンス)
7. [アーキテクチャ設計](#7-アーキテクチャ設計)
8. [テスト](#8-テスト)
9. [解読と学習機能](#9-解読と学習機能)
10. [参考文献](#10-参考文献)

---

## 1. コア暗号アルゴリズム

### 1.1 Hill暗号の数学的基盤

Hill暗号は線形代数に基づくブロック暗号で、以下の式で表されます。

- 暗号化: $C \equiv K \cdot P \pmod{26}$
- 復号: $P \equiv K^{-1} \cdot C \pmod{26}$

ここで、

- $K$: 鍵行列（2×2 または 3×3）
- $P$: 平文ベクトル
- $C$: 暗号文ベクトル
- $K^{-1}$: 鍵行列の逆行列（mod 26）

### 1.2 実装の流れ

```javascript
// 1. 入力を英字の列にそろえる（全角は NFKC で半角に、小文字は大文字に）
function normalizeText(s) {
  const t = String(s == null ? '' : s).normalize('NFKC').toUpperCase();
  let letters = '';
  let ignored = 0;
  for (const ch of t) {
    if (ch >= 'A' && ch <= 'Z') letters += ch;
    else if (!/\s/.test(ch)) ignored += 1;
  }
  return { letters, ignored };
}

// 2. 数値にする（A=0, B=1, ..., Z=25）
const toNums = (letters) => [...letters].map((c) => c.charCodeAt(0) - 65);

// 3. 暗号化では、ブロックの大きさに足りない分を X で埋める
const padCount = letters.length === 0 ? 0 : (n - (letters.length % n)) % n;
const processed = letters + pad.repeat(padCount);

// 4. ブロックごとに行列を掛ける（積和と剰余を処理ログ用に残す）
function blockSteps(M, v) {
  return M.map((row) => {
    const terms = row.map((k, j) => ({ k, v: v[j] }));
    const sum = terms.reduce((s, t) => s + t.k * t.v, 0);
    return { terms, sum, value: mod(sum) };
  });
}
```

特徴は次のとおりです。

- 英字以外（空白・改行は数えない）は除き、除いた数を `ignored` で返す
- 暗号化はブロック長が足りない場合に `X` でパディングする
- 復号はパディングしない。英字の数がブロックの大きさの倍数でなければ、`err.length`（何字余るか、あと何字か）を返して止める
- すべての演算は mod 26 で正規化する

```javascript
function decrypt(K, text) {
  const a = analyzeKey(K);
  if (!a.invertible) return { ok: false, error: msg('err.notInvertible', { gcd: a.gcd }) };
  const c = checkInput(text, Math.ceil(LIMITS.letters / K.length) * K.length);
  if (c.error) return { ok: false, error: c.error };
  const n = K.length;
  const { letters, ignored } = c.norm;
  const rem = letters.length % n;
  if (rem !== 0) {
    return { ok: false, error: msg('err.length', { count: letters.length, n, rem, missing: n - rem }) };
  }
  const { blocks, out } = runBlocks(a.inverse, toNums(letters));
  return { ok: true, letters, ignored, output: toLetters(out), blocks, key: a.inverse };
}
```

---

## 2. モジュラー演算の実装

### 2.1 常に正の剰余を返すmod関数

JavaScriptの `%` 演算子は負の数に対して負の剰余を返すため、独自のmod関数を実装しています。

```javascript
const mod = (a, m = MOD) => ((a % m) + m) % m;
```

例を示します。

- JavaScript標準: `-3 % 26 = -3`
- 本実装: `mod(-3, 26) = 23`

### 2.2 拡張ユークリッドの互除法

モジュラー逆元の計算に拡張ユークリッドの互除法を使います。
画面の「逆行列の計算過程」に表を出すため、途中の行（商 q・余り r・係数 t）も返します。

```javascript
function egcdSteps(a, m = MOD) {
  a = mod(a, m);
  const steps = [{ q: null, r: m, t: 0 }, { q: null, r: a, t: 1 }];
  let [r0, r1, t0, t1] = [m, a, 0, 1];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
    steps.push({ q, r: r1, t: t1 });
  }
  return { gcd: r0, inverse: r0 === 1 ? mod(t0, m) : null, steps };
}

const modInv = (a, m = MOD) => egcdSteps(a, m).inverse;
```

アルゴリズムの詳細は次のとおりです。

1. どの行も $r \equiv t \cdot a \pmod{m}$ を満たすように、余りと係数を同時に更新する
2. 余りが 1 になった行の係数 $t$ が逆元（負なら $m$ を足す）
3. 余りが 1 にならずに 0 になったら、$\gcd(a, m) \neq 1$ で逆元はない
4. 時間計算量: $O(\log \min(a, m))$

例：$9^{-1} \bmod 26 = 3$

| 商 q | 余り r | 係数 t |
|---:|---:|---:|
|  | 26 | 0 |
|  | 9 | 1 |
| 2 | 8 | −2 |
| 1 | 1 | 3 |
| 8 | 0 | −26 |

検証: $9 \times 3 = 27 \equiv 1 \pmod{26}$

---

## 3. 行列演算の実装

### 3.1 行列式・余因子・随伴（整数のまま）

行列式・余因子行列・随伴行列は、まず整数のまま計算します。
画面では「整数のまま」と「mod 26」を並べて見せ、詳細情報の `det(K)` には入力した整数の行列の行列式を出します（負の数を入れても、mod 26 にする前の値がずれない）。

```javascript
/** i 行・j 列を除いた小行列 */
const minorMatrix = (M, i, j) => M.filter((_, r) => r !== i).map((row) => row.filter((__, c) => c !== j));

/** 行列式（整数のまま。余因子展開。n は 6 まで） */
function det(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  let s = 0;
  for (let j = 0; j < n; j++) {
    if (M[0][j] !== 0) s += (j % 2 ? -1 : 1) * M[0][j] * det(minorMatrix(M, 0, j));
  }
  return s;
}

/** 余因子行列（整数のまま）。(i, j) 成分 = (−1)^(i+j)·det(M_ij) */
function cofactorMatrix(M) {
  const n = M.length;
  if (n === 1) return [[1]];
  return M.map((_, i) => M.map((__, j) => ((i + j) % 2 ? -1 : 1) * det(minorMatrix(M, i, j))));
}

/** 随伴行列（余因子行列の転置。整数のまま） */
const adjugate = (M) => transpose(cofactorMatrix(M));
```

2×2 の場合は、公式どおりの形になります。

$$
K = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \Rightarrow
\mathrm{adj}(K) = \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
$$

### 3.2 鍵の検証と逆行列（mod 26）

`analyzeKey` が、検証と逆行列の計算をまとめて行います。
2×2 と 3×3 で同じ関数を使い、使えない理由（偶数・13の倍数・両方）も返します。

```javascript
function analyzeKey(K) {
  const n = K.length;
  const d = det(K);
  const detMod = mod(d);
  const g = gcd(detMod, MOD);
  const even = detMod % 2 === 0;
  const m13 = detMod % 13 === 0;
  const reason = g === 1 ? null : (even && m13 ? 'both' : (even ? 'even' : 'mult13'));
  const euclid = egcdSteps(detMod);
  const Kmod = reduce(K);
  const cof = cofactorMatrix(Kmod);
  const adj = transpose(cof);
  const result = {
    n, det: d, detMod, gcd: g, invertible: g === 1, reason, detInv: euclid.inverse, euclid,
    Kmod, cof, cofMod: reduce(cof), adj, adjMod: reduce(adj), inverse: null, check: null,
  };
  if (g === 1) {
    result.inverse = result.adjMod.map((row) => row.map((x) => mod(x * euclid.inverse)));
    result.check = matMul(Kmod, result.inverse);
  }
  return result;
}
```

アルゴリズムの流れは次のとおりです。

1. 各要素 $(i, j)$ について小行列式 $\det M_{ij}$ を計算する
2. 符号 $(-1)^{i+j}$ を掛けて余因子を得る
3. 余因子行列を転置して随伴行列を得る
4. $K^{-1} \equiv \det(K)^{-1} \cdot \mathrm{adj}(K) \pmod{26}$
5. 検算として $K \cdot K^{-1} \bmod 26$ を計算し、画面に単位行列が出ることを見せる

### 3.3 可逆な鍵の数

26 = 2 × 13 なので、mod 26 で可逆であることは、mod 2 と mod 13 の両方で可逆であることと同じです（中国剰余定理）。
可逆な $n \times n$ 行列の数は、有限体 $\mathrm{GF}(p)$ 上の正則行列の数 $|\mathrm{GL}(n, p)| = \prod_{k=0}^{n-1}(p^n - p^k)$ の積になります。

```javascript
function glCount(n, p) {
  const P = BigInt(p);
  const pn = P ** BigInt(n);
  let r = 1n;
  for (let k = 0; k < n; k++) r *= pn - P ** BigInt(k);
  return r;
}

function invertibleCount(n) {
  const count = glCount(n, 2) * glCount(n, 13);
  const total = BigInt(MOD) ** BigInt(n * n);
  return { count, total, ratio: Number((count * 1000000000n) / total) / 1e9 };
}
```

| サイズ | 全体 | 可逆 | 割合 |
|:--|--:|--:|--:|
| 2×2 | 456,976 | 157,248（6 × 26,208） | 約34.4% |
| 3×3 | 5,429,503,678,976 | 1,634,038,189,056（168 × 9,726,417,792） | 約30.1% |

2×2 の値は、テストで全456,976通りを数えて確かめています。

---

## 4. UI/UXの工夫

### 4.1 矢印キーナビゲーション

行列入力フィールド間を矢印キーで移動できます。

```javascript
const handleArrowKeys = (e) => {
  const row = Number(e.target.dataset.row);
  const col = Number(e.target.dataset.col);
  let newRow = row;
  let newCol = col;
  switch (e.key) {
    case 'ArrowUp': newRow = Math.max(0, row - 1); break;
    case 'ArrowDown': newRow = Math.min(N - 1, row + 1); break;
    case 'ArrowLeft': newCol = Math.max(0, col - 1); break;
    case 'ArrowRight': newCol = Math.min(N - 1, col + 1); break;
    default: return;
  }
  e.preventDefault();
  const target = inputs[newRow * N + newCol];
  if (target) {
    target.focus();
    target.select();
  }
};
```

利点は次のとおりです。

- キーボードのみで効率的に行列を入力できる
- 数値を上書きしやすいように自動選択する
- 各マスに `aria-label`（「鍵行列 1行2列」など）を付け、読み上げで位置がわかる

### 4.2 入力の検証

鍵のマスは `type="number"` ですが、値は計算部の `parseCells` で文字列から読みます。
空欄・小数・指数表記（`1e2`）・範囲外（−999〜999 の外）を「整数ではない」などとして返し、画面は何行何列が誤りかを一覧にして判定を止めます。
`number` 入力が数として読めない文字（`validity.badInput`）も、整数でないものとして扱います。

```javascript
function parseCells(values, n) {
  const errors = [];
  const nums = values.map((raw, index) => {
    const s = String(raw == null ? '' : raw).normalize('NFKC').trim().replace(/^[\u2212\u2012\u2013\u2014]/, '-');
    if (s === '') {
      errors.push({ index, key: 'err.cell.empty' });
      return 0;
    }
    if (!/^[+-]?\d+$/.test(s)) {
      errors.push({ index, key: 'err.cell.notInteger' });
      return 0;
    }
    const v = Number(s);
    if (Math.abs(v) > LIMITS.cellAbs) {
      errors.push({ index, key: 'err.cell.range', params: { limit: LIMITS.cellAbs } });
      return 0;
    }
    return v;
  });
  const matrix = Array.from({ length: n }, (_, i) => nums.slice(i * n, i * n + n));
  return { ok: errors.length === 0, matrix, errors };
}
```

### 4.3 結果をその場で計算し直す

鍵・平文・暗号文のどれを変えても、`updateKeyInfo()` から `refreshOutputs()` を呼び、暗号化と復号の結果・処理ログを計算し直します。
鍵を変えたのに古い暗号文が残る、サイズを変えたのに処理後の平文だけが変わる、といった食い違いを作らないためです。

```javascript
const refreshOutputs = () => {
  runEncrypt();
  runDecrypt();
};
```

誤りのとき（非可逆の鍵・鍵のマスの誤り・上限超え・長さ不足）は、結果の欄と処理ログを空にしてから理由を出します。
復号の長さ不足だけは、入力の途中で必ず起きるので、入力中は控えめな表示（「あと何字で区切りが合うか」）にして、復号ボタンを押したときに警告として出します。

```javascript
if (!r.ok) {
  clearDecryptOutput();
  if (r.error.key === 'err.length' && !fromButton) decryptStatusEl.textContent = t('err.lengthSoft', r.error.params);
  else showWarning(warningDecryptEl, tm(r.error));
  return;
}
```

### 4.4 逆行列の計算過程と処理ログ

「逆行列の計算過程」は、`analyzeKey` の返り値（`euclid.steps`・`cof`・`adjMod`・`inverse`・`check`）から、表と行列を DOM で組み立てます。
行列は `<table class="mat">` の左右に線を引いて括弧に見せています。

処理ログは、ブロックごとに鍵の各行との積和・mod 26・文字を1行で出します。

```text
1) HE → (7, 4)
   3×7 + 3×4 = 33 ≡ 7 (mod 26) → H
   2×7 + 5×4 = 34 ≡ 8 (mod 26) → I
   → HI
```

ログに出すのは先頭の200ブロックまでで、残りは件数だけを示します（結果の欄にはすべて入ります）。

### 4.5 タブとアコーディオン

タブは WAI-ARIA のタブの形です（`role="tablist"`・`tab`・`tabpanel`、`aria-selected`、`aria-controls`）。
選んだタブだけが Tab キーで止まり、左右の矢印・Home・End で移ります。

```javascript
const selectTab = (tab, focus = false) => {
  for (const x of tabs) {
    const on = x === tab;
    x.classList.toggle('active', on);
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
  }
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tab.dataset.tab}`);
  });
  if (focus) tab.focus();
};
```

アコーディオンはHTML5の`<details>`要素を使い、CSSで開閉の印を描いています。

```html
<details class="learn-accordion" open>
  <summary>🔑 鍵の可逆性条件</summary>
  <div class="accordion-content">
    <!-- コンテンツ -->
  </div>
</details>
```

幅480px以下では、タブを枠の幅で等分します（横スクロールで隠れるタブを作らない）。

---

## 5. セキュリティ対策

### 5.1 XSS（クロスサイトスクリプティング）対策

入力（平文・暗号文・鍵）が届く表示は、すべて `textContent` か `textarea.value` で行います。
`innerHTML` は使いません。行列・表・使用可否の印も `createElement` で組み立てます。

```javascript
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
};

const setStatus = (ok, key) => {
  clear(invertibleEl);
  invertibleEl.appendChild(el('span', ok ? 'ok' : 'ng', t(key)));
};
```

`textContent` に入れる文字列は HTML として解釈されないので、`<` を `&lt;` に置き換える前処理は不要です（置き換えると、画面に `&lt;` がそのまま出てしまう）。

### 5.2 入力の上限

```javascript
// letters: 処理する英字の上限（パディングの前）／inputChars: 入力欄の文字数の上限／cellAbs: 鍵のマスの絶対値の上限
const LIMITS = { letters: 10000, inputChars: 100000, cellAbs: 999 };
```

- 英字の数で判定するので、3×3 で英字ちょうど10,000字なら、パディング後の10,002字も暗号化できる
- 上限を超えたら切り捨てずに止め、何字あるかを示す
- 行列のサイズは最大3×3。計算量は入力の長さに比例し、10,000字でも一瞬で終わる

### 5.3 CSP（Content Security Policy）

GitHub Pages は応答ヘッダーを設定できないので、`<meta http-equiv="Content-Security-Policy">` で指定しています。

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
```

- インラインのスクリプト・スタイル（`style` 属性を含む）は許可しない。見た目はすべて `style.css` のクラスで指定する
- 外部への通信（`connect-src`）は許可しない
- `frame-ancestors` と `X-Content-Type-Options`・`X-Frame-Options` は `<meta>` では効かないので書かない
- `test/html.test.js` が、これらとインラインのイベントハンドラーがないことを検証する

### 5.4 乱数

ランダム生成は `crypto.getRandomValues` で成分を選びます。
26 で割った余りの偏りが出ないように、拒否サンプリングをしています。

```javascript
function cryptoRandomBelow(k) {
  const c = root.crypto;
  if (!c || typeof c.getRandomValues !== 'function') throw new Error('crypto.getRandomValues is not available');
  const limit = Math.floor(0x100000000 / k) * k;
  const buf = new Uint32Array(1);
  for (;;) {
    c.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % k;
  }
}
```

ただし、ヒル暗号そのものが既知平文攻撃に弱いので、作った鍵でも秘密を守る用途には使えません。

---

## 6. パフォーマンス

### 6.1 計算量の分析

| 操作 | 2×2行列 | 3×3行列 | 備考 |
|------|---------|---------|------|
| 行列式計算 | $O(1)$ | $O(1)$ | 余因子展開 |
| 逆行列計算 | $O(1)$ | $O(1)$ | 小行列式9回計算 |
| 暗号化（nブロック） | $O(n)$ | $O(n)$ | ブロックごとに行列×ベクトル |
| モジュラー逆元 | $O(\log 26) \approx O(1)$ | $O(\log 26) \approx O(1)$ | 拡張ユークリッド |

### 6.2 処理ログの量

英字10,000字を2×2で暗号化すると5,000ブロック、ログは2万行になります。
ログに出すのは先頭の200ブロックまでにして、描画を軽く保っています。

```javascript
// 処理ログに出すブロックの数の上限（結果の欄にはすべて入る）
const LOG_BLOCKS = 200;
```

### 6.3 イベントの扱い

`input` イベントのたびに計算し直しますが、計算は入力の長さに比例するだけなので、間引き（デバウンス）は入れていません。
画面の読み上げは、ボタンを押したときだけ行います（入力のたびに読み上げると、うるさくなるため）。

```javascript
const announce = (message) => {
  srStatusEl.textContent = '';
  // 同じ文でも読み上げ直すように、次の描画で入れる
  requestAnimationFrame(() => { srStatusEl.textContent = message; });
};
```

---

## 7. アーキテクチャ設計

### 7.1 モジュール構造

すべて通常のスクリプト（ES module ではない）なので、`index.html` を直接開く（file://）方法でも動きます。

```
Hill CipherLab
├── js/hill-core.js（HillCore。DOM に依存しない計算部）
│   ├── mod / gcd / egcdSteps / modInv      # 整数の計算
│   ├── normalizeText / toNums / toLetters  # 文字と数値
│   ├── det / cofactorMatrix / adjugate     # 行列（整数のまま）
│   ├── matMul / matVec / reduce            # 行列（mod 26）
│   ├── analyzeKey / parseCells             # 鍵の検証・入力
│   ├── encrypt / decrypt / blockSteps      # 暗号化・復号
│   └── randomInvertible / invertibleCount  # 乱数・鍵の数
│
├── js/messages.js（HillMessages。画面に出す文言の辞書）
│   └── t(key, params) / tm({ key, params })
│
└── script.js（画面の処理）
    ├── renderMatrixInputs / updateKeyInfo / renderSteps  # 鍵生成タブ
    ├── runEncrypt / runDecrypt / refreshOutputs          # 暗号化・復号
    ├── formatLog                                         # 処理ログ
    └── selectTab / copyText / showToast                  # 画面の部品
```

計算部は画面の文言を持たず、誤りを `{ key, params }` の形で返します。
画面は辞書でそれを文にします。

### 7.2 データフロー

```
[平文入力]
    ↓
[NFKC・大文字化・英字抽出]  ← normalizeText()
    ↓
[数値配列化 (A=0, ..., Z=25)] ← toNums()
    ↓
[パディング (X=23)]          ← encrypt() の中（復号ではしない）
    ↓
[ブロックごとに行列演算]     ← blockSteps()
    ↓
[mod 26で正規化]             ← mod()
    ↓
[文字列に復元]               ← toLetters()
    ↓
[暗号文出力・処理ログ]       ← runEncrypt() / formatLog()
```

---

## 8. テスト

`npm test`（Node.js 22以上の `node --test`、依存パッケージなし）で実行します。
GitHub Actions（`.github/workflows/test.yml`）でも、push と pull_request のたびに実行します。

### 8.1 計算部（test/core.test.js）

- 剰余・逆元：26と互いに素な12個の数がすべて逆元を持つ。`9⁻¹ = 3` の途中の行
- 行列式・余因子・随伴：README の例と、4×4 の行列式 −13204
- 鍵の検証：使えない理由（偶数・13の倍数・両方）、負の数の鍵
- 2×2 の全456,976通りの可逆判定（可逆は157,248通り）と、3×3 の乱数の鍵2,000個の逆行列の検算
- 既知解答：HELP → HIAT、Hello world → HIOZEIPJQL、ACT → POH（3×3）
- 往復：乱数の鍵と文で、暗号化→復号が元の英字に戻る（2×2・3×3 各200回）
- 境界：長さ不足の暗号文、英字10,000字と10,001字、入力欄100,001文字、空の入力、鍵のマスの誤り

### 8.2 画面と文書

- `test/html.test.js`：CSP、インラインのスクリプト・スタイル・イベントハンドラーがない、タブの ARIA、label と入力の対応、id の重複
- `test/contrast.test.js`：文字と背景の組が 4.5:1 以上
- `test/messages.test.js`：`script.js` と計算部が引くキーが辞書にある、画面の処理に日本語の文字列を置かない
- `test/readme.test.js`：README の例と数値を計算部で計算し直して確かめる、YAML メタデータの構造、ディレクトリー構造の網羅、画像の参照、表記
- `test/format.test.js`：行の長さ・行数・改行コード（1行に詰め込んだファイルを見つける）

---

## 9. 解読と学習機能

### 9.1 解読タブ

- `js/hill-attack.js`が既知平文攻撃、クリブ探索、暗号文単独攻撃を計算する。
- 既知平文攻撃はmod 2とmod 13で掃き出し法を使い、両方が一意ならCRTで組み合わせる。候補数には非可逆行列も含む。
- クリブ探索は全位置を試す。完全なブロックから鍵を決め、不完全な端のブロックも復号して一致を確認する。
- 暗号文単独攻撃は各行の単文字スコアから上位12行または20行を選び、その順列の可逆な組をバイグラムで採点する。正解の保証はない。
- `js/attack-view.js`が結果を表示する。重い探索はボタンで実行し、入力変更で候補と適用ボタンを無効にする。

### 9.2 線形性と言語

- `js/hill-lab.js`でE(P + Q) = E(P) + E(Q)を計算する。`js/lab-view.js`が鍵の変更にも追従する。
- `js/messages.js`と`js/static-messages.js`に日英の文言を置く。`js/i18n.js`はテキストノードと属性だけを書き換え、入力を保持する。
- URLの`text`と`key`は`parseFragment`で検証する。詳細と上限はREADMEの「ほかのツールからの入力」を参照する。
- 4×4以上、カスタムアルファベット、クイズは未実装である。

---

## 10. 参考文献

1. Lester S. Hill, "Cryptography in an Algebraic Alphabet", *The American Mathematical Monthly*, Vol. 36, No. 6, pp. 306–312, 1929（DOI: 10.1080/00029890.1929.11986963）
2. Lester S. Hill, "Concerning Certain Linear Transformation Apparatus of Cryptography", *The American Mathematical Monthly*, Vol. 38, No. 3, pp. 135–154, 1931（DOI: 10.1080/00029890.1931.11987161）
3. Louis Weisner, Lester S. Hill, "Message protector", US Patent 1,845,947, 1932
4. Bauer, Millward, "Cracking Matrix Encryption Row by Row", *Cryptologia*, Vol. 31, No. 1, pp. 76–83, 2007（DOI: 10.1080/01611190600947806）
5. [OEIS A000252](https://oeis.org/A000252)（2×2 の可逆な行列の数）、[OEIS A064767](https://oeis.org/A064767)（3×3）
6. [Wikipedia: Hill cipher](https://en.wikipedia.org/wiki/Hill_cipher)
7. [Extended Euclidean Algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm)
8. [MDN Web Docs: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## ライセンス

本プロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)を参照してください。
