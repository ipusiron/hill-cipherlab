// 画面に出す文言（通常のスクリプト。globalThis.HillMessages に置く）。{name} は値で埋める。
// 計算部（js/hill-core.js）と script.js は文言を持たず、ここのキーを引く。
(function (root) {
  'use strict';

  const ja = {
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

  const dict = { ja };
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
