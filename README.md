<!--
---
title: Hill CipherLab
category: classical-crypto
difficulty: 3
description: Linear algebra–based classical cipher (Hill cipher) with 2×2 / 3×3 keys. Encrypt/Decrypt in mod 26, visualize matrix inverse and validation.
tags: [cryptography, classical, hill, matrix, education, javascript]
demo: https://ipusiron.github.io/hill-cipherlab/
---
-->

# Hill CipherLab - ヒル暗号ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/hill-cipherlab?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/hill-cipherlab?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/hill-cipherlab)
![GitHub license](https://img.shields.io/github/license/ipusiron/hill-cipherlab)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/hill-cipherlab/)

**Day093 - 生成AIで作るセキュリティツール100**

**Hill CipherLab** は、「行列の掛け算と合同式」と暗号を結びつけた最初の暗号化である **ヒル暗号（Hill cipher）** を体験できるツールです。

2×2または3×3の鍵行列を使い、**法26（mod 26）** での暗号化・復号を実装します。
行列の **逆行列** を自動計算し、鍵の妥当性チェック（`gcd(det, 26) = 1`）を可視化します。

>ここでいう、法26の世界とは「26を法とするモジュラー算術」を意味します。

---

## 🌐 デモページ

👉 **[https://ipusiron.github.io/hill-cipherlab/](https://ipusiron.github.io/hill-cipherlab/)**

ブラウザーで直接お試しいただけます。

---

## 👥 対象ユーザー

このツールは以下のような方々を対象としています：

- **線形代数を学ぶ高校生・大学生**
  - 行列式、逆行列、余因子行列などの抽象的な概念を、暗号化という具体的な応用で理解したい方
  - モジュラー算術（合同式）の実用例を体験したい方

- **情報セキュリティ・暗号学を学ぶ学生**
  - 古典暗号から現代暗号への橋渡しとして、暗号の基礎概念を学びたい方
  - ブロック暗号の基本原理を理解したい方
  - 鍵の強度と数学的条件の関係を体感したい方

- **数学・情報科学の教員**
  - 線形代数や暗号学の授業で使える実習教材を探している方
  - 学生に「数学が実社会でどう使われるか」を示したい方

- **プログラミング学習者・開発者**
  - Hill暗号アルゴリズムを自分で実装する際の検証ツールとして使いたい方
  - 暗号アルゴリズムの実装をデバッグしたい方
  - 教科書や課題の答え合わせをしたい方

- **暗号技術に興味がある一般の方**
  - 歴史的な暗号システムがどのように機能するか知りたい方
  - ブラウザー上で手軽に暗号化・復号を試してみたい方
  - 数学と暗号の関係に興味がある方

---

## 📸 スクリーンショット

>!["Hello world"のヒル暗号文](assets/screenshot.png)
>*"Hello world"のヒル暗号文の生成*

---

## 📜 ヒル暗号の歴史的背景

- 1929年に数学者レスター・ヒル（Lester S. Hill）が考案。
  - 『アメリカン・マスマティカル・マンスリー』誌の6月/7月号に「代数アルファベットによる暗号」と題する論文を掲載した。
- 1931年、ヒルは『アメリカン・マスマティカル・マンスリー』誌に別の論文を発表した。
  - それは多数のマトリクスを用いた暗号化の方法であり、この数方陣にはそれ自身の加法と乗法の手順がある。
  - この特殊な多文字換字式暗号は文字対や反復文字、あるいは反復語など、解読の手がかりになりそうな要素を安全に秘匿できる。ただし、代数アルファベットと同様に、このマトリクスも万能ではなかった。
- 第二次世界大戦中、アメリカ合衆国は無線呼出符号（コールサイン）の文字群の暗号化にのみ、ヒル暗号を採用した。
  - 暗号化の手順が複雑であり、正当な受信者にとってすら復号に時間がかかりすぎたため、これ以外に実用化されなかった。

---

## 🔢 ヒル暗号の基本的な仕組み

アルファベットA-Z（26文字）を0～25の数字とみなします。

`A=0, B=1, C=2, ..., Z=25`

### 鍵生成

暗号鍵に相当する鍵行列を決めます。

```math
K = \begin{bmatrix} 3 & 3 \\ 2 & 5 \end{bmatrix}
```

### 暗号化

例：2×2の鍵行列を使う場合

暗号化では、メッセージs文字のブロックを`s×s`の正方行列（一次変換）によって変換します。

平文m="HELP"とします。

1：文字を数字に変換します。

```math
\text{H}=7, \quad \text{E}=4, \quad \text{L}=11, \quad \text{P}=15
```

2：2文字ずつまとめてベクトルにします。

```math
\text{HE} \rightarrow \begin{bmatrix} 7 \\ 4 \end{bmatrix}, \quad
\text{LP} \rightarrow \begin{bmatrix} 11 \\ 15 \end{bmatrix}
```

3：鍵行列との掛け算します。ただし、法26の世界で考えます。

最初の2文字"HE"は、次のように暗号化できます。

```math
K \begin{bmatrix} 7 \\ 4 \end{bmatrix} =
\begin{bmatrix} 3 & 3 \\ 2 & 5 \end{bmatrix} \begin{bmatrix} 7 \\ 4 \end{bmatrix} =
\begin{bmatrix} 3 \times 7 + 3 \times 4 \\ 2 \times 7 + 5 \times 4 \end{bmatrix} =
\begin{bmatrix} 21 + 12 \\ 14 + 20 \end{bmatrix} =
\begin{bmatrix} 33 \\ 34 \end{bmatrix} \equiv
\begin{bmatrix} 7 \\ 8 \end{bmatrix} \pmod{26}
```

$7 \rightarrow \text{H}$, $8 \rightarrow \text{I}$ なので、"HE"は"HI"に変換されます。

次の平文文字列"LP"は、次のように暗号化できます。

```math
K \begin{bmatrix} 11 \\ 15 \end{bmatrix} =
\begin{bmatrix} 3 & 3 \\ 2 & 5 \end{bmatrix} \begin{bmatrix} 11 \\ 15 \end{bmatrix} =
\begin{bmatrix} 3 \times 11 + 3 \times 15 \\ 2 \times 11 + 5 \times 15 \end{bmatrix} =
\begin{bmatrix} 33 + 45 \\ 22 + 75 \end{bmatrix} =
\begin{bmatrix} 78 \\ 97 \end{bmatrix} \equiv
\begin{bmatrix} 0 \\ 19 \end{bmatrix} \pmod{26}
```

$0 \rightarrow \text{A}$, $19 \rightarrow \text{T}$ なので、"LP"は"AT"に変換されます。

よって、暗号文c="HIAT"が得られました。

### 復号

復号化には鍵行列の逆行列を使います。

1：鍵行列 $K$ の逆行列 $K^{-1}$ をmod 26で求めます。

> **補足：2×2行列の逆行列の公式**
>
> 一般に、$K = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$ の逆行列は次のように求められます：
>
> $$
> K^{-1} = \frac{1}{\det K} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix} = \frac{1}{ad - bc} \begin{bmatrix} d & -b \\ -c & a \end{bmatrix}
> $$

この公式を踏まえて、計算しましょう。

```math
\det(K) = 3 \times 5 - 3 \times 2 = 15 - 6 = 9
```

9の逆数をmod 26で求めると、$9^{-1} \equiv 3 \pmod{26}$

```math
K^{-1} = \frac{1}{\det K} \begin{bmatrix} 5 & -3 \\ -2 & 3 \end{bmatrix} =
3 \times \begin{bmatrix} 5 & -3 \\ -2 & 3 \end{bmatrix} \equiv
\begin{bmatrix} 15 & 17 \\ 20 & 9 \end{bmatrix} \pmod{26}
```

検算：

```math
K \cdot K^{-1} =
\begin{bmatrix} 3 & 3 \\ 2 & 5 \end{bmatrix} \begin{bmatrix} 15 & 17 \\ 20 & 9 \end{bmatrix} =
\begin{bmatrix} 3 \times 15 + 3 \times 20 & 3 \times 17 + 3 \times 9 \\
2 \times 15 + 5 \times 20 & 2 \times 17 + 5 \times 9 \end{bmatrix} =
\begin{bmatrix} 45 + 60 & 51 + 27 \\ 30 + 100 & 34 + 45 \end{bmatrix} =
\begin{bmatrix} 105 & 78 \\ 130 & 79 \end{bmatrix} \equiv
\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} \pmod{26} = I
```

確かに得られた $K^{-1}$ と $K$ を乗算すると $I$（単位行列）になっています。

2：暗号文に逆行列を掛けます。

暗号文文字列"HI"は、次のように復号できます。

```math
K^{-1} \begin{bmatrix} 7 \\ 8 \end{bmatrix} =
\begin{bmatrix} 15 & 17 \\ 20 & 9 \end{bmatrix} \begin{bmatrix} 7 \\ 8 \end{bmatrix} =
\begin{bmatrix} 15 \times 7 + 17 \times 8 \\ 20 \times 7 + 9 \times 8 \end{bmatrix} =
\begin{bmatrix} 105 + 136 \\ 140 + 72 \end{bmatrix} =
\begin{bmatrix} 241 \\ 212 \end{bmatrix} \equiv
\begin{bmatrix} 7 \\ 4 \end{bmatrix} \pmod{26}
```

"HI"⇒"HE"と変換されます。

次に暗号文文字列"AT"は、次のように復号できます。

```math
K^{-1} \begin{bmatrix} 0 \\ 19 \end{bmatrix} =
\begin{bmatrix} 15 & 17 \\ 20 & 9 \end{bmatrix} \begin{bmatrix} 0 \\ 19 \end{bmatrix} =
\begin{bmatrix} 15 \times 0 + 17 \times 19 \\ 20 \times 0 + 9 \times 19 \end{bmatrix} =
\begin{bmatrix} 323 \\ 171 \end{bmatrix} \equiv
\begin{bmatrix} 11 \\ 15 \end{bmatrix} \pmod{26}
```

"AT"⇒"LP"と変換されます。

よって、復号結果として"HELP"が得られます。

---

## ⭐ ヒル暗号の特徴

### 長所

- 同じ文字でも位置によって違う文字に暗号化される
- 単純な頻度分析では解読しにくい
- 行列のサイズを大きくすると、より強力になる

### 短所

- 平文と暗号文のペアが少し分かれば解読できてしまう
- 現代の暗号としては弱い（コンピューターで簡単に解読可能）

---

## 🔗 別の古典暗号との関係性

### ヒル暗号は任意の多字を暗号化する

| 暗号名 | 暗号の種類 | 暗号化の特徴 | 自作ツール |
|---------------|------------|---------------------|------|
| シフト暗号 | 単一換字式暗号 | 1文字ずつ暗号化する。 | [Caesar Cipher Wheel Tool](https://ipusiron.github.io/caesar-cipher-wheel/) |
| ビジュネル暗号 | 多表式暗号 | 1文字ずつ暗号化する。 | [Vigenere Cipher Tool](https://ipusiron.github.io/vigenere-cipher-tool/) |
| ポルタ暗号      | 多文字換字式暗号 | 2文字を記号1文字に暗号化する。ただし、記号1文字を数字3桁に対応できる。 | [Porta CipherLab](https://ipusiron.github.io/porta-cipherlab/) |
| プレイフェア暗号 | 多文字換字式暗号 | 2文字を2文字に暗号化する。|  |
| ヒル暗号 | 多文字換字式暗号 | s文字をまとめてs文字に暗号化する。 | 本ツール[Hill CipherLab](https://ipusiron.github.io/hill-cipherlab/) |

プレイフェア暗号やポルタ暗号のような二文字換字式暗号の登場後、それを多字に拡張する試みがなかなか実を結んでいませんでした。
そんななか登場したのがヒル暗号です。

モジュラー算術自体が複雑というわけではありませんが、
当時はコンピューターのない時代であり、手作業で何度もモジュラー算術することは手間がかかりました。
そのため、このことがヒル暗号の実用化の壁となりました。

ヒルはs=6まで扱える暗号化装置の特許を取得しましたが、結局無線のコールサインの暗号化くらいにしか使われませんでした。
その一方で、暗号を数式で扱うという着眼点は多くの研究者に与えました。

### ヒル暗号は行列版のアフィン暗号

以下のように、4文字の平文文字を一気に4文字の暗号文に変換するものとします（s=4）。

$$
\begin{aligned}
y_1 &= 24x_1 + 7x_2 + 18x_3 + 3x_4 \\
y_2 &= 4x_1 + 16x_2 + 5x_3 + 19x_4 \\
y_3 &= 17x_1 + 2x_2 + 6x_3 + 3x_4 \\
y_4 &= 20x_1 + 3x_2 + 6x_3 + 11x_4
\end{aligned}
$$

ベクトル $\mathbf{x}=(x_1, x_2, x_3, x_4)$ と $\mathbf{y}=(y_1, y_2, y_3, y_4)$ 、係数行列 $A$ を使うと、$\mathbf{y}=A\mathbf{x}$ と表現できます。

$\mathbf{y}=A\mathbf{x}+\mathbf{B}, \mathbf{B}=\mathbf{0}$ と考えると、アフィン暗号の行列版と捉えられます。
行列 $A$ が暗号鍵そのものです。

| 暗号名 | 暗号化の式 | 自作ツール |
|-------|------------|-----------|
| アフィン暗号 | $\text{Enc}(m)=(a \cdot m + b) \bmod n$ | [Affine CipherLab](https://ipusiron.github.io/affine-cipherlab/) |
| ヒル暗号 | $\text{Enc}(\mathbf{x})=A\mathbf{x}$ | [Hill CipherLab](https://ipusiron.github.io/hill-cipherlab/) |

---

## ✨ 本ツールでできること

本ツールは4つのタブで構成されています：

### 🔑 鍵生成タブ
- **2×2 / 3×3 の鍵行列を設定**：サイズ切り替え、手動入力、ランダム生成、単位行列の設定が可能
- **鍵の検証**：
  - 使用可否の判定（可逆かどうか）
  - 詳細情報：`det(K)`、`det(K) mod 26`、`gcd(det(K), 26)`、`det(K)^{-1} mod 26`
- **逆行列の自動計算（mod 26）**：余因子行列→随伴行列→det の逆元の順で計算し、表示
- **矢印キーナビゲーション**：行列入力フィールド間を矢印キーで移動可能

### 🔒 暗号化タブ
- **平文の入力と暗号化**：英字のみ有効（非英字・空白・記号は自動で無視）
- **処理後の平文表示**：パディング（末尾のX）を含む実際に暗号化される文字列を確認
- **暗号文の出力**：暗号化結果をクリップボードにコピー可能
- **処理ログ**：ブロック計算の詳細を展開表示

### 🔓 復号タブ
- **暗号文の入力と復号**：暗号化タブから暗号文を同期可能
- **平文の出力**：復号結果をクリップボードにコピー可能
- **処理ログ**：ブロック計算の詳細を展開表示

### 📚 座学タブ
- **鍵の可逆性条件**：`gcd(det(K), 26) = 1` の意味と重要性
- **本ツールの制約**：非英字の扱い、パディングのXについての説明
- **教育的意義**：線形代数、暗号の基礎、セキュリティの限界について

文字は `A=0,…,Z=25` にマップ。英字のみ処理（必要に応じて `X` でパディング）

### 数式（英大文字アルファベット）

- 平文ベクトル $P \in \mathbb{Z}_{26}^n$（n=2 or 3）
- 鍵行列 $K \in \mathbb{Z}_{26}^{n\times n}$
- 暗号化 $C \equiv K P \pmod{26}$
- 復号 $P \equiv K^{-1} C \pmod{26}$
- ただし、逆行列が存在する条件は **$\gcd(\det K, 26)=1$**（= 2 と 13 の倍数でない）

### 注意点

- 入力は英字のみ扱います（数字・記号・空白は無視）。ブロック長に満たない末尾は `X` で自動パディング。
- **非英字・空白・記号は暗号化時に無視されるため、復号結果には単語間の空白や文末のピリオドなどは含まれません。** 復号後は文脈から適切に補う必要があります。
  - 例: `"HELLO WORLD."` → 暗号化前処理 → `"HELLOWORLD"` → 暗号化 → 復号 → `"HELLOWORLD"` （空白とピリオドは復元されない）
- **復号結果の末尾にXが現れた場合**、パディング用のXである可能性が高いですが、元のメッセージに含まれていた文字Xである可能性も若干あります。文脈から判断する必要があります。
- 26 は合成数（2×13）なので、**det(K) が偶数または 13 の倍数**だと逆行列が存在しません。
- 3×3 は 2×2 より検証が厳しめ（逆行列が存在しないケースがやや多い）です。

---

## 💡 活用シナリオ

### シナリオ1: 線形代数の授業での実習教材として
**対象**: 高校・大学の数学教育

線形代数を学ぶ学生にとって、抽象的な行列演算を「暗号化」という具体的な応用で体験できます。

- **学習の流れ**:
  1. 「鍵生成」タブで2×2の鍵行列を手動入力（例: `[[3,3],[2,5]]`）
  2. 行列式が自動計算され、`gcd(det, 26) = 1` の条件を確認
  3. 逆行列がmod 26で自動計算される過程を観察
  4. 「暗号化」タブで `"HELP"` を暗号化 → `"HIAT"` を確認
  5. 「復号」タブで `"HIAT"` を復号 → 元の `"HELP"` に戻ることを確認

- **教育効果**:
  - 行列式、余因子、随伴行列の計算が「なぜ必要か」を実感
  - モジュラー算術（合同式）の実用例を体験
  - 「逆行列が存在しない場合」の影響を直接確認できる

### シナリオ2: 暗号学入門の演習として
**対象**: 情報セキュリティを学ぶ学生・エンジニア

古典暗号から現代暗号への橋渡しとして、暗号の基礎概念を学べます。

- **学習の流れ**:
  1. まず2×2行列で暗号化・復号の基本を理解
  2. 3×3行列に変更し、ブロックサイズが大きくなると何が変わるかを観察
  3. 「ランダム生成」で複数の鍵を試し、可逆な鍵の比率を体感
  4. 意図的に `det(K) = 13` の行列を作成し、エラーメッセージを確認
  5. 処理ログで暗号化の内部動作（ブロック分割→行列演算）を確認

- **教育効果**:
  - 「鍵の強度」が数学的条件に依存することを理解
  - ブロック暗号の基本概念（平文をブロックに分割して処理）を体験
  - 既知平文攻撃の脆弱性（同じ鍵で複数回暗号化すると解読可能）を学ぶ入口

### シナリオ3: プログラミング課題の検証ツールとして
**対象**: 暗号アルゴリズムを実装する開発者・学生

自分で実装したHill暗号プログラムの動作確認に利用できます。

- **活用方法**:
  1. 自作プログラムと同じ鍵行列をツールに入力
  2. 同じ平文を入力し、暗号化結果を比較
  3. 処理ログで中間値（ブロック分割後の数値配列）を確認
  4. 復号処理も同様に検証し、デバッグに活用

- **具体例**:
  ```python
  # Pythonで実装したHill暗号の検証
  K = [[6, 24], [1, 13]]  # 自分の鍵行列
  plaintext = "ACT"       # テストデータ

  # ツールで同じ鍵・平文を入力
  # → 暗号文 "POH" が得られる
  # → 自作プログラムの出力と一致するか確認
  ```

- **メリット**:
  - 逆行列計算のバグを発見しやすい
  - パディング処理の実装ミスを検出できる
  - 教科書の例題の答え合わせにも使える

---

## 🎓 教育的ポイント
- 線形代数（行列式・余因子・随伴・逆行列）を**有限環 $\mathbb{Z}_{26}$** 上で体験
- 「鍵の強度」と「逆行列の存在条件」の直感を養成
- ブロック置換型の古典暗号の限界（既知平文攻撃など）へ橋渡し

---

## 📐 実装に使う定義と数式

### 余因子行列（Cofactor Matrix）

各要素の**余因子**を並べた行列です。余因子とは、その要素を除いた小行列の行列式に符号 $(-1)^{i+j}$ を掛けたものです。

$$
\mathrm{Cof}(K) = [(-1)^{i+j}\det M_{ij}]
$$

ここで $M_{ij}$ は、$i$ 行 $j$ 列を除いた小行列（minor）を指します。

**例**：$K = \begin{bmatrix} 3 & 3 \\ 2 & 5 \end{bmatrix}$ の場合

- $(1,1)$ 要素の余因子: $(-1)^{1+1} \det[5] = 5$
- $(1,2)$ 要素の余因子: $(-1)^{1+2} \det[2] = -2$
- $(2,1)$ 要素の余因子: $(-1)^{2+1} \det[3] = -3$
- $(2,2)$ 要素の余因子: $(-1)^{2+2} \det[3] = 3$

よって、$\mathrm{Cof}(K) = \begin{bmatrix} 5 & -2 \\ -3 & 3 \end{bmatrix}$

### 随伴行列（Adjugate Matrix / Adjoint）

余因子行列の**転置**（行と列を入れ替えたもの）が随伴行列です。

$$
\mathrm{adj}(K) = \mathrm{Cof}(K)^\mathsf{T}
$$

**例**：上記の余因子行列を転置すると

$$
\mathrm{adj}(K) = \begin{bmatrix} 5 & -3 \\ -2 & 3 \end{bmatrix}
$$

### 逆行列の計算式

随伴行列と行列式の逆元を使って、逆行列を計算します。

$$
K^{-1} \equiv (\det K)^{-1} \cdot \mathrm{adj}(K) \pmod{26}
$$

この公式により、mod 26の世界でも逆行列を求めることができます。

---

## 🔧 技術実装詳細

アルゴリズム、セキュリティ対策、パフォーマンス最適化などの技術的な詳細については、開発者向けドキュメントを参照してください：

👉 **[TECHNICAL.md - 技術実装詳細](TECHNICAL.md)**

主な内容：
- モジュラー演算と拡張ユークリッドの互除法
- 2×2 / 3×3 行列の逆行列計算アルゴリズム
- XSS/DoS対策などのセキュリティ実装
- 矢印キーナビゲーションなどのUI/UX工夫
- アーキテクチャ設計とデータフロー

---

## 📁 ディレクトリー構成

```
hill-cipherlab/
├── index.html          # メインHTML（4タブ構成のUI）
├── style.css           # スタイルシート（Calm Light Theme）
├── script.js           # JavaScript（暗号ロジック + UI制御）
├── README.md           # プロジェクト概要・使い方
├── TECHNICAL.md        # 技術実装詳細（開発者向け）
├── CLAUDE.md           # Claude向けプロジェクト情報
├── LICENSE             # MITライセンス
├── .gitignore          # Git除外設定
├── .nojekyll           # GitHub Pages設定（Jekyllを無効化）
└── assets/
    └── screenshot.png  # スクリーンショット画像
```

---

## 📄 ライセンス

MIT License – 詳細は [LICENSE](LICENSE) を参照してください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
