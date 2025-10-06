# Hill CipherLab - 技術実装詳細

このドキュメントでは、Hill CipherLabの技術的な実装、アルゴリズム、設計上の工夫について詳しく解説します。

---

## 目次

1. [コア暗号アルゴリズム](#1-コア暗号アルゴリズム)
2. [モジュラー演算の実装](#2-モジュラー演算の実装)
3. [行列演算の実装](#3-行列演算の実装)
4. [UI/UXの工夫](#4-uiuxの工夫)
5. [セキュリティ対策](#5-セキュリティ対策)
6. [パフォーマンス最適化](#6-パフォーマンス最適化)

---

## 1. コア暗号アルゴリズム

### 1.1 Hill暗号の数学的基盤

Hill暗号は線形代数に基づくブロック暗号で、以下の式で表されます：

**暗号化**: $C \equiv K \cdot P \pmod{26}$
**復号**: $P \equiv K^{-1} \cdot C \pmod{26}$

ここで：
- $K$: 鍵行列（2×2 または 3×3）
- $P$: 平文ベクトル
- $C$: 暗号文ベクトル
- $K^{-1}$: 鍵行列の逆行列（mod 26）

### 1.2 実装の流れ

```javascript
// 1. 平文を数値配列に変換（A=0, B=1, ..., Z=25）
const toAlphaNums = (s) =>
  (s.toUpperCase().match(/[A-Z]/g) || []).map(ch => ch.charCodeAt(0) - 65);

// 2. ブロックサイズに合わせてパディング（末尾をXで埋める）
const padBlocks = (nums, n) => {
  const r = nums.slice();
  while (r.length % n !== 0) r.push(23); // 'X' = 23
  return r;
};

// 3. ブロックごとに行列演算
const matMulVec = (M, v) => {
  const n = M.length;
  const res = Array(n).fill(0);
  for (let i=0;i<n;i++){
    let s = 0;
    for (let j=0;j<n;j++) s += M[i][j]*v[j];
    res[i] = mod(s);  // mod 26で剰余を計算
  }
  return res;
};
```

**特徴**:
- 非英字は自動的に除外される（正規表現 `/[A-Z]/g`）
- ブロック長が足りない場合は自動的にXでパディング
- すべての演算はmod 26で正規化

---

## 2. モジュラー演算の実装

### 2.1 常に正の剰余を返すmod関数

JavaScriptの `%` 演算子は負の数に対して負の剰余を返すため、独自のmod関数を実装：

```javascript
const mod = (a, m=26) => {
  let r = a % m;
  return r < 0 ? r + m : r;  // 負の場合はmを加算
};
```

**例**:
- JavaScript標準: `-3 % 26 = -3`
- 本実装: `mod(-3, 26) = 23`

### 2.2 拡張ユークリッドの互除法

モジュラー逆元の計算に拡張ユークリッドの互除法を使用：

```javascript
const modInv = (a, m=26) => {
  a = mod(a, m);
  if (a === 0) return null;
  let [t, newT] = [0, 1];
  let [r, newR] = [m, a];
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (r !== 1) return null;  // gcd(a,m) ≠ 1 なら逆元なし
  return mod(t, m);
};
```

**アルゴリズムの詳細**:
1. ベズーの等式 $ax + my = \gcd(a, m)$ を解く
2. $\gcd(a, m) = 1$ なら $x$ が逆元
3. 時間計算量: $O(\log \min(a, m))$

**例**: $9^{-1} \bmod 26 = 3$
- 検証: $9 \times 3 = 27 \equiv 1 \pmod{26}$ ✓

---

## 3. 行列演算の実装

### 3.1 2×2行列の逆行列

2×2行列の逆行列は公式を使用：

```javascript
const adjugate2 = (M) => {
  const [[a,b],[c,d]] = M;
  return [
    [ mod(d), mod(-b) ],
    [ mod(-c), mod(a) ]
  ];
};

// 逆行列 = det(K)^{-1} × adj(K)
const inv2 = (M) => {
  const detM = det2(M);
  const detInv = modInv(detM, 26);
  if (detInv === null) return null;
  const adj = adjugate2(M);
  return matScalar(adj, detInv);
};
```

**公式**:

$$
K = \begin{bmatrix} a & b \\ c & d \end{bmatrix} \Rightarrow
K^{-1} = \frac{1}{ad-bc} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
$$

### 3.2 3×3行列の逆行列

3×3行列は余因子行列→随伴行列→逆行列の順で計算：

```javascript
// ステップ1: 小行列式（minor）を計算
const minor2Det = (M, row, col) => {
  const m = [];
  for (let r = 0; r < 3; r++) if (r !== row) {
    const rowArr = [];
    for (let c = 0; c < 3; c++) if (c !== col) {
      rowArr.push(M[r][c]);
    }
    m.push(rowArr);
  }
  return mod(m[0][0]*m[1][1] - m[0][1]*m[1][0], 26);
};

// ステップ2: 余因子行列を作成
const adjugate3 = (M) => {
  const cof = Array.from({length:3},()=>Array(3).fill(0));
  for (let i=0;i<3;i++){
    for (let j=0;j<3;j++){
      const sign = ((i+j)%2===0)? 1 : -1;
      cof[i][j] = mod(sign * minor2Det(M, i, j));
    }
  }
  // ステップ3: 転置して随伴行列を得る
  const adj = Array.from({length:3},()=>Array(3).fill(0));
  for (let i=0;i<3;i++){
    for (let j=0;j<3;j++){
      adj[i][j] = cof[j][i];
    }
  }
  return adj;
};
```

**アルゴリズムの流れ**:
1. 各要素 $(i, j)$ について小行列式 $M_{ij}$ を計算
2. 符号 $(-1)^{i+j}$ を掛けて余因子を得る
3. 余因子行列を転置して随伴行列を得る
4. $K^{-1} = \det(K)^{-1} \cdot \text{adj}(K)$

---

## 4. UI/UXの工夫

### 4.1 矢印キーナビゲーション

行列入力フィールド間を矢印キーで移動可能：

```javascript
const handleArrowKeys = (e) => {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  let newRow = row, newCol = col;

  switch(e.key) {
    case 'ArrowUp':    newRow = Math.max(0, row - 1); break;
    case 'ArrowDown':  newRow = Math.min(N - 1, row + 1); break;
    case 'ArrowLeft':  newCol = Math.max(0, col - 1); break;
    case 'ArrowRight': newCol = Math.min(N - 1, col + 1); break;
  }

  const targetIdx = newRow * N + newCol;
  inputs[targetIdx].focus();
  inputs[targetIdx].select();  // テキストを自動選択
};
```

**利点**:
- キーボードのみで効率的に行列を入力可能
- 数値を上書きしやすいように自動選択
- アクセシビリティ向上

### 4.2 リアルタイム検証

鍵行列の入力時に即座に可逆性を検証：

```javascript
const updateKeyInfo = () => {
  const K = readMatrix();
  const detK = (N === 2) ? det2(K) : det3(K);
  const detKmod = mod(detK, 26);
  const g = gcd(detKmod, 26);

  // 可逆性の判定
  const invertible = (g === 1);

  // UIに反映
  invertibleEl.innerHTML = invertible
    ? '<span class="ok-text">✓ 使用可能（可逆）</span>'
    : '<span class="ng-text">✗ 使用不可（非可逆）</span>';

  // 逆行列を計算して表示
  if (invertible) {
    const Kinv = (N === 2) ? inv2(K) : inv3(K);
    invMatrixEl.innerHTML = matrixToHTML(Kinv);
  }
};
```

**特徴**:
- 入力と同時に検証（`input`イベント）
- 詳細情報はアコーディオンで折りたたみ可能
- 視覚的フィードバック（✓/✗、色分け）

### 4.3 処理後平文のリアルタイム表示

暗号化前の実際の文字列（パディング含む）を表示：

```javascript
const updateProcessedPlaintext = () => {
  const raw = plaintextEl.value;
  if (!raw) {
    processedPlaintextEl.textContent = '-';
    return;
  }
  const limitedInput = raw.slice(0, 10000);  // DoS対策
  const Pnums = padBlocks(toAlphaNums(limitedInput), N);
  const processed = fromAlphaNums(Pnums);
  processedPlaintextEl.textContent = processed;
};
```

**利点**:
- 非英字が除外されることを視覚的に確認
- パディングのXを事前に確認可能
- 暗号化結果を予測しやすい

### 4.4 タブシステムとアコーディオン

純粋なHTML/CSS/JavaScriptでタブとアコーディオンを実装：

```javascript
// タブ切り替え
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    // 全タブの非アクティブ化
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    // 選択タブのアクティブ化
    tab.classList.add('active');
    document.getElementById(`tab-${targetTab}`).classList.add('active');
  });
});
```

アコーディオンはHTML5の`<details>`要素を使用し、CSSでスタイリング：

```html
<details class="learn-accordion" open>
  <summary>🔑 鍵の可逆性条件</summary>
  <div class="accordion-content">
    <!-- コンテンツ -->
  </div>
</details>
```

---

## 5. セキュリティ対策

### 5.1 XSS（クロスサイトスクリプティング）対策

**テキストのサニタイゼーション**:

```javascript
const showWarning = (el, msg) => {
  const sanitizedMsg = String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  el.textContent = sanitizedMsg;  // textContentを使用（innerHTMLは使わない）
  el.classList.remove('hidden');
};

const showToast = (message, type = 'info') => {
  const sanitizedMessage = String(message)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  toastEl.textContent = sanitizedMessage;
  // ...
};
```

**安全なDOM操作**:

```javascript
// 悪い例（XSSのリスク）
matrixArea.innerHTML = ''; // 使わない

// 良い例（安全）
while (matrixArea.firstChild) {
  matrixArea.removeChild(matrixArea.firstChild);
}
```

### 5.2 DoS（サービス拒否攻撃）対策

**入力長制限**:

```javascript
const limitedInput = plaintextEl.value.slice(0, 10000);
const Pnums = padBlocks(toAlphaNums(limitedInput), N);

if (Pnums.length > 10000) {
  showWarning(warningEncryptEl, '入力が長すぎます。10000文字以内にしてください。');
  return;
}
```

**計算量の制限**:
- 行列サイズは最大3×3に制限
- ブロック数の上限チェック
- タイムアウト処理は不要（計算量が十分小さい）

### 5.3 CSP（Content Security Policy）ヘッダー

GitHub Pagesでの公開時に推奨される設定（`.htaccess`または`_headers`）：

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
```

---

## 6. パフォーマンス最適化

### 6.1 計算量の分析

| 操作 | 2×2行列 | 3×3行列 | 備考 |
|------|---------|---------|------|
| 行列式計算 | $O(1)$ | $O(1)$ | 直接計算 |
| 逆行列計算 | $O(1)$ | $O(1)$ | 小行列式9回計算 |
| 暗号化（nブロック） | $O(n)$ | $O(n)$ | ブロックごとに行列×ベクトル |
| モジュラー逆元 | $O(\log 26) \approx O(1)$ | $O(\log 26) \approx O(1)$ | 拡張ユークリッド |

### 6.2 メモリ効率

**効率的な配列操作**:

```javascript
// 悪い例：毎回新しい配列を作成
const chunk = (arr, n) => {
  return Array.from({length: Math.ceil(arr.length/n)},
    (_, i) => arr.slice(i*n, i*n+n));
};

// 良い例：ループで効率的に分割
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) {
    out.push(arr.slice(i, i + n));
  }
  return out;
};
```

### 6.3 イベントハンドラの最適化

**不要な再描画を防ぐ**:

```javascript
// リアルタイム検証だが、inputイベントで自然なデバウンス効果
inp.addEventListener('input', () => updateKeyInfo());

// コピーボタンは一時的にテキスト変更（視覚フィードバック）
btnCopyEncrypt.addEventListener('click', async () => {
  await navigator.clipboard.writeText(text);
  btnCopyEncrypt.textContent = '✓ コピー完了';
  setTimeout(() => {
    btnCopyEncrypt.textContent = '📋 コピー';
  }, 2000);
});
```

---

## 7. アーキテクチャ設計

### 7.1 モジュール構造

```
Hill CipherLab
├── ユーティリティ層
│   ├── gcd(a, b)           # 最大公約数
│   ├── mod(a, m)           # モジュラー演算
│   └── modInv(a, m)        # モジュラー逆元
│
├── 暗号演算層
│   ├── toAlphaNums(s)      # 文字→数値変換
│   ├── fromAlphaNums(arr)  # 数値→文字変換
│   ├── padBlocks(nums, n)  # パディング
│   └── chunk(arr, n)       # ブロック分割
│
├── 行列演算層
│   ├── det2(M), det3(M)    # 行列式
│   ├── adjugate2(M), adjugate3(M)  # 随伴行列
│   ├── matMulVec(M, v)     # 行列×ベクトル
│   └── matScalar(M, s)     # スカラー倍
│
├── UI制御層
│   ├── renderMatrixInputs() # 行列入力UI
│   ├── updateKeyInfo()      # 鍵検証
│   ├── showWarning()        # 警告表示
│   └── showToast()          # トースト通知
│
└── イベント処理層
    ├── タブ切り替え
    ├── 暗号化/復号処理
    ├── コピー/同期機能
    └── キーボードナビゲーション
```

### 7.2 データフロー

```
[平文入力]
    ↓
[英字抽出 & 大文字化]  ← toAlphaNums()
    ↓
[数値配列化 (A=0, ..., Z=25)]
    ↓
[パディング (X=23)]    ← padBlocks()
    ↓
[ブロック分割]         ← chunk()
    ↓
[各ブロックに行列演算] ← matMulVec()
    ↓
[mod 26で正規化]       ← mod()
    ↓
[文字列に復元]         ← fromAlphaNums()
    ↓
[暗号文出力]
```

---

## 8. テスト戦略

### 8.1 単体テストの観点

**モジュラー演算**:
- `mod(-3, 26) === 23`
- `modInv(9, 26) === 3`
- `modInv(2, 26) === null` (gcd(2,26) = 2)

**行列演算**:
- 単位行列の逆行列は単位行列
- $K \cdot K^{-1} \equiv I \pmod{26}$
- det(K) = 0 の場合は逆行列なし

**暗号化/復号**:
- `encrypt(decrypt(text)) === text`（パディングのXを除く）
- 非英字は無視される
- 空文字列の処理

### 8.2 統合テストの観点

**UI動作**:
- タブ切り替えが正常に動作
- 矢印キーナビゲーション
- コピー機能が動作
- 同期機能が動作

**エッジケース**:
- 極端に長い入力（10000文字以上）
- すべて非英字の入力
- 逆行列が存在しない鍵での暗号化試行

---

## 9. 今後の拡張案

### 9.1 機能拡張

- **4×4以上の行列対応**: より強固な暗号化
- **カスタムアルファベット**: 26文字以外の文字集合
- **バッチ処理**: 複数の平文を一括暗号化
- **鍵の保存/読込**: LocalStorageを活用

### 9.2 教育機能の強化

- **ステップバイステップ表示**: 計算過程をアニメーション
- **クイズモード**: 暗号解読の練習問題
- **既知平文攻撃のデモ**: セキュリティの脆弱性を学習

### 9.3 パフォーマンス改善

- **Web Workers**: 大量データ処理の並列化
- **WebAssembly**: 行列演算の高速化
- **Progressive Web App**: オフライン対応

---

## 10. 参考文献

1. Lester S. Hill, "Cryptography in an Algebraic Alphabet", *The American Mathematical Monthly*, 1929
2. [Wikipedia: Hill cipher](https://en.wikipedia.org/wiki/Hill_cipher)
3. [Extended Euclidean Algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm)
4. [MDN Web Docs: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## ライセンス

本プロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)を参照してください。
