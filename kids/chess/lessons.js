// ================================================================
// lessons.js – チェス 第01巻 基礎知識、レッスン表
// ================================================================
//
// 23のレッスンの「文章」と「盤」と「できたの条件」だけを持つ。
// 盤を描いたり押されたのを受けたりするのは /kids/shared/chess-lessons.js、
// ルールの判定は /kids/shared/chess.js。ここには仕組みを書かない。
//
// ★ 章とレッスンの出どころはここだけ ★
//   目次（index.html の .toc）は空で、chess-lessons.js がこの表から作る。
//   HTML にレッスン名を書くと、名前と番号を2か所に持つことになり、
//   片方だけ直した日に目次と中身が食い違う。
//
// ★ 文章の書き方 ★
//   body は上から順に並ぶ。t で種類を決める。
//
//     { t:'p',     en:'…', ja:'…' }        段落。英語は短い1行、日本語が本体
//     { t:'pairs', items:[{en,ja,sym}] }   用語の組。英語・日本語・棋譜の記号
//     { t:'key',   en:'…', ja:'…' }        覚えておく一言。囲んで出す
//
//   どの種類も en と ja の両方を必ず書く。英語だけ・日本語だけの行は作らない。
//   段落（p）の英語を1行に抑えているのは、日本語の説明をそのまま英訳して
//   並べると文章が2倍の高さになり、狭い画面で盤が下へ押し出されるため。
//   短くても、英語の行が1本も無い場所は作らないこと。
//   pairs は英語と日本語を必ず横に並べる。棋譜の N が Knight の N
//   であることは、2つを隣に置かないと伝わらない。
//
//   日本語はひらがなを多めにし、漢字そのものを抑えている。ルビは振らない。
//
// ★ 盤と課題 ★
//   fen    その盤。省略すると前のレッスンと関係なく空の盤になる
//   still  true なら相手は動かない。手番が自分のまま続く
//          （駒の動きを覚える章で使う。相手が動くと的が逃げる）
//   only   その種類の駒だけ動かせる。'N' など
//   goals  点線の輪を出すマス。課題の的
//   goal   できたの条件。kind で種類を決める
//
//     { kind:'squares', ask:['a1','h1'], ordered:false }
//        言われたマスを押す。ordered が true なら順番どおりに
//     { kind:'moves', win:{…} }
//        盤で手を指す。win の中身で「できた」が決まる
//          capture:['c6','e3']   そのマスの駒を全部とる
//          reach:['d6']          どれかの駒をそのマスへ置く
//          line:['e4','e5']      書いてある棋譜の手を順番に指す
//          flag:'promo'          その種類の手を1回指す
//                                （promo / ep / castleK / castleQ）
//          status:'checkmate'    局面をその決着にする（checkmate / stalemate）
//          escape:true           チェックから逃げる。3つのどの方法でもよい
//     { kind:'setup', want:'<FEN>', palette:['R','N','B','Q','K'] }
//        空いているところに駒を並べる
//     { kind:'replay', line:'1. e4 e5 …' }
//        棋譜を1手ずつ送って見る。自分では指さない
//     { kind:'chase', moves:12, sets:[{en,ja,fen}, …] }
//        白を自分で動かし、黒は自動で逃げる。詰ませられないことを体で確かめる回。
//        moves の手数で「できた」になるが、そこで止めない。
//        納得するまで動かし続けられる（止めると、確かめている途中で
//        盤が固まることになり、この回の目的と反対になる）。
//        sets は駒のくみあわせ。どれも詰みの形が存在しないことを
//        総当たりで確かめてある（chess.js の insufficientMaterial の注記）。
//     { kind:'free' }
//        コンピュータと さす。ルールは全部きいている
//
// ★ 盤と棋譜は機械で確かめてある ★
//   23レッスンすべてについて、次を確認した（2026-10-30）。
//     ・fen が読めて、駒の数と手番が意図どおりであること
//     ・課題が達成できること（とる手・行く手・棋譜の手が実際に合法手である）
//     ・最後のレッスンの棋譜が、本当にチェックメイトで終わること
//   確かめたスクリプトはリポジトリに入れていない。
//   公開するのは遊ぶファイルだけにしたいため、手元で走らせている。
//   盤や棋譜を1つでも書き換えたら、必ず確かめ直すこと。
// ================================================================

window.CHESS_LESSONS = {

  // ----------------------------------------------------------------
  // この巻と、ほかの巻
  // ----------------------------------------------------------------
  // 巻のボタンはこの表から作る。巻を足したら、全部の巻の
  // lessons.js の volumes を揃えること（ここだけは写しになる）。
  volume: { no: 1, en: 'Basics', ja: 'きそ' },
  volumes: [
    { no: 1, en: 'Basics',  ja: 'きそ',       url: '/kids/chess/' },
    { no: 2, en: 'Tactics', ja: 'せんじゅつ', url: '/kids/chess-tactics/' },
    { no: 3, en: 'Openings', ja: 'じょばん', url: '/kids/chess-openings/' },
    { no: 'play', en: 'Play', ja: 'あそぶ', url: '/kids/chess-play/', tab: true }
  ],

  // ----------------------------------------------------------------
  // 章
  // ----------------------------------------------------------------
  chapters: [
    { en: 'The board',      ja: 'ばんと マスの なまえ' },
    { en: 'The pieces',     ja: 'こまの うごき' },
    { en: 'Notation',       ja: 'きふの きほん' },
    { en: 'Special rules',  ja: 'とくべつな きまり' },
    { en: 'Starting line',  ja: 'はじめの ならび' },
    { en: 'How games end',  ja: 'しょうぶの つきかた' },
    { en: 'Read a game',    ja: 'きふを よむ' },
    { en: 'Free play',      ja: 'おまけ' }
  ],

  // ----------------------------------------------------------------
  // レッスン
  // ----------------------------------------------------------------
  lessons: [

    // ===== 1章 ばんと マスの なまえ =====================================

    {
      chapter: 0,
      en: 'Eight by eight',
      ja: '8かける8の ばん',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      body: [
        { t: 'p', en: 'The board is 8 squares by 8 squares: 64 in all.',
          ja: 'チェスの ばんは たて8・よこ8の 64マス。白マスと 黒マスが こうたいに ならんで いる。' },
        { t: 'p', en: 'Columns are files (a-h). Rows are ranks (1-8).',
          ja: 'たての れつ 8本には、左から じゅんに a b c d e f g h の 字が ついて いる。よこの れつ 8本には、下から じゅんに 1 2 3 4 5 6 7 8 の すうじが ついて いる。ばんの まわりに 書いて あるのが それ。' },
        { t: 'pairs', items: [
          { en: 'file', ja: 'たての れつ', sym: 'a〜h' },
          { en: 'rank', ja: 'よこの れつ', sym: '1〜8' }
        ] },
        { t: 'key',
          en: 'Rank 1 is White\'s side. The numbers grow as you go away from it.',
          ja: '白が すわる がわが 1だんめ。おくへ いくほど すうじが 大きく なる。' }
      ],
      task: { en: 'Press the four corners of the board.',
              ja: 'ばんの 4つの かど を おしてみよう。' },
      goal: { kind: 'squares', ask: ['a1', 'h1', 'a8', 'h8'], ordered: false }
    },

    {
      chapter: 0,
      en: 'The name of a square',
      ja: 'マスの なまえ',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      body: [
        { t: 'p', en: 'Each square is named by its file letter, then its rank number.',
          ja: 'たての 字と よこの すうじを つなげると、64マス ぜんぶに なまえが つく。e4 なら「e の れつ」の「4だんめ」。' },
        { t: 'p', en: 'Letter first, number second. Always.',
          ja: 'じゅんばんは いつも おなじ。さきに 字、あとに すうじ。4e とは 書かない。' },
        { t: 'key',
          en: 'Learn these names and you can read notation. Notation is made of them.',
          ja: 'この なまえが わかると、きふが よめる ように なる。きふは マスの なまえで 書いて あるから。' }
      ],
      task: { en: 'Press each square as it is named.',
              ja: 'いわれた マスを 1つずつ おしてみよう。' },
      goal: { kind: 'squares', ask: ['e4', 'a7', 'c2', 'f6', 'h5', 'd8'], ordered: true }
    },

    {
      chapter: 0,
      en: 'Light squares and dark squares',
      ja: '白マスと 黒マス',
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      body: [
        { t: 'p', en: 'The bottom-left square a1 is dark. The bottom-right square h1 is light.',
          ja: '左下の a1 は 黒マス。右下の h1 は 白マス。ばんを おくときは、いつも じぶんの 右下が 白マスに なる ように おく。' },
        { t: 'p', en: 'This matters most for the bishop, which never changes colour.',
          ja: 'マスの いろが いちばん きいて くるのは ビショップ。ビショップは ななめにしか うごけない ので、はじめに いた マスの いろから 一生 出られない。くわしくは レッスン6で。' },
        { t: 'key',
          en: 'a1 is dark. The square at your bottom right is light.',
          ja: 'a1 は 黒。じぶんの 右下は 白。' }
      ],
      task: { en: 'Press every light square on the first rank.',
              ja: '1だんめ（いちばん 下の れつ）の 白マスを ぜんぶ おしてみよう。4つ あるよ。' },
      goal: { kind: 'squares', ask: ['b1', 'd1', 'f1', 'h1'], ordered: false }
    },

    // ===== 2章 こまの うごき ===========================================
    //
    // 並びは ポーン → ナイト → ビショップ → ルーク → クイーン → キング。
    // 弱い駒から順に出している。理由は3つあり、どれも外せない。
    //
    //   1. クイーンは「ルーク＋ビショップ」の一言で済ませたい。
    //      そのためには2つが先に来ている必要がある。
    //   2. キングは最後でなければならない。あの回で教えるのは
    //      「ねらわれたマスには入れない」で、盤では黒のナイトと
    //      ポーンが働いている。まだ習っていない駒で説明すると、
    //      なぜ入れないのかを自分で確かめられない。
    //   3. 数の多いポーンが最初なら、実際に指すときの1手目と順番が合う。
    //
    // いちばん単純なルール（ルークの「たて・よこ」）から始める並びも
    // 考えたが、それだとキングが前に出てしまい 2 が崩れる。
    // ポーンはルールがいちばん複雑な駒なので最初に置くのは重いが、
    // プロモーションとアンパッサンは4章に分けてあり、
    // ここで教えるのは「前へ1、はじめだけ2、とるのはななめ」の3つだけにしてある。
    // 「とる」そのものの説明も、最初の駒になったポーンの回に置いた。

    {
      chapter: 1,
      en: 'Pawn',
      ja: 'ポーン',
      fen: '8/8/8/2ppp3/3P1P2/8/P7/8 w - - 0 1',
      still: true,
      goals: ['c5', 'e5'],
      body: [
        { t: 'p', en: 'A pawn moves one square forward. Never backward, never sideways.',
          ja: 'ポーンは 前へ 1マスだけ。うしろへは もどれない。よこへも 行けない。ぜんぶの こまの 中で、ポーンだけが 一方通行。' },
        { t: 'p', en: 'From its starting square, a pawn may go two squares at once.',
          ja: 'ただし はじめの いちに いる ときだけ、1マスでも 2マスでも えらべる。この ばんの a2 の ポーンで ためしてみて。2マス 行けるのは 1回きり。' },
        { t: 'p', en: 'Taking means moving onto an enemy piece and removing it.',
          ja: 'ここで「とる」を おぼえよう。あいての こまが いる マスに 自分の こまを すすめると、その こまは ばんから いなくなる。かわりに 自分の こまが そこに 立つ。チェスでは これが「とる」。みかたの こまが いる マスには 入れない。' },
        { t: 'p', en: 'A pawn captures diagonally, not forward.',
          ja: 'そして ポーンは、うごく むきと とる むきが ちがう。すすむのは まっすぐ 前だけど、とるのは ななめ 前。だから まっすぐ 前に いる こまは とれない。すすめなく なる だけ。じつは この「むきが ちがう」のは ポーンだけで、ほかの こまは ぜんぶ、うごける ところが そのまま とれる ところ。' },
        { t: 'pairs', items: [
          { en: 'Pawn', ja: 'ポーン', sym: 'なし' }
        ] },
        { t: 'key',
          en: 'Forward to move, diagonal to take. Only the pawn works this way.',
          ja: 'すすむのは まっすぐ、とるのは ななめ。ポーンだけ ちがう。' }
      ],
      task: { en: 'Take the two marked pawns. The pawn straight ahead cannot be taken.',
              ja: 'しるしの ついた ポーン 2つを とろう。d5 の ポーンは まっすぐ 前に いるので、どうしても とれない。' },
      goal: { kind: 'moves', win: { capture: ['c5', 'e5'] } }
    },

    {
      chapter: 1,
      en: 'Knight',
      ja: 'ナイト',
      fen: '8/8/2p5/1pPPP3/2PNP3/2PPPp2/8/8 w - - 0 1',
      still: true,
      only: 'N',
      goals: ['c6', 'b5', 'f3'],
      body: [
        { t: 'p', en: 'The knight moves in an L: two squares, then one to the side.',
          ja: 'ナイトは L の かたちに うごく。まっすぐ 2マス 行って、そこから よこへ 1マス。いつも おなじ かたち、いつも おなじ きょり。' },
        { t: 'p', en: 'The knight is the only piece that jumps over others.',
          ja: 'そして ナイトだけが、とちゅうの こまを とびこえられる。まわりを ぜんぶ かこまれて いても、ナイトは 外へ 出られる。とびこえた こまは とらない。' },
        { t: 'p', en: 'A knight always lands on the opposite colour.',
          ja: 'おもしろい ことに、ナイトは うごく たびに マスの いろが かわる。白マスから とんだら つぎは 黒マス、そのつぎは また 白マス。つぎの レッスンの ビショップは ちょうど 反対で、ずっと おなじ いろの マスから 出られない。' },
        { t: 'pairs', items: [
          { en: 'Knight', ja: 'ナイト', sym: 'N' }
        ] },
        { t: 'key',
          en: 'The knight moves in an L, and is the only piece that jumps.',
          ja: 'ナイトは L じがた。ただ1つ とびこえられる こま。' }
      ],
      task: { en: 'Jump out and take all three marked pawns.',
              ja: 'ナイトは みかたの ポーンに ぐるりと かこまれて いる。とびこえて 外に 出て、しるしの ポーン 3つを とろう。とちゅうで もとの マスに もどっても いいよ。' },
      goal: { kind: 'moves', win: { capture: ['c6', 'b5', 'f3'] } }
    },

    {
      chapter: 1,
      en: 'Bishop',
      ja: 'ビショップ',
      fen: '8/8/7p/8/4p3/p3p3/8/2B5 w - - 0 1',
      still: true,
      goals: ['a3', 'e3', 'h6'],
      body: [
        { t: 'p', en: 'The bishop moves only on diagonals.',
          ja: 'ビショップは ななめに まっすぐ、何マスでも うごける。たてや よこには うごけない。とびこえる ことも できない。' },
        { t: 'p', en: 'A bishop can never leave its own colour of square.',
          ja: 'ななめに うごくと、マスの いろは ずっと かわらない。黒マスから はじまった ビショップは、どこまで いっても 黒マス。白マスには 一生 たどりつけない。まえの レッスンの ナイトは うごく たびに いろが かわった。ちょうど 反対。' },
        { t: 'p', en: 'That is why each side has two: one for each colour.',
          ja: 'だから ビショップは どちらの がわにも 2まい ある。1まいは 白マスの ビショップ、もう1まいは 黒マスの ビショップ。2まい そろって はじめて、ばんの ぜんぶの マスに とどく ように なる。' },
        { t: 'pairs', items: [
          { en: 'Bishop', ja: 'ビショップ', sym: 'B' }
        ] },
        { t: 'key',
          en: 'A light-square bishop and a dark-square bishop. The pair makes one set.',
          ja: '白マスの ビショップと 黒マスの ビショップ。2まいで 1くみ。' }
      ],
      task: { en: 'Take the three marked pawns. One pawn cannot be taken at all.',
              ja: 'しるしの ついた ポーン 3つを とろう。しるしの ない ポーンが 1つ あるけど、それは どうしても とれない。なぜか かんがえてみて。' },
      goal: { kind: 'moves', win: { capture: ['a3', 'e3', 'h6'] } }
    },

    {
      chapter: 1,
      en: 'Rook',
      ja: 'ルーク',
      fen: '8/3p4/8/8/p2R2p1/8/8/8 w - - 0 1',
      still: true,
      goals: ['d7', 'a4', 'g4'],
      body: [
        { t: 'p', en: 'The rook moves in straight lines: up, down, left, right.',
          ja: 'ルークは たてと よこに まっすぐ、何マスでも うごける。ななめには うごけない。' },
        { t: 'p', en: 'It cannot jump over anything.',
          ja: 'とちゅうに こまが あると、そこで 止まる。とびこえる ことは できない。あいての こまが あれば、その マスで とって 止まる。' },
        { t: 'pairs', items: [
          { en: 'Rook', ja: 'ルーク', sym: 'R' }
        ] },
        { t: 'key',
          en: 'Rook: straight lines only, and no jumping.',
          ja: 'ルークは たて・よこ。とびこえ なし。' }
      ],
      task: { en: 'Take all three marked pawns with the rook.',
              ja: 'ルークで、しるしの ついた ポーン 3つを ぜんぶ とろう。あいては うごかないよ。' },
      goal: { kind: 'moves', win: { capture: ['d7', 'a4', 'g4'] } }
    },

    {
      chapter: 1,
      en: 'Queen',
      ja: 'クイーン',
      fen: '8/3p2p1/8/8/p2Q4/8/8/p7 w - - 0 1',
      still: true,
      goals: ['d7', 'g7', 'a4', 'a1'],
      body: [
        { t: 'p', en: 'The queen moves like a rook and a bishop together.',
          ja: 'クイーンは たて・よこ・ななめの ぜんぶに、まっすぐ 何マスでも うごける。ルークの うごきと ビショップの うごきを あわせた もの。' },
        { t: 'p', en: 'She still cannot jump over pieces.',
          ja: 'いちばん とおくまで とどく こまだけど、とびこえる ことは できない。とちゅうに こまが あれば そこで 止まる。' },
        { t: 'pairs', items: [
          { en: 'Queen', ja: 'クイーン', sym: 'Q' }
        ] },
        { t: 'key',
          en: 'Queen = rook + bishop.',
          ja: 'クイーン ＝ ルーク ＋ ビショップ。' }
      ],
      task: { en: 'Take all four marked pawns with the queen.',
              ja: 'クイーンで、しるしの ついた ポーン 4つを ぜんぶ とろう。' },
      goal: { kind: 'moves', win: { capture: ['d7', 'g7', 'a4', 'a1'] } }
    },

    {
      chapter: 1,
      en: 'King',
      ja: 'キング',
      fen: '8/8/8/6p1/3K1n2/8/8/8 w - - 0 1',
      still: true,
      goals: ['d6'],
      body: [
        { t: 'p', en: 'The king moves one square in any direction.',
          ja: 'キングは たて・よこ・ななめの どこへでも うごけるけど、1マスだけ。いちばん だいじな こまなのに、いちばん ゆっくり あるく。' },
        { t: 'p', en: 'A king may never step onto a square the enemy attacks.',
          ja: 'そして キングには もう1つ きまりが ある。あいてに ねらわれて いる マスには 入れない。じぶんから とられる ところへ 歩いて いく ことは できない。' },
        { t: 'pairs', items: [
          { en: 'King', ja: 'キング', sym: 'K' }
        ] },
        { t: 'key',
          en: 'The king moves one square, and never onto an attacked one.',
          ja: 'キングは 1マス。ねらわれた マスには 入れない。' }
      ],
      task: { en: 'Walk the king to d6. The knight blocks one square, and is protected.',
              ja: 'キングを しるしの d6 まで あるかせよう。まっすぐ 上に 行こうと すると、1マス 入れない ところが ある。あいての ナイトが そこを ねらって いるから。まわって いこう。ナイトは g5 の ポーンに まもられて いる。となりまで 行っても とれない。とった しゅんかん キングが とられて しまう からで、そういう 手は さいしょから さすことが できない。' },
      goal: { kind: 'moves', win: { reach: ['d6'] } }
    },

    // ===== 3章 きふの きほん ===========================================

    {
      chapter: 2,
      en: 'Letters and squares',
      ja: 'こまの きごうと いきさき',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'A move is written as the piece letter plus the square it goes to.',
          ja: 'きふは とても みじかく 書く。「こまの きごう」と「行き さきの マス」を つなげる だけ。Nf3 なら「ナイトが f3 へ」。' },
        { t: 'p', en: 'Knight is N, because King already took K.',
          ja: 'きごうは えいごの あたまの 字。でも ナイト（Knight）だけ ちがって N。あたまの K は キング（King）が さきに つかって いるから、2ばんめの 字を つかう。' },
        { t: 'pairs', items: [
          { en: 'King',   ja: 'キング',     sym: 'K' },
          { en: 'Queen',  ja: 'クイーン',   sym: 'Q' },
          { en: 'Rook',   ja: 'ルーク',     sym: 'R' },
          { en: 'Bishop', ja: 'ビショップ', sym: 'B' },
          { en: 'Knight', ja: 'ナイト',     sym: 'N' },
          { en: 'Pawn',   ja: 'ポーン',     sym: 'なし' }
        ] },
        { t: 'p', en: 'Pawns have no letter. e4 means a pawn went to e4.',
          ja: 'ポーンには きごうが ない。e4 と マスの なまえ だけが 書いて あったら、それは ポーンの 手。いちばん 数が おおい こまなので、いちばん みじかく 書く。' },
        { t: 'key',
          en: 'No letter means a pawn. The knight is N.',
          ja: '字が ついて いなければ ポーン。ナイトは N。' }
      ],
      task: { en: 'Play each written move on the board.',
              ja: '上に 出る きふの とおりに、1手ずつ さしてみよう。白と 黒を こうたいに うごかすよ。' },
      goal: { kind: 'moves', win: { line: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] } }
    },

    {
      chapter: 2,
      en: 'Taking is written with x',
      ja: 'とる ときは x',
      fen: '4k3/8/5n2/3p4/2B1P1b1/5N2/8/4K3 w - - 0 1',
      body: [
        { t: 'p', en: 'An x in the middle means the move took a piece.',
          ja: 'こまを とった 手には、まん中に x を 入れる。Bxc6 なら「ビショップが c6 へ 行って、そこに いた こまを とった」。' },
        { t: 'p', en: 'A capturing pawn writes the file it came from.',
          ja: 'ポーンが とる ときだけ、ちょっと ちがう。ポーンには きごうが ない ので、かわりに「どの れつから 来たか」を 書く。exd5 なら「e の れつの ポーンが d5 で とった」。' },
        { t: 'pairs', items: [
          { en: 'Bishop takes c6', ja: 'ビショップが c6 で とる', sym: 'Bxc6' },
          { en: 'e-pawn takes d5',  ja: 'e れつの ポーンが d5 で とる', sym: 'exd5' }
        ] },
        { t: 'key',
          en: 'x marks a capture. A capturing pawn names the file it came from.',
          ja: 'x は「とった」の しるし。ポーンは 出てきた れつを 書く。' }
      ],
      task: { en: 'Play the three written captures.',
              ja: 'とる 手を 3つ、きふの とおりに さしてみよう。' },
      goal: { kind: 'moves', win: { line: ['exd5', 'Nxd5', 'Bxd5'] } }
    },

    {
      chapter: 2,
      en: 'When two pieces can go there',
      ja: '2まい とも 行ける とき',
      fen: '4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1',
      body: [
        { t: 'p', en: 'If two identical pieces can reach the same square, the notation says which one.',
          ja: 'この ばんには 白の ナイトが 2まい ある。b1 の ナイトも、f3 の ナイトも、どちらも d2 へ 行ける。Nd2 と 書いた だけでは、どちらが うごいたのか わからない。' },
        { t: 'p', en: 'Add the file it came from. If the files match, add the rank instead.',
          ja: 'そこで、出てきた れつの 字を あいだに 入れる。b の れつから 来た ナイトなら Nbd2。f の れつから 来た ナイトなら Nfd2。もし 2まいが おなじ れつに いる ときは、かわりに だんの すうじを 書く。' },
        { t: 'pairs', items: [
          { en: 'b-knight to d2', ja: 'b から 来た ナイトが d2 へ', sym: 'Nbd2' },
          { en: 'f-knight to d2', ja: 'f から 来た ナイトが d2 へ', sym: 'Nfd2' }
        ] },
        { t: 'p', en: 'Pawns never need this. They already name their file.',
          ja: 'では ポーンは どう なるのか。じつは ポーンだけ、この 書きたしが いらない。' },
        { t: 'p', en: 'Two pawns can only meet on a square they both capture on.',
          ja: 'まず、2まいの ポーンが おなじ マスへ 行けるのは「とる」ときだけ。まっすぐ すすむ だけなら、1つの マスへ 行ける ポーンは かならず 1まいしか ない。おなじ れつに 2まい いても、さきに いる ポーンが うしろの ポーンを ふさいで しまうから。' },
        { t: 'p', en: 'And a capturing pawn writes its file anyway, as you learned last lesson.',
          ja: 'そして ポーンが とる ときは、まえの レッスンで ならった とおり、かならず 出てきた れつを 書く。たとえば 白の ポーンが d4 と f4 に いて、どちらも e5 で とれる とき、d の ポーンなら dxe5、f の ポーンなら fxe5。書きたす までも なく、はじめから 書き分けて ある。（この ばんには ポーンは いない。かたちの はなし）' },
        { t: 'pairs', items: [
          { en: 'd-pawn takes e5', ja: 'd の れつの ポーンが e5 で とる', sym: 'dxe5' },
          { en: 'f-pawn takes e5', ja: 'f の れつの ポーンが e5 で とる', sym: 'fxe5' }
        ] },
        { t: 'key',
          en: 'Add just enough to say which piece it was. No more than that.',
          ja: 'どちらの こまか わかる ぶんだけ 書きたす。わかる なら 書かない。ポーンは もともと 書いて あるので、足さない。' }
      ],
      task: { en: 'Play Nbd2 — the knight from the b-file, not the other one.',
              ja: 'Nbd2 を さしてみよう。b の れつの ナイトだよ。まちがえて f3 の ナイトを うごかすと、それは Nfd2 に なって しまう。' },
      goal: { kind: 'moves', win: { line: ['Nbd2'] } }
    },

    // ===== 4章 とくべつな きまり =======================================

    {
      chapter: 3,
      en: 'Promotion',
      ja: 'プロモーション',
      fen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
      goals: ['a8'],
      body: [
        { t: 'p', en: 'A pawn that reaches the far end turns into another piece.',
          ja: 'ポーンが いちばん おくの だん（白なら 8だんめ）まで たどりつくと、べつの こまに なれる。これが プロモーション。' },
        { t: 'p', en: 'You choose: queen, rook, bishop or knight. Almost always the queen.',
          ja: 'なる こまは じぶんで えらぶ。クイーン・ルーク・ビショップ・ナイトの 4つから。いちばん つよい クイーンを えらぶ ことが ほとんど。キングには なれない。ポーンの ままで いる ことも できない。' },
        { t: 'p', en: 'Already have a queen? You can still promote to another one.',
          ja: 'すでに クイーンが ばんに いても かまわない。クイーンが 2まいに なる ことも ある。とられた こまが もどって くる わけでは ないので、8まい ぜんぶが クイーンに なる ことだって ありえる。' },
        { t: 'pairs', items: [
          { en: 'promote to queen', ja: 'クイーンに なった', sym: 'e8=Q' },
          { en: 'promote to knight', ja: 'ナイトに なった', sym: 'e8=N' }
        ] },
        { t: 'key',
          en: 'Notation puts = and the new piece at the end.',
          ja: 'きふでは「＝ なった こま」を うしろに つける。' }
      ],
      task: { en: 'Push the pawn to a8 and choose what it becomes.',
              ja: 'ポーンを a8 まで すすめて、なる こまを えらんでみよう。' },
      goal: { kind: 'moves', win: { flag: 'promo' } }
    },

    {
      chapter: 3,
      en: 'En passant',
      ja: 'アンパッサン',
      fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1',
      body: [
        { t: 'p', en: 'A pawn that jumps two squares past an enemy pawn can be taken anyway.',
          ja: 'ポーンは はじめの いちから 2マス すすめる。でも その 2マスを つかって、あいての ポーンの よこを すりぬける ことが ある。' },
        { t: 'p', en: 'You capture it as if it had moved only one square.',
          ja: 'その ときだけ、すりぬけられた ほうの ポーンは「1マスしか すすまなかった ことに して」とる ことが できる。あいての ポーンは よこに いるのに、とった ポーンは ななめ 前の マスに すすむ。ふしぎな 手。' },
        { t: 'p', en: 'Only on the very next move. Wait one turn and the chance is gone.',
          ja: 'できるのは すりぬけられた すぐ つぎの 1手だけ。ほかの 手を さして しまうと、もう 二どと とれない。チェスで いちばん「いま だけ」の きまり。' },
        { t: 'pairs', items: [
          { en: 'en passant', ja: 'アンパッサン', sym: 'exd6' }
        ] },
        { t: 'key',
          en: 'The pawn that slipped past can be taken on the very next move only.',
          ja: 'すりぬけた ポーンは、すぐ つぎの 手でだけ とれる。' }
      ],
      task: { en: 'Play d5 for black, then take it en passant with exd6.',
              ja: 'まず 黒の ポーンを 2マス すすめて（d5）、白の ポーンで とってみよう（exd6）。白の ポーンが どこに すすむか よく 見ていて。' },
      goal: { kind: 'moves', win: { line: ['d5', 'exd6'] } }
    },

    {
      chapter: 3,
      en: 'Check, and three ways out',
      ja: 'チェックと にげかた',
      fen: '4r2k/8/8/8/B7/3P2N1/8/4K3 w - - 0 1',
      body: [
        { t: 'p', en: 'Check means the king is under attack.',
          ja: 'キングが あいてに ねらわれて いる ことを チェックと いう。きふでは うしろに + を つける。' },
        { t: 'p', en: 'You must get out of check. There are exactly three ways.',
          ja: 'チェックされたら、ほうって おく ことは できない。かならず その 1手で なんとか しなければ ならない。ほうほうは ちょうど 3つ。' },
        { t: 'pairs', items: [
          { en: 'move the king', ja: 'キングが にげる',       sym: '1' },
          { en: 'block the line', ja: 'あいだに 入る',         sym: '2' },
          { en: 'take the attacker', ja: 'ねらって いる こまを とる', sym: '3' }
        ] },
        { t: 'p', en: 'A blocking piece must be protected, or it is just given away.',
          ja: '「あいだに 入る」には 気を つける ことが ある。入れた こまが みかたに まもられて いるか たしかめる こと。まもられて いないと、その こまを そのまま とられて、また チェックに なって しまう。あいだに 入った いみが なくなる。' },
        { t: 'p', en: 'Here e4 is covered by the d3 pawn, and e2 by the king itself.',
          ja: 'この ばんは だいじょうぶ。e4 は d3 の ポーンが まもって いるし、e2 は キング じしんが まもって いる。ナイトを とられても、とり返せる。' },
        { t: 'p', en: 'If none of the three works, the game is over.',
          ja: 'この 3つの どれも できない とき、それが チェックメイト。しょうぶが つく。くわしくは 6章で。' },
        { t: 'key',
          en: 'Move, block, capture. There is no fourth way.',
          ja: 'にげる・あいだに 入る・とる。この 3つしか ない。' }
      ],
      task: { en: 'White is in check. Find a way out — any of the three works here.',
              ja: '白の キングが e8 の ルークに ねらわれて いる。この ばんでは 3つの ほうほうが ぜんぶ つかえる。どれか 1つで にげてみよう。3つとも ルールの うえでは 正しい。どれが いちばん 得かは、また べつの はなし。' },
      goal: { kind: 'moves', win: { escape: true } }
    },

    {
      chapter: 3,
      en: 'Castling',
      ja: 'キャスリング',
      fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Castling moves the king and a rook in one turn.',
          ja: 'キャスリングは、1手で キングと ルークを いっしょに うごかす とくべつな 手。キングが よこへ 2マス すすみ、ルークが その むこうがわへ とびこえる ように まわる。1手で 2つの こまが うごくのは この 手 だけ。' },
        { t: 'p', en: 'Short side is O-O. Long side is O-O-O.',
          ja: 'ルークに ちかい がわ（キングサイド）へ するのが O-O。とおい がわ（クイーンサイド）へ するのが O-O-O。きふでは こまの きごうも マスの なまえも 書かない。' },
        { t: 'pairs', items: [
          { en: 'short castling', ja: 'キングサイド', sym: 'O-O' },
          { en: 'long castling',  ja: 'クイーンサイド', sym: 'O-O-O' }
        ] },
        { t: 'p', en: 'Four conditions must all hold.',
          ja: 'できる ための きまりが 4つ ある。1つでも かけたら できない。' },
        { t: 'pairs', items: [
          { en: 'king and that rook have never moved', ja: 'キングと その ルークが 1回も うごいて いない', sym: '1' },
          { en: 'the squares between are empty',        ja: 'あいだの マスが 空いて いる',                   sym: '2' },
          { en: 'the king is not in check now',         ja: 'いま チェックされて いない',                     sym: '3' },
          { en: 'the king does not pass through or land on an attacked square', ja: 'キングが 通る マスも 着く マスも ねらわれて いない', sym: '4' }
        ] },
        { t: 'key',
          en: 'The conditions cover the king\'s path only. An attacked rook is fine.',
          ja: 'きまりが かかるのは キングの 通り道だけ。ルークが ねらわれて いても できる。' }
      ],
      task: { en: 'Castle on the king side: O-O.',
              ja: 'キングサイドの キャスリング（O-O）を してみよう。キングを g1 へ うごかせば できるよ。' },
      goal: { kind: 'moves', win: { flag: 'castleK' } }
    },

    // ===== 5章 はじめの ならび =========================================

    {
      chapter: 4,
      en: 'The starting position',
      ja: 'はじめの ならび',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1',
      body: [
        { t: 'p', en: 'Pawns fill the second rank. The big pieces stand behind them.',
          ja: 'ポーンは 8まい、2だんめに ぜんぶ ならべる。その うしろの 1だんめに、のこりの 8まいが ならぶ。あいての がわも おなじ ならび。' },
        { t: 'p', en: 'From the corner inward: rook, knight, bishop.',
          ja: 'ならびかたは かどから 中へ じゅんばんに、ルーク・ナイト・ビショップ。左右 どちらも おなじ。のこった 2マスに クイーンと キングが 入る。' },
        { t: 'p', en: 'The queen stands on her own colour.',
          ja: 'クイーンと キングの どちらが どちらか、まちがえやすい。おぼえかたが ある。クイーンは じぶんと おなじ いろの マスに すわる。白の クイーンは 白マスの d1、黒の クイーンは 黒マスの d8。' },
        { t: 'key',
          en: 'The queen stands on her own colour. The white queen starts on d1.',
          ja: 'クイーンは じぶんの いろの マス。白クイーンは d1。' }
      ],
      task: { en: 'Place the eight white pieces on the first rank.',
              ja: '白の 8まいを 1だんめに ならべよう。下の こまを えらんで、おく マスを おす。' },
      goal: { kind: 'setup',
              want: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              palette: ['R', 'N', 'B', 'Q', 'K'] }
    },

    // ===== 6章 しょうぶの つきかた =====================================

    {
      chapter: 5,
      en: 'Checkmate',
      ja: 'チェックメイト',
      fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
      body: [
        { t: 'p', en: 'Checkmate is check with no way out. The game ends at once.',
          ja: 'キングが ねらわれて いて、しかも 3つの にげかた（にげる・あいだに 入る・とる）が どれも できない とき、それが チェックメイト。その しゅんかん しょうぶが つく。' },
        { t: 'p', en: 'The king is never actually captured.',
          ja: 'ちなみに キングが じっさいに とられる ことは ない。とられる 1手 前で ゲームが おわる から。きふでは うしろに # を つける。' },
        { t: 'pairs', items: [
          { en: 'check',     ja: 'チェック',         sym: '+' },
          { en: 'checkmate', ja: 'チェックメイト',   sym: '#' }
        ] },
        { t: 'key',
          en: 'Black\'s own three pawns box the king in. Only the back rank is left.',
          ja: '黒の キングは じぶんの ポーン 3まいに ふさがれて いる。にげ道は 8だんめ だけ。' }
      ],
      task: { en: 'Find checkmate in one move.',
              ja: '白の 1手で チェックメイトに できる。どこへ ルークを 行かせれば いいか さがしてみよう。' },
      goal: { kind: 'moves', win: { status: 'checkmate' } }
    },

    {
      chapter: 5,
      en: 'Stalemate',
      ja: 'ステイルメイト',
      fen: 'k7/2K5/8/8/7B/8/8/8 w - - 0 1',
      body: [
        { t: 'p', en: 'Stalemate: the player to move has no legal move, but is not in check.',
          ja: 'てばんが きたのに、さす 手が 1つも ない。でも キングは ねらわれて いない。この ときは ステイルメイトと いって、ひきわけに なる。まけでは ない。' },
        { t: 'p', en: 'Pass is not allowed in chess. You must move.',
          ja: 'チェックメイトと にて いるけど、ぜんぜん ちがう けっか。チェスでは「パス」が できない から こう なる。うごける 手が ないのに うごかなければ ならない、という 行きどまり。' },
        { t: 'p', en: 'A losing player can sometimes save a draw this way.',
          ja: 'まけそうな ほうが、わざと ステイルメイトを ねらって ひきわけに もちこむ ことも ある。おぼえて おくと、あと 1まいしか のこって いなくても あきらめなく なる。' },
        { t: 'key',
          en: 'No legal move, and not in check. That is a draw.',
          ja: 'さす 手が ない ＋ チェックされて いない ＝ ひきわけ。' }
      ],
      task: { en: 'Make it stalemate in one move. Giving check is not it.',
              ja: '白の 1手で ステイルメイトに できる。黒の キングの 行ける マスを ぜんぶ ふさいで、しかも チェックには しない 手を さがそう。ビショップの ななめの 線を よく 見て。a7 を ねらえる ところは 1つだけ。' },
      goal: { kind: 'moves', win: { status: 'stalemate' } }
    },

    {
      chapter: 5,
      en: 'Draws, and giving up',
      ja: 'ひきわけと とうりょう',
      fen: '8/8/4k3/8/8/2K5/5B2/8 w - - 0 1',
      body: [
        { t: 'p', en: 'There are five ways a game ends in a draw.',
          ja: 'ひきわけに なる かたちは、ステイルメイトの ほかにも ある。この ばんは 5ばんめの かたち。白は キングと ビショップ 1まいだけ。どう さしても チェックメイトに できない ので、その ときに ひきわけに なる。' },
        { t: 'p', en: 'Try it. You move White. Black runs by itself.',
          ja: 'ほんとうに できないのか、じぶんで ためしてみよう。白を うごかすのは きみ。黒は かってに にげる。おいかけても、かこんでも、ぜったいに 詰まない。' },
        { t: 'p', en: 'Three sets to try. None of them can ever mate.',
          ja: '駒の くみあわせを 3つから えらべる。どれを えらんでも 詰ませられない。気が すむまで さしてみて。「できた！」が 出た あとも、そのまま つづけられる。' },
        { t: 'pairs', items: [
          { en: 'stalemate',            ja: 'さす 手が ない',               sym: '1' },
          { en: 'agreement',            ja: 'ふたりで きめる',               sym: '2' },
          { en: 'threefold repetition', ja: 'おなじ ばんめんが 3回',         sym: '3' },
          { en: 'fifty-move rule',      ja: '50手 とらず・ポーンも うごかず', sym: '4' },
          { en: 'dead position',        ja: '詰ませられない こまだけ',       sym: '5' }
        ] },
        { t: 'p', en: 'Repetition and the fifty-move rule are claimed, not automatic.',
          ja: '3と4は、きた しゅんかんに おわる わけでは ない。「ひきわけに しよう」と 言える ように なる だけ。言わずに さしつづける ことも できる。（5回 おなじに なったり、75手 たつと、こんどは じどうで おわる）' },
        { t: 'p', en: 'Resigning means admitting the loss before mate.',
          ja: 'もう1つ、とうりょう（リザイン）が ある。チェックメイトに なる 前に「まけました」と じぶんで みとめる こと。つよい ひとどうしの たいきょくは、ほとんどが これで おわる。さいごまで さす ほうが しつれい、と かんがえる ひとも いる。' },
        { t: 'pairs', items: [
          { en: 'White won',  ja: '白の かち',   sym: '1-0' },
          { en: 'Black won',  ja: '黒の かち',   sym: '0-1' },
          { en: 'Draw',       ja: 'ひきわけ',     sym: '1/2-1/2' }
        ] },
        { t: 'key',
          en: 'Every game score ends with one of these three.',
          ja: 'きふの いちばん うしろに、この 3つの どれかが 書いて ある。' }
      ],
      task: { en: 'Pick a set and chase the black king. See for yourself that it never ends.',
              ja: 'くみあわせを えらんで、白で 黒を おいかけてみよう。12手 さしても 詰まない ことを たしかめて。' },
      goal: { kind: 'chase', moves: 12, sets: [
        { en: 'King + bishop vs king',
          ja: 'キング＋ビショップ 対 キング',
          fen: '8/8/4k3/8/8/2K5/5B2/8 w - - 0 1' },
        { en: 'King + knight vs king',
          ja: 'キング＋ナイト 対 キング',
          fen: '8/8/4k3/8/8/2K5/5N2/8 w - - 0 1' },
        { en: 'Bishops on the same colour',
          ja: 'おなじ いろの ビショップ どうし',
          fen: '8/2b5/4k3/8/8/2K5/5B2/8 w - - 0 1' }
      ] }
    },

    // ===== 7章 きふを よむ =============================================

    {
      chapter: 6,
      en: 'Move numbers',
      ja: 'てばんの ばんごう',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'One number covers both sides: white first, then black.',
          ja: 'きふには ばんごうが ついて いる。1つの ばんごうに、白の 手と 黒の 手が 2つ ならぶ。「1. e4 e5」なら、1手めに 白が e4、黒が e5 と さした という こと。' },
        { t: 'p', en: 'Here is a famous four-move trap.',
          ja: '下の きふは「スカラーズメイト」と よばれる、4手で おわって しまう わなの かたち。クイーンと ビショップの 2まいで f7 を ねらう。黒が 気づかなければ、ほんとうに 4手で おわる。' },
        { t: 'p', en: 'Step through it and watch f7.',
          ja: 'ボタンで 1手ずつ すすめて みよう。白が どこを ねらって いるか、3手めで わかる。さいごの 手に # が ついて いる ことも たしかめて。' },
        { t: 'key',
          en: 'Any game score can be read if you put it on the board one move at a time.',
          ja: 'はじめて 見る きふも、1手ずつ 盤に うつせば かならず 読める。' }
      ],
      task: { en: 'Step forward and back through the game.',
              ja: 'じぶんでは させない レッスン。ボタンで すすめたり もどしたり しながら 読もう。' },
      goal: { kind: 'replay', line: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#' }
    },

    {
      chapter: 6,
      en: 'Play from the notation',
      ja: 'きふの とおりに さす',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'Last lesson. Read the notation and play every move yourself.',
          ja: 'さいごの レッスン。こんどは 自分で 1手ずつ さす。書いて ある きふを 読んで、その とおりに 盤を うごかそう。' },
        { t: 'p', en: 'This is Legall’s Trap, known since the 1700s.',
          ja: 'この きふは「レガールの わな」と よばれて いる、1700年代から しられて いる かたち。白は とちゅうで クイーンを とられる。それでも 7手めに チェックメイトに なる。' },
        { t: 'p', en: 'Everything from volume 1 is in here.',
          ja: 'この 7手の 中に、1巻で ならった ことが ほとんど 出て くる。こまの きごう、x、+、#、そして 2まいの ナイトの 書き分け。ゆっくり 読んでみて。' },
        { t: 'key',
          en: 'If you can read it, you can play it. Finish, and volume 1 is done.',
          ja: '読めれば させる。さいごまで いけたら 1巻は おわり。' }
      ],
      task: { en: 'Play all thirteen moves from the notation.',
              ja: '上に 出る 手を、1つずつ 読んで さしていこう。ぜんぶで 13手。' },
      goal: { kind: 'moves', win: { line: [
        'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Nc3', 'Bg4',
        'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'
      ] } }
    },

    // ===== おまけ =======================================================

    {
      chapter: 7,
      en: 'Play the computer',
      ja: 'コンピュータと さす',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      body: [
        { t: 'p', en: 'No lesson here. You play White and the computer plays Black. All the rules are on.',
          ja: 'ここは レッスンでは ない。白が きみで、黒は コンピュータが さす。1巻で ならった きまりは ぜんぶ きいて いる。プロモーション・アンパッサン・キャスリング・チェックメイト・ステイルメイト・ひきわけ、ぜんぶ。' },
        { t: 'p', en: 'Black stays near its own side. But it takes a piece nobody protects, and it takes back when it can.',
          ja: '黒は あまり 前に 出て こない。でも、まもられて いない こまは とりに くるし、とられた ときは とりかえせるなら とりかえす。' },
        { t: 'p', en: 'Checkmate wins. If Black has no move and is not in check, it is a stalemate — a draw.',
          ja: '黒を 詰ませたら きみの かち。黒が 動けなく なっても チェックされて いなければ ステイルメイトで ひきわけ。レッスン19の とおり。' },
        { t: 'p', en: 'Illegal moves simply will not go.',
          ja: 'ルールに ない 手は させない ように なって いる。だから 「これは さして いいのかな」と 思ったら、ためしに さわってみれば わかる。行ける マスに しるしが 出る。' },
        { t: 'p', en: 'Your moves pile up as notation below. You can copy it.',
          ja: 'さした 手は 下に きふに なって つみあがる。コピーも できる。おもしろい たいきょくに なったら、自分の ところに 書きうつして おこう。この ページを とじると きえて しまう から。' },
        { t: 'p', en: 'To play with a friend, or to set up your own pieces, use the Play tab at the top.',
          ja: 'ともだちと ふたりで さしたい ときや、好きな こまを ならべて あそびたい ときは、上の「あそぶ」タブへ。' },
        { t: 'key',
          en: 'A piece nobody protects can be taken.',
          ja: 'まもられて いない こまは とられる。' }
      ],
      task: { en: 'White moves first.',
              ja: '白から どうぞ。' },
      // 黒は /kids/shared/chess-cpu.js が指す（cpu: true）。
      // ふたりで さす・ならべて あそぶ は、巻とは別の「あそぶ」タブ（/kids/chess-play/）
      goal: { kind: 'free', cpu: true }
    }

  ]
};
