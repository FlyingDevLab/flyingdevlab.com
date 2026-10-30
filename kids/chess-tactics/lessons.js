// ================================================================
// lessons.js – チェス 第02巻 戦術、レッスン表
// ================================================================
//
// この巻の「文章」と「盤」と「できたの条件」だけを持つ。
// 盤を描くのは /kids/shared/chess-lessons.js、
// ルールの判定は /kids/shared/chess.js。ここには仕組みを書かない。
// 書き方の決まりは1巻の lessons.js の冒頭に書いたものと同じ。
//
// ★ この巻だけの goal ★
//   { kind:'moves', win:{ answer:'Rxd5' } }
//      自分で手を見つける。答えは画面に出さない。
//      ちがう手を指そうとしても盤は動かさず、なぜ違うかだけ返す。
//      その文は「とりかえの損得」から作るので、ここには書かない。
//   { kind:'squares', ask:[…], say:'value' }
//      押した駒のねうちを返す。1回目だけで使う。
//
// ★ 盤は機械で証明してある ★
//   答えのある問題は、1問ずつ次の3つを確かめた（2026-10-30）。
//     1. その手が唯一の最善であること（2番手と差があること）
//     2. ちゃんと駒得になること（開始時の駒の差からの増分で測る）
//     3. 取ったあとが「詰ませられない駒組み」にならないこと
//   盤を1マスでも変えたら、必ず確かめ直すこと。
//
// ★ 用語の書き方 ★
//   英語 / カタカナ（漢字）の形にする。
//     fork / フォーク（両取り）
//     pin / ピン（釘付け）
//     skewer / スキュア（串刺し）
//     sacrifice / サクリファイス（捨て駒）
//   漢字を出すのは用語の棚（pairs）だけ。説明の地の文はひらがなのまま。
// ================================================================

window.CHESS_LESSONS = {

  volume: { no: 2, en: 'Tactics', ja: 'せんじゅつ' },
  volumes: [
    { no: 1, en: 'Basics',  ja: 'きそ',       url: '/kids/chess/' },
    { no: 2, en: 'Tactics', ja: 'せんじゅつ', url: '/kids/chess-tactics/' }
  ],

  chapters: [
    { en: 'Value and trades', ja: 'ねうちと とりかえ' },
    { en: 'Two at once',      ja: 'ふたつ いっぺんに' },
    { en: 'Stuck on a line',  ja: 'うごけなく する' }
  ],

  lessons: [

    // ===== 1章 ねうちと とりかえ =======================================
    //
    // この章を最初に置くのが、この巻でいちばん外せない順番。
    // 戦術はどれも最後に「だから こまが とれる」で終わる。
    // 得かどうかを自分で判じられないと、どの回も結論が出せない。

    {
      chapter: 0,
      en: 'What the pieces are worth',
      ja: 'こまの ねうち',
      fen: '4k3/8/8/8/8/8/P7/1NBQK2R w - - 0 1',
      body: [
        { t: 'p', en: 'Each piece is worth a number of pawns.',
          ja: 'こまには ねうちが ある。ポーン 1つを もとに して、ほかの こまが その 何こ ぶんかを あらわす。この すうじが あると、とりかえて いいか わるいかを じぶんで 決められる。' },
        { t: 'pairs', items: [
          { en: 'Pawn',   ja: 'ポーン',     sym: '1' },
          { en: 'Knight', ja: 'ナイト',     sym: '3' },
          { en: 'Bishop', ja: 'ビショップ', sym: '3' },
          { en: 'Rook',   ja: 'ルーク',     sym: '5' },
          { en: 'Queen',  ja: 'クイーン',   sym: '9' },
          { en: 'King',   ja: 'キング',     sym: '♾️' }
        ] },
        { t: 'p', en: 'The king has no number: you can never trade it.',
          ja: 'キングだけ すうじが ない。とられたら そこで おわる こまなので、ほかの こまと とりかえる ことが できない。「9こ ぶん」の ように くらべられない から ♾️。' },
        { t: 'p', en: 'Knight and bishop are both 3. Which is better depends on the board.',
          ja: 'ナイトと ビショップは どちらも 3。どちらが つよいかは、盤の かたちで かわる。盤が ひらいて いる ときは ビショップが とおくまで とどく。ポーンが かたまって うごけない ときは、とびこえられる ナイトが はたらく。だから どちらかを 上と 書く ことは できない。' },
        { t: 'p', en: 'Two bishops together are a different story.',
          ja: 'でも ビショップが 2まい そろって いる ときは、はっきり つよい。1巻で ならった とおり、白マスの ビショップと 黒マスの ビショップで、やっと 盤の ぜんぶの マスに とどく から。つよい ひとの あいだでも、ナイトと ビショップの どちらが すきかは わかれる。じぶんで さしながら さがして みて。' },
        { t: 'key',
          en: 'These numbers are a guide, not a law. The board decides.',
          ja: 'この すうじは 目やす。さいごに 決めるのは 盤の かたち。' }
      ],
      task: { en: 'Press each white piece to see what it is worth.',
              ja: '白の こまを ぜんぶ おして、ねうちを たしかめよう。6つ あるよ。' },
      goal: { kind: 'squares', ask: ['a2', 'b1', 'c1', 'h1', 'd1', 'e1'],
              ordered: false, say: 'value' }
    },

    {
      chapter: 0,
      en: 'Pieces nobody is guarding',
      ja: 'まもられて いない こま',
      fen: '4k3/pp6/8/3n2p1/7b/8/PP3P2/3RK2R w - - 0 1',
      goals: ['d5'],
      body: [
        { t: 'p', en: 'Before you take, look at who is guarding the square.',
          ja: 'とれる こまが あっても、すぐに とっては いけない。その こまを だれかが まもって いたら、とった しゅんかん とりかえされる。' },
        { t: 'p', en: 'Guarded means the trade costs you.',
          ja: 'ルークで 3の こまを とって、5の ルークを とりかえされたら、2 そんする。とれる ことと、とって いい ことは ちがう。' },
        { t: 'p', en: 'An unguarded piece is free.',
          ja: 'だれにも まもられて いない こまは、ただで とれる。この 盤には とれる こまが 2つ あるけれど、ただで とれるのは 1つだけ。' },
        { t: 'key',
          en: 'Before taking, check who guards that square.',
          ja: 'とる まえに、その マスを まもって いる こまが いないか たしかめる。' }
      ],
      task: { en: 'Take the piece that nobody is guarding.',
              ja: 'まもられて いない こまを とろう。しるしの ついた マスに いるよ。' },
      goal: { kind: 'moves', win: { answer: 'Rxd5' } }
    },

    {
      chapter: 0,
      en: 'Take with the cheapest piece',
      ja: 'とりかえすと とくか そんか',
      fen: '4k3/pp6/4p3/3n4/2P5/8/PP6/3RK3 w - - 0 1',
      goals: ['d5'],
      body: [
        { t: 'p', en: 'Here the knight is guarded, but you have two attackers.',
          ja: 'd5 の ナイトは e6 の ポーンに まもられて いる。でも こちらは 2まいで ねらって いる。c4 の ポーンと、d1 の ルーク。' },
        { t: 'p', en: 'Which piece you take with changes everything.',
          ja: 'どちらで とるかで、けっかが まるきり かわる。ルークで とると、ポーンに とりかえされて 5を 失い 3を 得る。ポーンで とると、とりかえされても 1を 失って 3を 得る。' },
        { t: 'p', en: 'Line them up cheapest first.',
          ja: 'とりあいに なりそうな マスは、安い こまから じゅんに 当てて いく。こう 数えると、とった ほうが いいのか、やめた ほうが いいのかが わかる。' },
        { t: 'key',
          en: 'Start the trade with your cheapest attacker.',
          ja: 'とりあいは、安い こまから はじめる。' }
      ],
      task: { en: 'Win the knight on d5. Choose which piece takes it.',
              ja: 'd5 の ナイトを とろう。どちらの こまで とるかを よく かんがえて。' },
      goal: { kind: 'moves', win: { answer: 'cxd5' } }
    },

    {
      chapter: 0,
      en: 'Counting is not enough',
      ja: 'かぞえる だけでは たりない',
      fen: '4k3/pp3p2/2p1p3/3n4/2B2N2/8/PP6/3RK3 w - - 0 1',
      goals: ['d5'],
      body: [
        { t: 'p', en: 'White attacks d5 three times. Black guards it twice.',
          ja: 'd5 の ナイトを、白は 3まいで ねらって いる。ビショップ・ナイト・ルーク。くらべて 黒が まもって いるのは 2まい。c6 と e6 の ポーン。' },
        { t: 'p', en: 'Three against two — but taking still gains nothing.',
          ja: '3たい2。数では 勝って いる。それでも、ここで とりあいを はじめても とくに ならない。' },
        { t: 'p', en: 'Because the guards are pawns.',
          ja: 'まもって いるのが ポーン（1）だから。こちらは 3や 5の こまを 出して いく ことに なる。安い こまで まもられて いると、数で 勝って いても 得に ならない。' },
        { t: 'key',
          en: 'Count the pieces, then look at what they are worth.',
          ja: 'かぞえて、それから ねうちを 見る。数だけでは 決まらない。' }
      ],
      task: { en: 'Press the three white pieces that attack d5.',
              ja: 'd5 を ねらって いる 白の こまを ぜんぶ おそう。3まい あるよ。' },
      goal: { kind: 'squares', ask: ['c4', 'f4', 'd1'], ordered: false }
    },

    // ===== 2章 ふたつ いっぺんに ======================================
    //
    // 1章で「得か損か」を数えられるようになった。ここからが戦術。
    // フォークを最初に置くのは、いちばん形が見えやすいため。
    // ピンやディスカバードは「動かせない」「かくれている」という
    // 一段ぬけた話で、フォークだけは盤の上に理由がそのまま出ている。

    {
      chapter: 1,
      en: 'The knight fork',
      ja: 'ナイトの フォーク',
      fen: '3q3k/pp6/8/4N3/8/8/PP6/4K3 w - - 0 1',
      body: [
        { t: 'p', en: 'One piece attacking two at the same time is a fork.',
          ja: '1つの こまで、あいての こまを 2つ いっぺんに ねらう ことを フォークと いう。ねらわれた ほうは、どちらか 1つしか まもれない。' },
        { t: 'pairs', items: [
          { en: 'fork', ja: 'フォーク（両取り）', sym: '' }
        ] },
        { t: 'p', en: 'The knight is the best forker, because its move is hard to block.',
          ja: 'フォークが いちばん うまいのは ナイト。たてでも よこでも ななめでも ない うごき方を するので、あいだに 入って ふせぐ ことが できない。しかも とびこえる ので、まわりを かためても 止められない。' },
        { t: 'p', en: 'A fork with check is the strongest kind.',
          ja: 'とくに つよいのが、王手と いっしょに かける フォーク。あいては 王手を 外す ことしか できない。もう ひとつの こまを まもって いる ひまが ない。だから かならず とれる。' },
        { t: 'key',
          en: 'A fork with check always wins the other piece.',
          ja: '王手と いっしょの フォークは、かならず もう片方が とれる。' }
      ],
      task: { en: 'Fork the king and the queen with your knight.',
              ja: 'ナイトで 王手を かけながら、クイーンも いっぺんに ねらおう。' },
      goal: { kind: 'moves', win: { answer: 'Nf7+' } }
    },

    {
      chapter: 1,
      en: 'Even a pawn can fork',
      ja: 'ポーンでも できる',
      fen: '4k3/pp6/3n1n2/8/4P3/8/PP6/4K3 w - - 0 1',
      body: [
        { t: 'p', en: 'Any piece can fork, not just the knight.',
          ja: 'フォークは ナイトだけの ものでは ない。どの こまでも できる。ビショップでも ルークでも クイーンでも、2つを いっぺんに ねらえば それは フォーク。' },
        { t: 'p', en: 'A pawn fork is the hardest to answer.',
          ja: 'そして いちばん きついのが、ポーンの フォーク。ねうちが 1しか ない こまに ねらわれると、3や 5の こまは とられる わけに いかない。どちらかを あきらめる しか なくなる。' },
        { t: 'p', en: 'Right now your pawn is the one being attacked, twice.',
          ja: 'この 盤は いま、こちらの e4 の ポーンが ナイト 2まいに ねらわれて いる。にげたく なる ところだけど、よく 見て。前に 1マス すすむと、こんどは こちらが 2まいを ねらう ことに なる。' },
        { t: 'key',
          en: 'The cheaper the forking piece, the worse it is to face.',
          ja: '安い こまで ねらう ほど、あいては こまる。' }
      ],
      task: { en: 'Push the pawn so it attacks both knights at once.',
              ja: 'ポーンを 1マス すすめて、ナイト 2まいを いっぺんに ねらおう。' },
      goal: { kind: 'moves', win: { answer: 'e5' } }
    },

    // ===== 3章 うごけなく する ========================================
    //
    // ピンを2回に分けてある。うしろが キングのとき（うごけない）と、
    // ほかの こまのとき（うごけるが そんする）は、別のことだから。
    // 同じ回にまとめると「うごけない」と覚えた子が、
    // クイーンの前の こまが うごくのを見て混乱する。
    //
    // ピンの2回は「とる」課題にしていない。この章で分かってほしいのは
    // 盤の上で何が起きているかで、取るのは そのあとの話である。
    // スキュアだけ取る課題にしてあるのは、あの形は
    // 「王手 → どく → とる」が1つながりで、途中で切れないため。

    {
      chapter: 2,
      en: 'Pinned to the king',
      ja: 'キングの 前の ピン',
      fen: '3k4/pp2p3/3n4/8/2P5/8/PP6/3RK3 b - - 0 1',
      body: [
        { t: 'p', en: 'Two enemy pieces on one line, with the king behind.',
          ja: '1本の 線の 上に、あいての こまが 2つ ならぶ ことが ある。d の れつを 見て。ルーク・ナイト・キングが たてに ならんで いる。' },
        { t: 'pairs', items: [
          { en: 'pin', ja: 'ピン（釘付け）', sym: '' }
        ] },
        { t: 'p', en: 'The piece in front cannot move at all.',
          ja: 'この とき、まえに いる ナイトは **1マスも** うごけない。うごいた しゅんかん、うしろの キングが ルークに とられる かたちに なるから。じぶんの キングを あぶなく する 手は、ルールで さす ことが できない。' },
        { t: 'p', en: 'A pinned piece is a piece that is there but cannot help.',
          ja: 'だから この ナイトは、盤の 上に いるのに 何も できない。まもりにも 行けないし、にげる ことも できない。くぎで うちつけられた ように なる。これが ピン。' },
        { t: 'key',
          en: 'Pinned to the king means it cannot move at all.',
          ja: 'うしろが キングの ピンは、ぜったいに うごけない。' }
      ],
      task: { en: 'One black piece cannot move at all. Press it.',
              ja: 'この 盤に、1マスも うごけない こまが 1つ ある。どれか おそう。' },
      goal: { kind: 'squares', ask: ['d6'], ordered: false }
    },

    {
      chapter: 2,
      en: 'Pinned to the queen',
      ja: 'クイーンの 前の ピン',
      fen: '3qk3/pp6/5n2/6B1/8/8/PP6/4K3 b - - 0 1',
      body: [
        { t: 'p', en: 'The piece behind does not have to be the king.',
          ja: 'うしろに いるのが キングで なくても、ピンは かかる。この 盤では ビショップ・ナイト・クイーンが ななめに ならんで いる。' },
        { t: 'p', en: 'This knight can move. It just should not.',
          ja: 'ただし さっきとは ちがう。この ナイトは **うごける**。ルールは 止めない。ためしに 7とおり うごかせる。でも、どこへ うごいても、そのあと ビショップが クイーンを とって しまう。' },
        { t: 'p', en: 'So it is stuck for a different reason.',
          ja: 'つまり この ナイトは「うごけない」のでは なく「うごいたら そんする」。けっきょく うごけない のは 同じだけど、りゆうが ちがう。あいてが うっかり うごかして くれる ことも ある。' },
        { t: 'key',
          en: 'King behind: cannot move. Anything else behind: should not move.',
          ja: 'うしろが キングなら「うごけない」。ほかの こまなら「うごくと そんする」。' }
      ],
      task: { en: 'Press the knight that can move but must not.',
              ja: 'うごく ことは できる のに、うごいたら クイーンを とられて しまう こまが ある。おそう。' },
      goal: { kind: 'squares', ask: ['f6'], ordered: false }
    },

    {
      chapter: 2,
      en: 'The skewer',
      ja: 'スキュア',
      fen: '5q2/pp2k3/8/8/8/8/P6P/2B1K3 w - - 0 1',
      body: [
        { t: 'p', en: 'A skewer is a pin turned around.',
          ja: 'スキュアは ピンの うらがえし。ピンは、ねうちの 高い こまが **うしろ**に いた。スキュアは 高い こまが **まえ**に いる。' },
        { t: 'pairs', items: [
          { en: 'pin',    ja: 'ピン（釘付け）',   sym: 'うしろが 高い' },
          { en: 'skewer', ja: 'スキュア（串刺し）', sym: 'まえが 高い' }
        ] },
        { t: 'p', en: 'Attack the front one, and it has to move.',
          ja: 'まえの こまを ねらうと、それは うごくしか ない。とくに それが キングなら、王手に なるので ぜったいに うごく。そして どいた あと、うしろに いた こまが むき出しに なる。' },
        { t: 'p', en: 'Pin holds it still. Skewer makes it move.',
          ja: 'ピンは「うごかせない」ので つよい。スキュアは「うごかせる」ので つよい。まるで 反対だけど、どちらも 1本の 線に 2つ ならんで いる ことを つかって いる。' },
        { t: 'key',
          en: 'Pin holds it. Skewer moves it out of the way.',
          ja: 'ピンは とめる。スキュアは どかす。' }
      ],
      task: { en: 'Check the king with your bishop, then take what was behind it.',
              ja: 'ビショップで 王手を かけよう。キングが どいた あと、うしろに いる クイーンが とれる。' },
      goal: { kind: 'moves', win: { answer: 'Ba3+' } }
    }

  ]
};
