// ================================================================
// lessons.js – チェス 第03巻 序盤、レッスン表
// ================================================================
//
// この巻の「文章」と「盤」と「できたの条件」だけを持つ。
// 盤を描くのは /kids/shared/chess-lessons.js、
// ルールの判定は /kids/shared/chess.js。
//
// ★ この巻は「いちばん いい手」を当てさせない ★
//   2巻の問題は駒得か詰みで決まるので、唯一の最善であることを
//   機械で証明できた。序盤はそうではない。1.e4 と 1.d4 の
//   どちらが良いかには答えが無く、強い人の間でも流行が変わる。
//
//   だからこの巻は 1巻と同じ line（棋譜を見せて、そのとおりに指す）
//   だけを使う。画面に出すのは「これがこの序盤です」であって
//   「これが最善です」ではない。混ぜると嘘になる。
//
// ★ 書かないと決めたもの ★
//   10手より先の理論／「白が有利」などの評価／出典の曖昧な逸話／
//   ECOコード（名前と番号は範囲の対応で、1対1ではないため）。
//
// ★ 棋譜は機械で確かめてある ★
//   どの line も、最後まで指せること・engine が書く棋譜と
//   1字も違わないことを確かめた（2026-10-31）。
//   1手でも書き換えたら確かめ直すこと。
// ================================================================

window.CHESS_LESSONS = {

  volume: { no: 3, en: 'Openings', ja: 'じょばん' },
  volumes: [
    { no: 1, en: 'Basics',   ja: 'きそ',       url: '/kids/chess/' },
    { no: 2, en: 'Tactics',  ja: 'せんじゅつ', url: '/kids/chess-tactics/' },
    { no: 3, en: 'Openings', ja: 'じょばん',   url: '/kids/chess-openings/' }
  ],

  chapters: [
    { en: 'Three rules', ja: 'じょばんの 3つの きまり' }
  ],

  lessons: [

    // ===== 1章 じょばんの 3つの きまり =================================
    //
    // 中央・駒を出す・キングを安全に。この3つは、04巻でやる
    // 「配置の評価」を合言葉にしたもの。先に決まりごとを覚えて、
    // あとから「なぜそうなのか」を見る、という並びにしてある
    // （1巻でポーンの例外を先に出して、あとで種明かしをしたのと同じ形）。

    {
      chapter: 0,
      en: 'Take the centre',
      ja: '中央を とる',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'The four squares in the middle are where games start.',
          ja: '盤の まん中の 4マス、d4・e4・d5・e5。たいきょくは まず ここの とりあいから 始まる。どちらも ここを おさえたい。' },
        { t: 'p', en: 'A piece in the middle reaches more squares.',
          ja: 'なぜ まん中が いいのか。こまは 中央に いるほど たくさんの マスに 行ける から。ナイトを 中央に 置くと 8マスに 行けるけど、すみに 置くと 2マスしか 行けない。同じ ナイトなのに、はたらきが 4ばい ちがう。' },
        { t: 'p', en: 'And a centre pawn opens roads for the pieces behind it.',
          ja: 'それに、中央の ポーンを 1つ 出すと、うしろに いる ビショップと クイーンの 道が あく。中央を とる 手は、こまを 出す じゅんびにも なって いる。' },
        { t: 'key',
          en: 'Hold the centre and your pieces work harder.',
          ja: '中央を おさえると、おなじ こまが よく はたらく。' }
      ],
      task: { en: 'Press the four centre squares.',
              ja: 'まん中の 4マスを おそう。' },
      goal: { kind: 'squares', ask: ['d4', 'e4', 'd5', 'e5'], ordered: false }
    },

    {
      chapter: 0,
      en: 'Get your pieces out',
      ja: 'こまを 出す',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'At the start, only pawns and knights can move at all.',
          ja: 'はじめの 盤を 見て。うごけるのは ポーンと ナイトだけ。ビショップも ルークも クイーンも、じぶんの ポーンに ふさがれて いる。序盤は この こまたちを 外へ 出す 時間。' },
        { t: 'p', en: 'Knights and bishops first. Rooks and queen later.',
          ja: '出す じゅんばんが ある。ナイトと ビショップが さき、ルークと クイーンは あと。2巻で ならった とおり、ねうちの 高い こまを 早く 出すと、安い こまに ねらわれて にげ回る ことに なる。' },
        { t: 'p', en: 'This is the Italian Game, one of the oldest.',
          ja: '下の きふは「イタリアン」と よばれる 序盤の はじまり。白も 黒も、中央に ポーンを 出し、ナイトを 出し、ビショップを 出す。おなじ ことを 両方が やって いる。' },
        { t: 'key',
          en: 'Pawns open the roads. Knights and bishops come out first.',
          ja: 'ポーンで 道を あけて、ナイトと ビショップを 出す。' }
      ],
      task: { en: 'Play the six moves.',
              ja: 'きふの とおりに 6手 さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] } }
    },

    {
      chapter: 0,
      en: 'Tuck the king away',
      ja: 'キングを 安全に',
      fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      body: [
        { t: 'p', en: 'Third rule: get the king out of the middle.',
          ja: '3つめの きまり。キングを まん中から どかす こと。いま 白の キングは e1 に いる。中央の たてよこの 線は、これから いちばん こまが 行き来する ところ。' },
        { t: 'p', en: 'Castling does two jobs in one move.',
          ja: 'キャスリング（1巻で ならったね）は、1手で 2つ できる。キングを すみへ にがす ことと、ルークを 中央に つれて くる こと。序盤で いちばん とくな 1手。' },
        { t: 'p', en: 'Early is better than clever.',
          ja: '早めに やって おく ほうが いい。あとまわしに して いると、キングの 前に こまが 来て できなく なったり、1巻で ならった 4つの きまりの どれかが かけたり する。' },
        { t: 'key',
          en: 'Castle early. The middle is the dangerous place.',
          ja: '早めに キャスリング。まん中は これから あぶない。' }
      ],
      task: { en: 'Castle, then let Black bring a knight out.',
              ja: 'キャスリングして、黒も ナイトを 出そう。' },
      goal: { kind: 'moves', win: { line: ['O-O', 'Nf6'] } }
    }

  ]
};
