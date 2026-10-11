// 英語の文字の統計（自動生成。手で編集しない。通常のスクリプト。globalThis.HillEnglish に置く）
// 出所: Day018 Cipher Climb（ipusiron/cipherclimb、MIT）の ngramModel.js から、単文字とバイグラムだけを写したもの
//   元のファイルの SHA-256: b99d4501781127b43a6bb0713ff995a2d27fbae009663e2a7c4f0415dcefa6be
//   Project Gutenberg の 10 作品（パブリックドメイン）から数えた統計値で、本文は含まない
// 値は round(log10(出現確率) × 100)。BIGRAM_ROWS[i] の j 番目（36 進数 2 桁、符号を反転）＝ 1 文字目が i、2 文字目が j
(function (root) {
  'use strict';
  const SCALE = 100;
  const FLOOR = -871;
  const TOTAL_LETTERS = 5141270;
  const SOURCES = [
    { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
    { id: 76, title: "Adventures of Huckleberry Finn", author: "Mark Twain" },
    { id: 84, title: "Frankenstein", author: "Mary Wollstonecraft Shelley" },
    { id: 98, title: "A Tale of Two Cities", author: "Charles Dickens" },
    { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
    { id: 345, title: "Dracula", author: "Bram Stoker" },
    { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
    { id: 1400, title: "Great Expectations", author: "Charles Dickens" },
    { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
    { id: 2701, title: "Moby Dick; Or, The Whale", author: "Herman Melville" },
  ];
  const UNIGRAM = [
    -109, -181, -164, -134, -91, -167, -169, -119, -116, -283, -206, -139, -157,
    -116, -111, -179, -296, -125, -121, -104, -154, -203, -160, -287, -168, -323,
  ];
  const BIGRAM_ROWS = [
    'b77g726id7897m956qc18364764xbd7nbz5v5o5g8n7a84ce75b4',
    '8bace2db6cdzfbcm90awg57mcxdu7mfdhb8f9tah7edlcmin86o7',
    '72dl9ee86qdweo6n8eg57p8jdmet6jdnbl8bbv7u8ofvd4o79xeq',
    '6i7n8p856b898t796ea9as877w7y6n90bl806y6f8ja47lhb89ht',
    '5h7d6k5d6f727t6y6la49a676h5g6z749j4v5e5r92796f8f7bch',
    '7ca29zah7j8aaz8j7dc7cx8r96b26pacdj7p976y8ic79oht9sgp',
    '7b9oaeae749u9i6t7wcidk8l9m9i7caqdj7z8f7t8xc399o7aohb',
    '58a5aiar4badbg8v5lcodcad9ean6davdu8q966z8mcr9bo796in',
    '7z8y6w6u7c7n7b8natcz8m6v6u4t778sct785p5mbj808naled9t',
    'a0o7hto7a1o7gpo7b7o7o7o7ino799o7o7hbhbin9eo7ino7o7o7',
    '94b0bsby71aqcj9z7ye3e0aiaz8c9lc8erc8939cbldwa6o7aio7',
    '6q9ia16w608aas9j6fck9l6690a66o9rdna5877v8pa493hb6tgh',
    '6k8sazba5za9bj9l75csdjar8wad7387dj8q8f8g8ad09go77ho7',
    '6r8v7557648l5m7r6vaq8m8f8m8k659pb09p6w5j969q84c285e6',
    '7w81847l8w5y8w8581bn7w786d5i6q7vc95s726a5d846gbl8ycp',
    '7fbdceci70bhdi9l84e1dz7ybfcr7e8bf37k918e8vfgato7ano7',
    'ino7ino7o7o7o7hto7o7o7o7o7o7ino7o7o7o7ht88o7o7o7o7o7',
    '6e8h877e588m8r846dat8t897u7t6b8qby7x6o6k8c9b85bp7bfn',
    '63837t8v5x8c9a696dao9384808c687jao9b6j5h7fa97eg096eq',
    '69868b8r5v8l9q465tb5ag7k838s5f98bu776v697nb572ht7scx',
    '8m917u8v8kad7va68kdnam6y8j6yaq7teq6l6t6jd2ci9rdkc0ce',
    '8yhtezg060o7o7ez81hbhbgzf3fg9hino7drhte8dbgzgpo7bto7',
    '68axb1an6paxcd6d6mdlcua2ae857abye99r9a9cbzcu9yo7axfk',
    'aveqabf8ase0gzceangphbdvdxfvd49se1fve4a0djd1d8caeho7',
    '7n8m8v8s7u8v9u8g81bdbc968t9n6k98cl9h7g7kaob286htacgh',
    'affring5abgzf3fgbwinincyghgzcsgpo7hbfrezfnhtdto7cgbx',
  ];
  const decodeRow = (s) => {
    const out = [];
    for (let i = 0; i < s.length; i += 2) out.push(-parseInt(s.slice(i, i + 2), 36));
    return out;
  };
  const BIGRAM = BIGRAM_ROWS.map(decodeRow);
  root.HillEnglish = { SCALE, FLOOR, TOTAL_LETTERS, SOURCES, UNIGRAM, BIGRAM };
})(typeof globalThis !== 'undefined' ? globalThis : this);
