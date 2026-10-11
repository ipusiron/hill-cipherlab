// 画面に出す文言（通常のスクリプト。globalThis.HillMessages に置く）。{name} は値で埋める。
// 計算部（js/hill-core.js）と script.js は文言を持たず、ここのキーを引く。
(function (root) {
  'use strict';

  const ja = {
    'lab.length': '現在の鍵は{n}×{n}です。PとQにそれぞれ英字を{n}字入れてください。',
    'lab.key': '現在の鍵K（{n}×{n}）を使います。すべてmod 26で計算します。',
    'lab.equal': 'E(P + Q) = E(P) + E(Q)が成り立ちます。',
    'import.invalid': 'URLの入力を読み込めません。textは英字10,000字まで、keyは可逆な2×2または3×3のJSON行列にしてください。',
    'import.done': 'URLから入力を読み込みました。候補の鍵とサイズを確認してください。解読は自動実行しません。',
    "coa.summary": "暗号文{letters}字のうち先頭{scored}字で採点しました。行候補{rows}通り、非可逆になる行{skipped}通りを除外、可逆な組み合わせ{combos}通りを採点しました。",
    "coa.limit": "全鍵の総当たりではありません。各行の上位候補（2×2は12、3×3は20）だけを組み合わせます。英文が短い場合や、英語以外、偏った文章では正しい鍵を見逃します。",
    "coa.short": "参考の長さは{guide}字以上ですが、成功を保証する境界ではありません。",
    "coa.heads": "鍵K|英語らしさ|復号の先頭",
    "coa.none": "候補が得られませんでした。入力とサイズを確認してください。",
    "coa.rows": "逆行列の行候補（上位10件）",
    "coa.rowHeads": "行ベクトル|単文字の平均対数確率",
    "coa.done": "候補を計算しました。元の鍵である保証はありません。",
    "kpa.status.solved": "入力した組に対応する可逆な鍵が一意に決まりました。",
    "kpa.status.ambiguous": "情報が足りず、行列の候補が残っています。",
    "kpa.status.notInvertible": "行列は一意に決まりましたが、非可逆なので復号用の鍵には使えません。",
    "kpa.status.inconsistent": "同じ鍵では説明できない平文と暗号文の組です。サイズや対応位置を確認してください。",
    "kpa.summary": "使用：{blocks}ブロック（{used}字）。階数：mod 2で{r2}/{n}、mod 13で{r13}/{n}。",
    "kpa.directText": "ブロック{blocks}を列に並べた平文行列Pは可逆です（det(P) mod 26 = {det}）。K = C × P⁻¹で求めます。直接計算の組は先頭12ブロックから探します。",
    "kpa.crtText": "mod 2とmod 13でそれぞれ解き、中国剰余定理で組み合わせました。",
    "kpa.candidates": "連立方程式を満たす行列の数：mod 2で{a}通り、mod 13で{b}通り。非可逆な行列も含む数です。",
    "kpa.missing": "mod {mods}の情報が足りません。異なる平文ブロックとの対応を追加してください。",
    "kpa.used": "平文{p}字、暗号文{c}字のうち、先頭の完全なブロック{used}字を使いました。余りや対応のない部分は鍵の決定には使いません。",
    "kpa.plainLabel": "平文（暗号文の先頭から）",
    "kpa.cribLabel": "平文の一部（クリブ）",
    "kpa.err.empty": "平文と暗号文を入力してください。",
    "kpa.err.short": "{n}×{n}では完全なブロックが少なくとも{need}字必要です（対応する部分は{have}字）。",
    "crib.err.noCipher": "暗号文を入力してください。",
    "crib.err.short": "{n}×{n}のクリブは少なくとも{need}字必要です（現在{have}字）。位置によってはさらに必要です。",
    "crib.err.longer": "クリブ{crib}字が暗号文{cipher}字より長くなっています。",
    "crib.summary": "試した位置：{tried}。完全なブロックが足りた位置：{enough}。候補：{found}（上位10件まで表示）。位置は英字だけの列の1文字目を1と数えます。",
    "crib.heads": "開始位置|鍵K|英語らしさ|復号の先頭",
    "crib.none": "条件に合う可逆な鍵が見つかりません。クリブを長くするか、文字やサイズを確認してください。",
    "attack.plaintext": "暗号文全体の復号",
    "attack.ready": "入力後、実行ボタンで計算してください。入力を変えると候補を消します。",
    "attack.applied": "候補の鍵を鍵生成タブに入れました。",
    "attack.scoreNote": "英語らしさはバイグラムの平均対数確率で、値が大きいほど上位です。正解の確率ではありません。上位候補でも元の鍵や平文とは限りません。",
    "coa.err.empty": "暗号文を入力してください。",
    "coa.err.short": "少なくとも{need}字必要です（現在{have}字）。",
    // 鍵の検証
    'key.usable': '✓ 使用可能',
    'key.unusable': '✗ 使用不可',
    'key.invalidInput': '✗ 入力を直してください',
    'key.reason.ok': 'det(K) mod 26 = {detMod} は 26 と互いに素なので、逆行列があります。',
    'key.reason.even': 'det(K) mod 26 = {detMod} は偶数なので、26 と公約数 2 を持ちます（gcd = {gcd}）。逆行列がなく、復号できません。',
    'key.reason.mult13': 'det(K) mod 26 = {detMod} は 13 の倍数なので、26 と公約数 13 を持ちます（gcd = {gcd}）。逆行列がなく、復号できません。',
    'key.reason.both': 'det(K) mod 26 = 0 なので、gcd = 26 です。逆行列がなく、復号できません。',
    'key.reason.invalid': '鍵のマスに直すところがあるので、検証できません。',
    'key.ratio': '{n}×{n} の鍵 {total} 通りのうち、使えるのは {count} 通り（約 {percent}%）です。',
    'key.cellLabel': '鍵行列 {row}行{col}列',
    'key.randomDone': '可逆な鍵を作りました（{tries}回目で可逆）',
    'key.none': '—',
    'key.inverseNone': '逆行列はありません',

    // 鍵のマスの入力の誤り
    'err.cell.empty': '{row}行{col}列が空です。',
    'err.cell.notInteger': '{row}行{col}列は整数ではありません（小数・指数表記は使えません）。',
    'err.cell.range': '{row}行{col}列は −{limit}〜{limit} の範囲で入れてください。',

    // 逆行列の計算過程
    'steps.det': '① 行列式 det(K)',
    'steps.detModNote': '各成分を mod 26 の値（0〜25）にしてから計算します。',
    'steps.detResult': 'det(K) = {det} ≡ {detMod} (mod 26)',
    'steps.inv': '② det(K) の逆元（拡張ユークリッドの互除法）',
    'steps.invHead': '商 q|余り r|係数 t（r ≡ t × {a} mod 26）',
    'steps.invResult': '{a} × {inv} = {prod} ≡ 1 (mod 26) なので、det(K)⁻¹ ≡ {inv} (mod 26)',
    'steps.invNone': '余りが 1 にならず gcd(26, {a}) = {gcd} で終わるので、det(K) の逆元はありません。ここで止まります。',
    'steps.cof': '③ 余因子行列（(i, j) 成分 = (−1)^(i+j) × 小行列式）',
    'steps.adj': '④ 随伴行列 adj(K)（余因子行列の転置、mod 26）',
    'steps.scale': '⑤ K⁻¹ ≡ det(K)⁻¹ × adj(K) = {inv} × adj(K) (mod 26)',
    'steps.check': '⑥ 検算 K × K⁻¹ ≡ I (mod 26)',
    'steps.raw': '整数のまま',
    'steps.mod': 'mod 26',
    'steps.scaled': '{inv} 倍',

    // 暗号化・復号の誤り（計算部が返すキー）
    'err.notInvertible': '鍵が不可逆です（gcd(det(K), 26) = {gcd}）。「鍵生成」タブで使用可能な鍵にしてください。',
    'err.tooLong': '英字が {count} 字あります。{limit} 字までにしてください。',
    'err.inputTooLong': '入力が長すぎます。{limit} 文字までにしてください。',
    'err.length': '暗号文の英字は {count} 字で、{n} 字ずつに区切ると {rem} 字余ります。暗号文は {n} の倍数の長さになるはずなので、抜けや余分な文字がないか確かめてください（あと {missing} 字で区切りが合います）。',
    'err.lengthSoft': '英字 {count} 字（{n} 字ずつに区切るには、あと {missing} 字）',
    'err.key': '鍵のマスに直すところがあります。「鍵生成」タブで直してください。',
    'err.syncEmpty': '暗号化タブでまだ暗号文が生成されていません。先に「暗号化」タブで平文を暗号化してください。',

    // 処理後の平文・処理ログ
    'text.processedEmpty': '-',
    'text.padInfo': '末尾に {pad} を {count} 字足しました。',
    'text.ignoredInfo': '英字以外の {count} 文字は使いません。',
    'text.letters': '英字 {count} 字',
    'log.block': '{index}) {letters} → ({nums})',
    'log.row': '   {expr} = {sum} ≡ {value} (mod 26) → {letter}',
    'log.result': '   → {letters}',
    'log.more': '…（残りの {count} ブロックは省略。結果の欄にはすべて入っています）',
    'log.keyEnc': '鍵 K を掛けます（C = K × P mod 26）',
    'log.keyDec': '逆行列 K⁻¹ を掛けます（P = K⁻¹ × C mod 26）',

    // 読み上げ・トースト・ボタン
    'sr.encrypted': '暗号文を更新しました（{count} 字）',
    'sr.decrypted': '平文を更新しました（{count} 字）',
    'toast.clearedEncrypt': '暗号化タブをクリアしました',
    'toast.clearedDecrypt': '復号タブをクリアしました',
    'toast.nothingToCopy': 'コピーする内容がありません',
    'toast.copiedCipher': '暗号文をコピーしました',
    'toast.copiedPlain': '平文をコピーしました',
    'toast.copyFailed': 'コピーに失敗しました',
    'toast.synced': '暗号文を同期しました',
    'btn.copy': '📋 コピー',
    'btn.copied': '✓ コピー完了',
    'btn.sync': '🔄 同期',
    'btn.synced': '✓ 同期完了',
  };

  const en = {
    "lab.length": "The current key is {n}×{n}. Enter exactly {n} letters for each of P and Q.",
    "lab.key": "Using the current key K ({n}×{n}). All calculations are modulo 26.",
    "lab.equal": "E(P + Q) = E(P) + E(Q).",
    "import.invalid": "Cannot import this URL. text must contain at most 10,000 ASCII letters; key must be an invertible 2×2 or 3×3 JSON matrix.",
    "import.done": "Imported the URL input. Check the candidate key and size. Cryptanalysis does not run automatically.",
    "coa.summary": "Scored the first {scored} of {letters} letters. Ranked {rows} rows, excluded {skipped} nonprimitive rows, and "
      + "scored {combos} invertible combinations.",
    "coa.limit": "This is not an exhaustive key search. Only the top 12 (2×2) or 20 (3×3) rows are combined. Short, non-English "
      + "or unusual text may hide the correct key.",
    "coa.short": "{guide} letters is a rough guide, not a threshold that guarantees success.",
    "coa.heads": "Key K|English score|Decryption preview",
    "coa.none": "No candidate was found. Check the input and size.",
    "coa.rows": "Inverse-matrix row candidates (top 10)",
    "coa.rowHeads": "Row vector|Mean unigram log probability",
    "coa.done": "Candidates calculated. They are not guaranteed to include the original key.",
    "kpa.status.solved": "A unique invertible key fits the supplied pairs.",
    "kpa.status.ambiguous": "There is not enough information to determine a unique matrix.",
    "kpa.status.notInvertible": "A unique matrix was found, but it is not invertible and cannot be used as a decryption key.",
    "kpa.status.inconsistent": "No single key fits these pairs. Check the size and alignment.",
    "kpa.summary": "Used {blocks} blocks ({used} letters). Rank: {r2}/{n} modulo 2 and {r13}/{n} modulo 13.",
    "kpa.directText": "Blocks {blocks} form invertible plaintext matrix P (det(P) mod 26 = {det}). K = C × P⁻¹. Direct subsets are "
      + "sought within the first 12 blocks.",
    "kpa.crtText": "Solved separately modulo 2 and modulo 13, then combined using the Chinese remainder theorem.",
    "kpa.candidates": "Matrices satisfying the equations: {a} modulo 2 and {b} modulo 13. These counts include noninvertible matrices.",
    "kpa.missing": "More information is needed modulo {mods}. Add pairs with different plaintext blocks.",
    "kpa.used": "Used {used} letters in complete aligned blocks from {p} plaintext and {c} ciphertext letters. Unpaired letters "
      + "and partial blocks do not determine the key.",
    "kpa.plainLabel": "Plaintext (starting at the beginning of the ciphertext)",
    "kpa.cribLabel": "Known plaintext fragment (crib)",
    "kpa.err.empty": "Enter both plaintext and ciphertext.",
    "kpa.err.short": "For {n}×{n}, at least {need} aligned letters in complete blocks are required ({have} available).",
    "crib.err.noCipher": "Enter ciphertext.",
    "crib.err.short": "For {n}×{n}, the crib needs at least {need} letters ({have} supplied). Some offsets require more.",
    "crib.err.longer": "The crib ({crib} letters) is longer than the ciphertext ({cipher} letters).",
    "crib.summary": "Offsets tried: {tried}; enough complete blocks: {enough}; candidates: {found} (up to 10 shown). Positions "
      + "start at 1 in the letters-only text.",
    "crib.heads": "Start position|Key K|English score|Decryption preview",
    "crib.none": "No matching invertible key was found. Try a longer crib or check the letters and size.",
    "attack.plaintext": "Full ciphertext decryption",
    "attack.ready": "Enter text and press the action button. Editing input clears candidates.",
    "attack.applied": "Applied the candidate key to the Key tab.",
    "attack.scoreNote": "The English score is mean bigram log probability; higher ranks first. It is not the probability of being "
      + "correct. Even the top result may be wrong.",
    "coa.err.empty": "Enter ciphertext.",
    "coa.err.short": "At least {need} letters are required ({have} supplied).",
    "key.usable": "✓ Usable",
    "key.unusable": "✗ Unusable",
    "key.invalidInput": "✗ Correct the input",
    "key.reason.ok": "det(K) mod 26 = {detMod} is coprime to 26, so the inverse exists.",
    "key.reason.even": "det(K) mod 26 = {detMod} is even and shares factor 2 with 26 (gcd = {gcd}). No inverse exists; decryption is impossible.",
    "key.reason.mult13": "det(K) mod 26 = {detMod} is a multiple of 13 (gcd = {gcd}). No inverse exists; decryption is impossible.",
    "key.reason.both": "det(K) mod 26 = 0, so gcd = 26. No inverse exists; decryption is impossible.",
    "key.reason.invalid": "Correct the key cells before validation.",
    "key.ratio": "Of {total} possible {n}×{n} keys, {count} are usable (about {percent}%).",
    "key.cellLabel": "Key matrix row {row}, column {col}",
    "key.randomDone": "Generated an invertible key (attempt {tries})",
    "key.none": "—",
    "key.inverseNone": "No inverse exists",
    "err.cell.empty": "Row {row}, column {col} is empty.",
    "err.cell.notInteger": "Row {row}, column {col} is not an integer (no decimals or exponent notation).",
    "err.cell.range": "Row {row}, column {col} must be between −{limit} and {limit}.",
    "steps.det": "① Determinant det(K)",
    "steps.detModNote": "Reduce each entry modulo 26 (0–25) before calculating.",
    "steps.detResult": "det(K) = {det} ≡ {detMod} (mod 26)",
    "steps.inv": "② Inverse of det(K) (extended Euclidean algorithm)",
    "steps.invHead": "Quotient q|Remainder r|Coefficient t (r ≡ t × {a} mod 26)",
    "steps.invResult": "{a} × {inv} = {prod} ≡ 1 (mod 26), so det(K)⁻¹ ≡ {inv} (mod 26)",
    "steps.invNone": "The algorithm ends at gcd(26, {a}) = {gcd}, not 1. det(K) has no inverse. Stop here.",
    "steps.cof": "③ Cofactor matrix (entry (i, j) = (−1)^(i+j) × minor determinant)",
    "steps.adj": "④ Adjugate adj(K) (transposed cofactor matrix, mod 26)",
    "steps.scale": "⑤ K⁻¹ ≡ det(K)⁻¹ × adj(K) = {inv} × adj(K) (mod 26)",
    "steps.check": "⑥ Check K × K⁻¹ ≡ I (mod 26)",
    "steps.raw": "Integers",
    "steps.mod": "mod 26",
    "steps.scaled": "Multiply by {inv}",
    "err.notInvertible": "The key is not invertible (gcd(det(K), 26) = {gcd}). Choose a usable key in the Key tab.",
    "err.tooLong": "There are {count} letters. The limit is {limit}.",
    "err.inputTooLong": "Input is too long. The limit is {limit} characters.",
    "err.length": "The ciphertext has {count} letters: {rem} left over in blocks of {n}. Check for missing or extra letters "
      + "(length must be a multiple of {n}; {missing} more would complete a block).",
    "err.lengthSoft": "{count} letters ({missing} more needed for complete blocks of {n})",
    "err.key": "Correct the key cells in the Key tab.",
    "err.syncEmpty": "No ciphertext yet. Encrypt plaintext in the Encrypt tab first.",
    "text.processedEmpty": "-",
    "text.padInfo": "Appended {count} padding letter(s): {pad}.",
    "text.ignoredInfo": "Ignored {count} nonletter character(s).",
    "text.letters": "{count} letters",
    "log.block": "{index}) {letters} → ({nums})",
    "log.row": "   {expr} = {sum} ≡ {value} (mod 26) → {letter}",
    "log.result": "   → {letters}",
    "log.more": "… ({count} remaining blocks omitted from the log; the output contains them all)",
    "log.keyEnc": "Multiply by key K (C = K × P mod 26)",
    "log.keyDec": "Multiply by inverse K⁻¹ (P = K⁻¹ × C mod 26)",
    "sr.encrypted": "Updated ciphertext ({count} letters)",
    "sr.decrypted": "Updated plaintext ({count} letters)",
    "toast.clearedEncrypt": "Cleared the Encrypt tab",
    "toast.clearedDecrypt": "Cleared the Decrypt tab",
    "toast.nothingToCopy": "Nothing to copy",
    "toast.copiedCipher": "Copied ciphertext",
    "toast.copiedPlain": "Copied plaintext",
    "toast.copyFailed": "Copy failed",
    "toast.synced": "Synced ciphertext",
    "btn.copy": "📋 Copy",
    "btn.copied": "✓ Copied",
    "btn.sync": "🔄 Sync",
    "btn.synced": "✓ Synced",
  };
  const dict = { ja, en };
  let lang = 'ja';

  function t(key, params) {
    const table = dict[lang] || ja;
    const has = (o) => Object.prototype.hasOwnProperty.call(o, key);
    let s = has(table) ? table[key] : (has(ja) ? ja[key] : key);
    if (params) {
      s = s.replace(/\{(\w+)\}/g, (m, name) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : m));
    }
    return s;
  }

  // 計算部が返す { key, params } を文に
  const tm = (m) => (m ? t(m.key, m.params) : '');

  root.HillMessages = {
    dict,
    t,
    tm,
    getLanguage: () => lang,
    setLanguage(next) {
      if (dict[next]) lang = next;
      return lang;
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
