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
    { en: 'Three mistakes', ja: 'やっては いけない こと' },
    { en: 'Openings with names', ja: '名前の ある じょばん' },
    { en: 'A real game',         ja: '実戦の きふ' }
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
    },

    // ===== 3章 名前の ある じょばん ===================================
    //
    // 名前の付いた序盤を7つ。どれも最初の数手だけで、そこで止めてある。
    // 10手より先は解析と流行で変わるので書かない（この巻の決めごと）。
    //
    // 名前の由来は、記録のはっきりしているものだけ書いた。
    // ルイロペス（1561年の本）・フレンチ（1834年のロンドン対パリ）・
    // カロカン（1886年のカロとカン）はそれで、ほかは
    // 「古くからある」までにしてある。逸話は出典が曖昧なものが多い。
    //
    // どれが良いかは書かない。「これがこの序盤です」までにする。

    {
      chapter: 2,
      en: 'The Italian Game',
      ja: 'イタリアン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'White points a bishop straight at f7.',
          ja: 'ビショップを c4 に 出す かたち。この ビショップは、黒の キングの 前の f7 を まっすぐ 見て いる。f7 は、はじめ キングしか まもって いない マス。1巻の スカラーズメイトでも ねらわれて いた ところ。' },
        { t: 'p', en: 'Both sides just follow the three rules.',
          ja: '1章で ならった 3つの きまりを、白も 黒も そのまま やって いる だけの かたち。中央に ポーンを 出し、ナイトを 出し、ビショップを 出す。だから いちばん 分かりやすい。イタリアの 人たちが 書き のこした ので この 名前。' },
        { t: 'key',
          en: 'The oldest and plainest way to follow the rules.',
          ja: 'きまりを そのまま やると、この かたちに なる。' }
      ],
      task: { en: 'Play the Italian Game.',
              ja: 'イタリアンを さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6'] } }
    },
    {
      chapter: 2,
      en: 'The Ruy Lopez',
      ja: 'ルイロペス',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'The bishop goes to b5 instead, aiming at the knight.',
          ja: 'ビショップを c4 では なく b5 に 出す かたち。ねらって いるのは f7 では なく、c6 の ナイト。その ナイトは、黒の 中央の ポーン e5 を まもって いる こま。' },
        { t: 'p', en: 'Attack the guard, not the thing it guards.',
          ja: '2巻の「まもって いる こまを どかせる」話に にて いる。まもり手を ねらうと、まもられて いる ほうが ぐらつく。すぐに 取れる わけでは ないけれど、ずっと 気に なる。' },
        { t: 'p', en: 'Named after a Spanish priest who wrote about it in 1561.',
          ja: 'スペインの ルイ・ロペスと いう ひとが 1561年の 本に 書いた ので、その 名前が ついて いる。スパニッシュとも よばれる。' },
        { t: 'key',
          en: 'Aim at the piece that is doing the guarding.',
          ja: 'まもって いる こまの ほうを ねらう。' }
      ],
      task: { en: 'Play the Ruy Lopez.',
              ja: 'ルイロペスを さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'] } }
    },
    {
      chapter: 2,
      en: 'The Sicilian Defence',
      ja: 'シシリアン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Black answers 1.e4 with the c-pawn, not the e-pawn.',
          ja: '白の e4 に、黒が e5 では なく c5 と こたえる かたち。おなじ 中央の とりあいでも、左右が そろわない。' },
        { t: 'p', en: 'The two sides end up wanting different things.',
          ja: '白と 黒が 鏡の ように 同じ ことを する かたちでは なく なるので、おたがい 行く 先が ちがって くる。よく 指される こたえ方。' },
        { t: 'p', en: 'Watch the 4th move: a capture with a knight.',
          ja: 'この きふでは 4手めに ナイトで とり返して いる。cxd4 と Nxd4。1巻の「とる ときは x」が ここで 出て くる。' },
        { t: 'key',
          en: 'Meeting e4 with c5 makes the game lopsided on purpose.',
          ja: 'わざと 左右を そろえない こたえ方。' }
      ],
      task: { en: 'Play the Sicilian Defence.',
              ja: 'シシリアンを さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'] } }
    },
    {
      chapter: 2,
      en: 'The French Defence',
      ja: 'フレンチ',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Black plays e6 first, planning d5 next.',
          ja: '黒が まず e6 と 小さく 出て、つぎに d5 と 中央に ならべる かたち。e5 で ぶつけるのでは なく、1つ ずらして かまえる。' },
        { t: 'p', en: 'One piece pays for it: the c8 bishop.',
          ja: 'ただし、こまった ことが 1つ。e6 の ポーンが、c8 の ビショップの 道を ふさいで しまう。この きふを さしきった あと、c8 の ビショップを さわって みて。行ける マスは d7 の 1つだけ。しかも その 先も じぶんの ポーンに ふさがれて いる。' },
        { t: 'p', en: 'Named after a match between London and Paris in 1834.',
          ja: '1834年の ロンドン 対 パリの 対局で 使われた ので、フランスの 名前が ついて いる。' },
        { t: 'key',
          en: 'The e6 pawn shuts its own bishop in.',
          ja: 'e6 の ポーンは、じぶんの ビショップの 道を ふさぐ。' }
      ],
      task: { en: 'Play the French, then try to move the c8 bishop.',
              ja: 'フレンチを さしてみよう。さいごに c8 の ビショップを さわって みて。' },
      goal: { kind: 'moves', win: { line: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] } }
    },
    {
      chapter: 2,
      en: 'The Caro-Kann',
      ja: 'カロカン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Also preparing d5 — but with the c-pawn.',
          ja: 'フレンチと 同じで、つぎに d5 と ならべる じゅんび。ちがうのは、e6 では なく c6 と 出す こと。' },
        { t: 'p', en: 'This way the bishop gets out first.',
          ja: 'たった 1マス ちがう だけで、c8 の ビショップの 道が ふさがらない。この きふの さいごの 手が それ。Bf5 で ビショップが そとに 出て いる。フレンチの ビショップと 見くらべて みて。' },
        { t: 'p', en: 'Named after two players who wrote about it in 1886.',
          ja: '1886年に カロと カンと いう ふたりが しらべた ので、ふたりの 名前を ならべて こう よばれる。' },
        { t: 'key',
          en: 'c6 instead of e6 keeps the bishop\u2019s road open.',
          ja: 'e6 では なく c6。それだけで ビショップが 出られる。' }
      ],
      task: { en: 'Play the Caro-Kann and see where the bishop lands.',
              ja: 'カロカンを さしてみよう。ビショップが どこに 出るか 見てね。' },
      goal: { kind: 'moves', win: { line: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] } }
    },
    {
      chapter: 2,
      en: 'The Queen\u2019s Gambit',
      ja: 'クイーンズギャンビット',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'This time White starts with the d-pawn.',
          ja: 'ここまでは ぜんぶ e4 から 始まって いた。こんどは d4 から。白が クイーンの 側の ポーンを 先に 出す かたち。' },
        { t: 'p', en: 'A gambit means offering a pawn.',
          ja: '2手めの c4 が この 序盤の 顔。黒の d5 の ポーンに ポーンを ぶつけて いる。「ギャンビット」とは ポーンを さし出す こと。黒は とっても いいし、とらなくても いい。この きふの 黒は とらずに e6 と ならべて いる。' },
        { t: 'p', en: 'One of the oldest openings on record.',
          ja: 'とても 古くから ある かたちで、いまも よく 指される。' },
        { t: 'key',
          en: 'A gambit is an offer. You can always decline it.',
          ja: 'ギャンビットは「どうぞ」。とるか とらないかは あいてが きめる。' }
      ],
      task: { en: 'Play the Queen\u2019s Gambit.',
              ja: 'クイーンズギャンビットを さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'] } }
    },
    {
      chapter: 2,
      en: 'The London System',
      ja: 'ロンドン',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'The bishop comes out before the pawn wall goes up.',
          ja: 'd4 の つぎに、すぐ ビショップを f4 へ 出す かたち。あとから e3 と ポーンを 出す。' },
        { t: 'p', en: 'Order matters: bishop first, then the pawn.',
          ja: 'じゅんばんが 大事。先に e3 と して しまうと、フレンチの ビショップと 同じ ことに なる。じぶんの ポーンの うしろに とじこめられる。だから ビショップを 先に 外へ 出して おく。' },
        { t: 'p', en: 'It is a shape, not a reply to one move.',
          ja: 'この かたちは、黒が どう こたえても だいたい 同じ ように 組める。おぼえる ことが 少ないので、はじめの うちは 組みやすい。' },
        { t: 'key',
          en: 'Let the bishop out before you build the pawn wall.',
          ja: 'ポーンの かべを 作る 前に、ビショップを 外へ。' }
      ],
      task: { en: 'Play the London System.',
              ja: 'ロンドンを さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6'] } }
    },

    // ===== 4章 実戦の きふ ============================================
    //
    // オペラ座の対局（1858年・パリ）。17手で終わる。
    // 1巻の棋譜の読み方、2巻の捨て駒と詰み、3巻の序盤の3つのきまりが
    // 1局の中に全部入っているので、この巻のおしまいに置いた。
    //
    // 本文に書いた数は、盤を数えて確かめてある。
    //   14手めが終わった時点で、まだ元の位置にいる駒は 白0・黒2
    //   （f8 のビショップと h8 のルーク）
    //   詰んだ時点の残り駒は 白15・黒25。黒のほうが10多いまま詰む
    //   Qb8+ に対する黒の合法手は 1つだけ
    //
    // 対局の素性は、記録のはっきりしているところまでにした。
    // 「どの演目の最中だったか」は書いていない。よく語られるが、
    // 本によって演目が違う。

    {
      chapter: 3,
      en: 'The Opera Game',
      ja: 'オペラ座の 対局',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Paris, 1858. White is Paul Morphy; two players shared the black pieces.',
          ja: '1858年、パリの オペラ座で 指された 対局。白は ポール・モーフィー。黒は ふたりの 人が 相談しながら 指した。オペラ座で 指されたので「オペラ座の 対局」と よばれて いる。' },
        { t: 'p', en: 'Watch the two sides follow — and not follow — the three rules.',
          ja: '17手で おわる 短い たいきょく。3章の 3つの きまりを、白は そのまま やり、黒は やらない。ボタンで 1手ずつ 送りながら、そこを 見て みて。' },
        { t: 'p', en: 'White gets everything out and castles on move 12.',
          ja: '白は こまを つぎつぎ 出して、12手めで キャスリング。14手めが おわった ところで、白は まだ もとの ところに いる こまが 0。黒は 2つ（f8 の ビショップと h8 の ルーク）。黒の キングも e8 に いた まま。' },
        { t: 'p', en: 'And here is the strange part.',
          ja: 'おもしろいのは ここ。詰んだ ときに のこって いる こまの ねうちを 数えると、白は 15、黒は 25。黒の ほうが 10も 多い。白は さいごに ビショップと クイーンを すてて いる から。それでも 詰まされるのは 黒の ほう。2巻で ならった とおり、詰むなら こまの 数は かんけいない。' },
        { t: 'key',
          en: 'Having more pieces does not help if you are the one getting mated.',
          ja: 'こまが 多くても、詰まされたら おわり。' }
      ],
      task: { en: 'Step through the game one move at a time.',
              ja: 'ボタンで 1手ずつ 送りながら 読もう。ぜんぶで 33手。' },
      goal: { kind: 'replay', line: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#' }
    },

    {
      chapter: 3,
      en: 'Finish it yourself',
      ja: 'さいごを 自分で',
      fen: '4kb1r/p2r1ppp/4qn2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 2 15',
      body: [
        { t: 'p', en: 'This is the position before the last five moves.',
          ja: 'さっきの 対局の、さいごの 5手の 直前。こんどは じぶんで さしてみよう。ならった ものが 3つ つながって いる。' },
        { t: 'p', en: 'First, remove the guard.',
          ja: '1つめ Bxd7+。d7 の ナイトを とる。この ナイトは 黒の まもりに なって いた。2巻の「そらす」で ならった、仕事を して いる こまを どかす 手。' },
        { t: 'p', en: 'Then give up the queen.',
          ja: '2つめ Qb8+。いちばん つよい クイーンを すてる。黒には これを とる 手しか のこって いない。ほんとうに 1つだけ。2巻の「おびき出す」の かたち。' },
        { t: 'p', en: 'And mate on the back rank.',
          ja: '3つめ Rd8# で 詰み。ルークが いちばん 下の だんに 入る。2巻の バックランクメイト。黒の キングは キャスリングを しないまま、まん中に のこって いた。' },
        { t: 'key',
          en: 'Three things you learned, one after another.',
          ja: 'そらす → すてる → 詰ます。3つが つながる。' }
      ],
      task: { en: 'Play the last five moves.',
              ja: 'さいごの 5手を さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'] } }
    }

  ]
};
