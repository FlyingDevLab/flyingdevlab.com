// ================================================================
// lessons.js – チェス あそぶ、レッスン表
// ================================================================
//
// レッスンではなく、実際に指して遊ぶ場所。巻（01〜03）とは関係なく、
// 巻えらびの右の「あそぶ」タブから開く。
//
//   1. ふたりで さす        白黒とも自分たちで指す
//   2. コンピュータと さす     黒を /kids/shared/chess-cpu.js が指す
//   3. ならべて あそぶ        好きな駒を並べてから、ふたりか、コンピュータと指す
//
// 盤を描くのは /kids/shared/chess-lessons.js、
// ルールの判定は /kids/shared/chess.js。ここには仕組みを書かない。
//
// ★ 巻ではない ★
//   終わりの知らせ（できた！）は出ない。goal.kind が 'free' と 'sandbox' で、
//   どちらも決着（チェックメイト・ステイルメイト・ひきわけ）は一言で伝えるだけ。
//   volume.no が数ではなく 'play' なのは、巻の「つぎの巻」の計算
//   （no + 1）に入らないため。
//
// ★ 強さを選ぶ画面は無い ★
//   コンピュータは先を読まない。決まりごとは chess-cpu.js の冒頭に書いた。
// ================================================================

window.CHESS_LESSONS = {

  // unitEn … ここで選ぶのはレッスンではなく指し方なので「Mode」と数える。
  //          見出しと読み上げが「Lesson 1 / 3」ではなく「Mode 1 / 3」になる。
  //          巻のページは書かないので Lesson のまま
  volume: { no: 'play', en: 'Play', ja: 'あそぶ', unitEn: 'Mode' },
  volumes: [
    { no: 1, en: 'Basics',   ja: 'きそ',       url: '/kids/chess/' },
    { no: 2, en: 'Tactics',  ja: 'せんじゅつ', url: '/kids/chess-tactics/' },
    { no: 3, en: 'Openings', ja: 'じょばん',   url: '/kids/chess-openings/' },
    { no: 'play', en: 'Play', ja: 'あそぶ', url: '/kids/chess-play/', tab: true }
  ],

  // named … 目次に番号ではなく名前を並べる。
  //         ここは3つとも指し方の名前そのもので、番号にすると
  //         「コンピュータと さすのは何番か」を選ぶ前に当てられない。
  //         巻の目次とちがって、ここは最初に選ぶ入口である
  chapters: [
    { en: 'Play', ja: 'あそぶ', named: true }
  ],

  lessons: [

    {
      chapter: 0,
      en: 'Two players',
      ja: 'ふたりで さす',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Two players, one screen. White and Black both move here, turn by turn.',
          ja: '1つの がめんで ふたりで さす。白と 黒を こうたいで うごかす。' },
        { t: 'p', en: 'All the rules are on: promotion, en passant, castling, checkmate, stalemate and draws.',
          ja: '1巻で ならった きまりは ぜんぶ きいて いる。プロモーション・アンパッサン・キャスリング・チェックメイト・ステイルメイト・ひきわけ、ぜんぶ。' },
        { t: 'p', en: 'Illegal moves simply will not go. Touch a piece to see where it can go.',
          ja: 'ルールに ない 手は させない ように なって いる。「これは さして いいのかな」と 思ったら、ためしに さわってみれば わかる。行ける マスに しるしが 出る。' },
        { t: 'p', en: 'Your moves pile up as notation below. You can copy it.',
          ja: 'さした 手は 下に きふに なって つみあがる。コピーも できる。おもしろい たいきょくに なったら、自分の ところに 書きうつして おこう。この ページを とじると きえて しまう から。' },
        { t: 'key',
          en: 'White moves first. One move each, turn by turn.',
          ja: '白が さきに さす。こうたいに 1手ずつ。' }
      ],
      task: { en: 'White moves first.',
              ja: '白から どうぞ。' },
      goal: { kind: 'free' }
    },

    {
      chapter: 0,
      en: 'Play the computer',
      ja: 'コンピュータと さす',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'You play White and the computer plays Black. All the rules are on.',
          ja: '白が きみで、黒は コンピュータが さす。1巻で ならった きまりは ぜんぶ きいて いる。' },
        { t: 'p', en: 'Black looks ahead a little. It takes a piece nobody protects, and it takes back when it can.',
          ja: '黒は 少し さきを 読んで さして くる。まもられて いない こまは とりに くるし、とられた ときは とりかえせるなら とりかえす。' },
        { t: 'p', en: 'Checkmate wins. If Black has no move and is not in check, it is a stalemate — a draw.',
          ja: '黒を 詰ませたら きみの かち。黒が 動けなく なっても チェックされて いなければ ステイルメイトで ひきわけ。' },
        { t: 'key',
          en: 'A piece nobody protects can be taken.',
          ja: 'まもられて いない こまは とられる。' }
      ],
      task: { en: 'White moves first.',
              ja: '白から どうぞ。' },
      goal: { kind: 'free', cpu: true }
    },

    {
      chapter: 0,
      en: 'Set up and play',
      ja: 'ならべて あそぶ',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      body: [
        { t: 'p', en: 'Put any pieces you like on the board, white and black. Then play from there.',
          ja: '好きな こまを、白も 黒も、好きな ところに ならべる。ならべ終えたら、そこから さす。' },
        { t: 'p', en: 'Pick a piece from the shelf, then tap a square. Tap a piece on the board to take it off.',
          ja: '下の たなから こまを えらんで、マスを おす。ばんの うえの こまを おすと、とりのぞける。' },
        { t: 'p', en: 'There is one king each. You need both kings. Pawns cannot stand on the first or last row.',
          ja: 'キングは 白と 黒に 1つずつ。ふたりとも ひつよう。ポーンは いちばん 下と いちばん 上の だんには おけない。' },
        { t: 'p', en: 'White moves first. Black cannot already be in check. If a king and a rook stand on their starting squares, that side can castle.',
          ja: '白から さす。はじめから 黒が チェックされている ならべ方は できない。キングと ルークが はじめの ばしょに いれば、キャスリングも できる。' },
        { t: 'key',
          en: 'Then choose: play with a friend, or play the computer.',
          ja: 'ならべたら、ともだちと さすか、コンピュータと さすか えらぶ。' }
      ],
      task: { en: 'Set up the pieces, then press Play.',
              ja: 'こまを ならべて、「あそぶ」を おそう。' },
      goal: { kind: 'sandbox' }
    }

  ]
};
