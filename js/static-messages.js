// Static UI translations; original text nodes are keys so inline markup stays intact.
globalThis.HillStaticMessages = Object.fromEntries([
  [
    "Hill CipherLab - ヒル暗号ツール",
    "Hill CipherLab - Hill Cipher Tool",
  ],
  [
    "このツールはJavaScriptで動きます。ブラウザーの設定でJavaScriptを有効にしてください。",
    "This tool requires JavaScript. Enable JavaScript in your browser.",
  ],
  [
    "法26の世界で2×2 / 3×3の鍵行列で暗号化・復号する",
    "Encrypt and decrypt with 2×2 / 3×3 key matrices modulo 26",
  ],
  [
    "🔑 鍵生成",
    "🔑 Key",
  ],
  [
    "🔒 暗号化",
    "🔒 Encrypt",
  ],
  [
    "🔓 復号",
    "🔓 Decrypt",
  ],
  [
    "🗝️ 解読",
    "🗝️ Cryptanalysis",
  ],
  [
    "📚 座学",
    "📚 Learn",
  ],
  [
    "🔑 鍵行列Kの設定",
    "🔑 Set key matrix K",
  ],
  [
    "Kのブロックサイズ",
    "Block size of K",
  ],
  [
    "ランダム生成（可逆）",
    "Random invertible key",
  ],
  [
    "単位行列",
    "Identity matrix",
  ],
  [
    "クリア",
    "Clear",
  ],
  [
    "鍵の検証",
    "Key validation",
  ],
  [
    "使用可否",
    "Usability",
  ],
  [
    "詳細情報を表示",
    "Show details",
  ],
  [
    "Kの逆行列（mod 26）",
    "Inverse of K (mod 26)",
  ],
  [
    "逆行列の計算過程",
    "Steps of the matrix inverse",
  ],
  [
    "平文（英字のみ有効）",
    "Plaintext (letters only)",
  ],
  [
    "非英字、空白、記号は無視。末尾はXでパディングされます。",
    "Nonletters, spaces and punctuation are ignored. X is appended as padding.",
  ],
  [
    "処理後の平文",
    "Processed plaintext",
  ],
  [
    "暗号文",
    "Ciphertext",
  ],
  [
    "📋 コピー",
    "📋 Copy",
  ],
  [
    "暗号化",
    "Encrypt",
  ],
  [
    "処理ログ（ブロック計算の詳細）",
    "Processing log (per-block calculations)",
  ],
  [
    "🔄 同期",
    "🔄 Sync",
  ],
  [
    "英字以外は無視します。暗号文の英字の数は、鍵のサイズ（2または3）の倍数になります。",
    "Nonletters are ignored. The ciphertext letter count must be a multiple of the key size (2 or 3).",
  ],
  [
    "平文",
    "Plaintext",
  ],
  [
    "末尾のXは、パディングか元の文字かを自動では区別できません。",
    "A final X cannot automatically be distinguished from padding.",
  ],
  [
    "復号",
    "Decrypt",
  ],
  [
    "🗝️ 既知平文攻撃",
    "🗝️ Known-plaintext attack",
  ],
  [
    "ヒル暗号は線形なので、平文と暗号文の組がいくつかわかると、鍵を連立一次方程式として求められます。26 = 2 × 13 なので、mod 2 と mod 13 に分けて解き、中国剰余定理で戻します。",
    "The Hill cipher is linear. Known plaintext–ciphertext pairs give linear equations for the key. Solve "
    + "modulo 2 and 13, then combine by the Chinese remainder theorem.",
  ],
  [
    "鍵のサイズ",
    "Key size",
  ],
  [
    "わかっている平文",
    "Known plaintext",
  ],
  [
    "暗号文の先頭からの平文",
    "Plaintext aligned with the start of the ciphertext",
  ],
  [
    "平文の一部（クリブ）だけ。位置はわからない",
    "Only a plaintext fragment (crib); position unknown",
  ],
  [
    "平文（暗号文の先頭から）",
    "Plaintext (starting at the beginning of the ciphertext)",
  ],
  [
    "例:",
    "Samples:",
  ],
  [
    "ACEG（候補が残る）",
    "ACEG (ambiguous)",
  ],
  [
    "クリブ THE LIGHTHOUSE",
    "Crib: THE LIGHTHOUSE",
  ],
  [
    "鍵を求める",
    "Find the key",
  ],
  [
    "この鍵を鍵生成タブに入れる",
    "Apply this key to the Key tab",
  ],
  [
    "🔍 暗号文単独攻撃（行ごとの総当たり）",
    "🔍 Ciphertext-only attack (row-by-row search)",
  ],
  [
    "鍵の逆行列 K⁻¹ を1行ずつ総当たりし、戻した文字が英語の文字の頻度にどれだけ近いかで順位をつけます。上位の行を並べ替えて組み合わせ、2文字の並び（バイグラム）の英語らしさで選びます。暗号文は英語の"
    + "文を暗号化したものとします。",
    "Search each row of K⁻¹ and rank it by English letter frequency. Combine the top rows in different "
    + "orders and rank by English bigram scores. The source plaintext is assumed to be English.",
  ],
  [
    "2×2・60字",
    "2×2 · 60 letters",
  ],
  [
    "3×3・150字",
    "3×3 · 150 letters",
  ],
  [
    "解読する",
    "Run cryptanalysis",
  ],
  [
    "🧮 線形性の実験",
    "🧮 Linearity experiment",
  ],
  [
    "鍵生成タブの鍵を使い、1ブロックずつのPとQを足します。加算はXORではなく、成分ごとのmod 26です。",
    "Using the key from the Key tab, add one block P and one block Q componentwise modulo 26. This is "
    + "addition, not XOR.",
  ],
  [
    "ブロックP",
    "Block P",
  ],
  [
    "ブロックQ",
    "Block Q",
  ],
  [
    "現在のサイズの例を入れる",
    "Load a sample for the current size",
  ],
  [
    "暗号文にも加算の関係が残ります。拡散があっても、線形な変換だけでは安全な暗号になりません。",
    "The additive relation remains in the ciphertext. Diffusion alone does not make a linear cipher secure.",
  ],
  [
    "📚 学びの要点",
    "📚 Learning notes",
  ],
  [
    "🔑 鍵の可逆性条件",
    "🔑 When a key is invertible",
  ],
  [
    "逆行列が存在する（= 復号できる）ためには、以下の条件が必要です：",
    "An inverse exists (so decryption is possible) exactly when:",
  ],
  [
    "つまり、行列式が",
    "The determinant must be",
  ],
  [
    "2 と 13 の倍数ではない",
    "divisible by neither 2 nor 13",
  ],
  [
    "必要があります。",
    ".",
  ],
  [
    "2×2 行列より 3×3 行列のほうが可逆な鍵の比率は下がる傾向",
    "The fraction of invertible matrices is smaller for 3×3 than for 2×2.",
  ],
  [
    "実装では",
    "The implementation uses",
  ],
  [
    "余因子 → 随伴 → det の逆元",
    "cofactors → adjugate → inverse of the determinant",
  ],
  [
    "の順で逆行列を計算",
    "to obtain the matrix inverse.",
  ],
  [
    "⚠️ 本ツールの制約",
    "⚠️ Tool limitations",
  ],
  [
    "非英字の扱い",
    "Nonletters",
  ],
  [
    "非英字・空白・記号は暗号化時に無視されます。そのため、",
    "Nonletters, spaces and punctuation are ignored during encryption, so",
  ],
  [
    "復号結果には単語間の空白や文末のピリオドなどは含まれません",
    "decryption does not restore spaces between words or punctuation",
  ],
  [
    "例",
    "Example",
  ],
  [
    "→ 処理 →",
    "→ normalize →",
  ],
  [
    "→ 暗号化 → 復号 →",
    "→ encrypt → decrypt →",
  ],
  [
    "空白とピリオドは復元されないため、人間が文脈から",
    "Spaces and periods are lost. The reader must reconstruct",
  ],
  [
    "に戻す必要があります。",
    "from context.",
  ],
  [
    "パディングのX",
    "Padding X",
  ],
  [
    "末尾のXは、パディングか元の文字かを自動では区別できません。元の長さや文脈を確認してください。",
    "A final X may be padding or an original letter; the tool cannot distinguish them. Check the original "
    + "length or context.",
  ],
  [
    "🎓 教育的意義",
    "🎓 Educational value",
  ],
  [
    "線形代数の応用",
    "Applied linear algebra",
  ],
  [
    ": 行列式・余因子・随伴・逆行列を有限環 ℤ₂₆ 上で体験",
    ": explore determinants, cofactors, adjugates and inverses over the finite ring ℤ₂₆",
  ],
  [
    "暗号の基礎",
    "Cryptography basics",
  ],
  [
    ": ブロック暗号の基本概念を理解",
    ": understand the basic idea of a block cipher",
  ],
  [
    "セキュリティの限界",
    "Security limitations",
  ],
  [
    ": 古典暗号の脆弱性（既知平文攻撃など）を学ぶ入口",
    ": learn why classical ciphers are vulnerable, including known-plaintext attacks",
  ],
  [
    "GitHubリポジトリー（ipusiron/hill-cipherlab）",
    "GitHub repository (ipusiron/hill-cipherlab)",
  ],
  [
    "機能の切り替え",
    "Tool tabs",
  ],
  [
    "鍵行列 K",
    "Key matrix K",
  ],
  [
    "例: HELLOWORLD",
    "Example: HELLOWORLD",
  ],
  [
    "クリップボードにコピー",
    "Copy to clipboard",
  ],
  [
    "暗号化結果がここに表示されます",
    "Ciphertext appears here",
  ],
  [
    "暗号化タブから同期",
    "Sync from the Encrypt tab",
  ],
  [
    "例: HIAT",
    "Example: HIAT",
  ],
  [
    "復号結果がここに表示されます",
    "Plaintext appears here",
  ],
  [
    "例: HELP",
    "Example: HELP",
  ],
  [
    "例を入れる",
    "Load sample",
  ],
  [
    "英語の文を暗号化した暗号文（2×2は30字、3×3は90字くらいから）",
    "Ciphertext of English prose (rough guide: 30 letters for 2×2, 90 for 3×3)",
  ],
]);
