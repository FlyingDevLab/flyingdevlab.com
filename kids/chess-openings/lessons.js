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
    { en: 'Three rules',   ja: 'じょばんの 3つの きまり' },
    { en: 'Three mistakes', ja: 'やっては いけない こと' }
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
    },

    // ===== 2章 やっては いけない こと =================================
    //
    // 1章の3つのきまりの、裏返し。
    // どれも「指してみて、さいごに盤を見比べる」形にしてある。
    // 文章で「損だよ」と言うより、4手さしたあとの盤を見るほうが早い。
    //
    // 本文に書いた数（出た駒の数・クイーンに使った手数）は、
    // 棋譜を最後まで指した盤を数えて確かめてある。
    // 棋譜を変えたら、その数も確かめ直すこと。

    {
      chapter: 1,
      en: 'Moving the same piece again and again',
      ja: 'おなじ こまを 何度も',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'In the opening, every move counts. You only get one at a time.',
          ja: '序盤は こまを 出す 時間。でも 1手ずつ しか 指せない。だから「何手 つかって、どれだけ 出せたか」で 差が つく。' },
        { t: 'p', en: 'Move one piece twice and the other side gets ahead.',
          ja: 'おなじ こまを 2回 3回 うごかすと、その あいだ あいては ちがう こまを 出して いる。手数は 同じなのに、ならんで いる こまの 数が ちがって くる。' },
        { t: 'p', en: 'Watch this knight go out and come back.',
          ja: 'この きふの 白は、ナイトを f3 へ 出して、g1 へ もどして、また f3 へ 出す。3手 つかって、はじめと おなじ ところに いる。' },
        { t: 'p', en: 'Play it, then compare the two sides.',
          ja: 'さいごまで さしたら、盤を 見くらべて。白で 出て いる こまは 1つ。黒は 3つ。おなじ 4手ずつ さしたのに。' },
        { t: 'key',
          en: 'Each extra move on the same piece is a move you did not develop.',
          ja: 'おなじ こまを 何度も うごかすと、その ぶん おくれる。' }
      ],
      task: { en: 'Play the eight moves and compare the two sides.',
              ja: '8手 さして、さいごに 白と 黒を 見くらべよう。' },
      goal: { kind: 'moves', win: { line: [
        'e4', 'e5', 'Nf3', 'Nc6', 'Ng1', 'Nf6', 'Nf3', 'Bc5'
      ] } }
    },

    {
      chapter: 1,
      en: 'Bringing the queen out too early',
      ja: '早すぎる クイーン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'The queen is the strongest, so it is tempting to use her first.',
          ja: 'クイーンは いちばん つよい。だから 早く 出して あばれたく なる。でも 早すぎると、つよさが そのまま 弱みに なる。' },
        { t: 'p', en: 'A strong piece cannot trade itself for a cheap one.',
          ja: '2巻の ねうちの 話を 思い出して。9の クイーンは、3の ナイトや 1の ポーンに とられる わけに いかない。だから ねらわれる たびに、にげる しか ない。にげる 1手は、こまを 出す 1手では ない。' },
        { t: 'p', en: 'Here White spends three of five moves on the queen alone.',
          ja: 'この きふの 白は、5手の うち 3手を クイーンだけに つかう。そのあいだ 黒は ナイトを 2つ 出し、中央に ポーンを 2つ ならべる。中央の ポーンは 白が 1つ、黒が 2つ。' },
        { t: 'p', en: 'You have seen this opening win before.',
          ja: '1巻の「てばんの ばんごう」で 読んだ スカラーズメイトも、クイーンを 早く 出す 形だった。あれは 黒が 気づかなかった ときだけ うまく いく。気づかれると、この きふの ように なる。' },
        { t: 'key',
          en: 'The queen comes out late, after the cheap pieces.',
          ja: 'クイーンは あとから。安い こまが 先。' }
      ],
      task: { en: 'Play the ten moves. Count how many are queen moves.',
              ja: '10手 さしてみよう。白の 手の うち、クイーンが 何手 か 数えて。' },
      goal: { kind: 'moves', win: { line: [
        'e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'g6', 'Qf3', 'Nf6', 'Qg3', 'd5'
      ] } }
    },

    {
      chapter: 1,
      en: 'Pushing the edge pawns',
      ja: 'はしの ポーン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'The a- and h-pawns are the ones on the edge.',
          ja: 'a の れつと h の れつの ポーンを「はしの ポーン」と いう。序盤に これを 動かすのは、たいてい 損に なる。' },
        { t: 'p', en: 'They do neither of the two jobs.',
          ja: '理由は 2つ。1つめ、はしは 中央では ない。中央の とりあいに 入れない。2つめ、動かしても うしろの こまの 道が あかない。ビショップも クイーンも、はしの ポーンの うしろには いない。' },
        { t: 'p', en: 'Four moves, nothing out.',
          ja: 'この きふの 白は、4手 つかって こまが 1つも 出て いない。ぜんぶ もとの ところ。黒は 中央に ポーンを 2つ ならべて、こまを 2つ 出して いる。' },
        { t: 'key',
          en: 'Edge pawns give you neither the centre nor an open road.',
          ja: 'はしの ポーンは、中央も 道も くれない。' }
      ],
      task: { en: 'Play the eight moves and look at how little White has.',
              ja: '8手 さして、白に 何が のこったか 見てみよう。' },
      goal: { kind: 'moves', win: { line: [
        'a4', 'e5', 'h4', 'd5', 'a5', 'Nf6', 'h5', 'Bc5'
      ] } }
    }

  ]
};
