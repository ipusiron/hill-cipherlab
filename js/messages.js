// 画面に出す文言（通常のスクリプト。globalThis.HillMessages に置く）。{name} は値で埋める。
// 計算部（js/hill-core.js）と script.js は文言を持たず、ここのキーを引く。
(function (root) {
  'use strict';

  const ja = {
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
