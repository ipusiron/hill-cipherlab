// 解読タブの例（通常のスクリプト。globalThis.HillSamples に置く）
// 英文はこのツールのために書いたもの（引用ではない）。暗号文は画面で鍵から作る。
(function (root) {
  'use strict';

  const TEXT = [
    'It was a bright cold morning when the old ferry left the harbour and the gulls followed it out past the',
    'lighthouse. Nobody on board knew that the captain carried a sealed letter from the governor, and nobody guessed',
    'that the letter would change the fate of the small island before the end of the week. The passengers talked about',
    'the weather, the price of fish, and the new school that had opened near the church. A young teacher sat alone near',
    'the rail and read a book about the history of secret writing, from the scytale of the Spartans to the machines of',
    'the last great war. She had promised her students that she would show them how a message could be hidden inside a',
    'grid of numbers, and she wanted to understand every step before she tried to explain it to anyone else. When the',
    'ferry reached the island the rain began, and the teacher ran up the hill to the school with the book under her coat.',
  ].join(' ');

  // 既知平文攻撃の例。plain と key から暗号文を作って入れる
  const KPA = [
    { id: 'help', n: 2, key: [[3, 3], [2, 5]], plain: 'HELP' },
    { id: 'even', n: 2, key: [[3, 3], [2, 5]], plain: 'ACEG' },
    { id: 'evenMore', n: 2, key: [[3, 3], [2, 5]], plain: 'ACEGHELP' },
    { id: 'dawn', n: 3, key: [[6, 24, 1], [13, 16, 10], [20, 17, 15]], plain: 'ATTACKATDAWN' },
    { id: 'retreat', n: 3, key: [[6, 24, 1], [13, 16, 10], [20, 17, 15]], plain: 'RETREATNOWPLEASE' },
  ];

  // クリブの位置探しの例。例文を key で暗号化し、crib を探す
  const CRIB = { n: 3, key: [[6, 24, 1], [13, 16, 10], [20, 17, 15]], letters: 240, crib: 'THE LIGHTHOUSE' };

  // 暗号文単独攻撃の例。例文の先頭 letters 字を key で暗号化する
  const COA = [
    { id: 'coa2', n: 2, key: [[5, 8], [17, 3]], letters: 60 },
    { id: 'coa3', n: 3, key: [[6, 24, 1], [13, 16, 10], [20, 17, 15]], letters: 150 },
  ];

  root.HillSamples = { TEXT, KPA, CRIB, COA };
})(typeof globalThis !== 'undefined' ? globalThis : this);
