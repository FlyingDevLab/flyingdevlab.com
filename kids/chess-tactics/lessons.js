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
    { no: 2, en: 'Tactics', ja: 'せんじゅつ', url: '/kids/chess-tactics/' },
    { no: 3, en: 'Openings', ja: 'じょばん', url: '/kids/chess-openings/' },
    { no: 'play', en: 'Play', ja: 'あそぶ', url: '/kids/chess-play/', tab: true }
  ],

  chapters: [
    { en: 'Value and trades', ja: 'ねうちと とりかえ' },
    { en: 'Two at once',      ja: 'ふたつ いっぺんに' },
    { en: 'Stuck on a line',  ja: 'うごけなく する' },
    { en: 'Hidden attacks',   ja: 'かくれた ねらい' },
    { en: 'Mating patterns',  ja: '詰みの かたち' },
    { en: 'Giving a piece up', ja: 'すてる' },
    { en: 'Spot it yourself',  ja: '見分ける' },
    { en: 'More puzzles',      ja: 'おまけ' }
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
    },

    // ===== 4章 かくれた ねらい ========================================
    //
    // 1つめは「見つける」回にしてある。3章のピンと同じ理由。
    // ただのディスカバードアタックで駒得する問題を作ろうとすると、
    // 相手が1手で両方を受けられる盤になりやすい（実際そうなった。
    // ナイトでクイーンをねらい、ルークでビショップをねらう盤を
    // 組んだが、Qe7 の1手でクイーンが逃げながらビショップを守った）。
    // この章で先に分かってほしいのは「うしろの線がひらく」ことなので、
    // 見つける回にした。王手がからむ2つは駒得で証明できる。

    {
      chapter: 3,
      en: 'The attack behind your own piece',
      ja: 'かくれた ねらい',
      fen: '6k1/pp1b2pp/8/8/3N4/8/PP4PP/3RK3 w - - 0 1',
      body: [
        { t: 'p', en: 'Your rook is aiming down the d-file, but your own knight is in the way.',
          ja: 'd1 の ルークは d の れつを ねらって いる。でも その 線の 上に、みかたの ナイトが 立って いる。だから いまは 何も ねらえて いない。' },
        { t: 'pairs', items: [
          { en: 'discovered attack', ja: 'ディスカバードアタック（開き攻撃）', sym: '' }
        ] },
        { t: 'p', en: 'Move the knight, and the line opens by itself.',
          ja: 'ナイトを どかすと、ふさいで いた 線が ひらく。ナイトが どこへ うごいても ひらく。これが かくれた ねらい。あいては ナイトの ほうを 見て いるので、うしろから 出て くる 線に 気づきにくい。' },
        { t: 'p', en: 'And the knight itself can attack something as it leaves.',
          ja: 'こわいのは、どく ナイトが そのとき べつの ところを ねらえる こと。1手で 2か所を ねらえる ことに なる。フォークと にて いるけど、ねらって いるのが 2まいの こま、というのが ちがう。' },
        { t: 'key',
          en: 'Look behind your own pieces. Moving one opens a line.',
          ja: 'じぶんの こまの うしろを 見る。どければ 線が ひらく。' }
      ],
      task: { en: 'Which black piece gets attacked the moment the knight moves?',
              ja: 'ナイトが どいた とたんに ねらわれる 黒の こまが ある。どれか おそう。' },
      goal: { kind: 'squares', ask: ['d7'], ordered: false }
    },

    {
      chapter: 3,
      en: 'Discovered check',
      ja: 'ディスカバードチェック',
      fen: '3k4/pp4pp/8/5q2/3N4/8/PP4PP/3RK3 w - - 0 1',
      body: [
        { t: 'p', en: 'When the line that opens hits the king, it is a discovered check.',
          ja: 'ひらいた 線が、あいての キングに 当たる ことが ある。これが ディスカバードチェック（開き王手）。この 盤では、ナイトが どけば ルークが キングに 当たる。' },
        { t: 'pairs', items: [
          { en: 'discovered check', ja: 'ディスカバードチェック（開き王手）', sym: '+' }
        ] },
        { t: 'p', en: 'A check cannot be ignored. So the moving piece can do anything.',
          ja: 'ここが つよい。王手は ほうって おけない。あいては 王手を 外す ことで せいいっぱいで、どいた ナイトの ことを かまって いられない。だから ナイトは、どこへ うごいても いい。' },
        { t: 'p', en: 'Even taking a well-guarded piece.',
          ja: 'まもられて いる こまを とっても いい。取り返す ひまが ないから。ふつうなら 損な 手が、開き王手の あいだだけ ただの 得に なる。' },
        { t: 'key',
          en: 'During a discovered check, the moving piece can do anything.',
          ja: '開き王手の あいだ、どいた こまは 何を しても いい。' }
      ],
      task: { en: 'Take the queen with your knight, opening the rook\u2019s check.',
              ja: 'ナイトで クイーンを とろう。同時に ルークの 王手が ひらく。' },
      goal: { kind: 'moves', win: { answer: 'Nxf5+' } }
    },

    {
      chapter: 3,
      en: 'Double check',
      ja: 'ダブルチェック',
      fen: '3k4/1p2p1pp/2q5/8/3N4/8/PP4PP/3RK3 w - - 0 1',
      goals: ['c6'],
      body: [
        { t: 'p', en: 'Sometimes the moving piece gives check too. Two checks at once.',
          ja: 'どいた こまも、そのとき 王手を かける ことが ある。2まいから 同時に 王手。これが ダブルチェック。開き王手の いちばん つよい かたち。' },
        { t: 'pairs', items: [
          { en: 'double check', ja: 'ダブルチェック（両王手）', sym: '++' }
        ] },
        { t: 'p', en: 'Remember the three ways out of check.',
          ja: '1巻で ならった、王手から にげる 3つの ほうほうを 思い出して。あいだに 入る・ねらって いる こまを とる・キングが にげる。この 3つ しか ない。' },
        { t: 'p', en: 'Two of them stop working.',
          ja: 'ダブルチェックでは、はじめの 2つが きかない。あいだに 入っても、2本の 線を いっぺんには ふさげない。とろうとしても、1手で 2まいは とれない。のこるのは キングが にげる だけ。' },
        { t: 'p', en: 'So a guarded piece can be taken for free.',
          ja: 'この 盤の クイーンは b7 の ポーンに まもられて いる。ふつうなら とっても 取り返される。でも ダブルチェックなら、取り返す 手が そもそも 指せない。' },
        { t: 'key',
          en: 'Double check leaves only one answer: the king must move.',
          ja: 'ダブルチェックは、キングが にげる しか ない。' }
      ],
      task: { en: 'Take the queen. The pawn guards it, but it cannot take back.',
              ja: 'ナイトで クイーンを とろう。b7 の ポーンが まもって いるけど、取り返せない。' },
      goal: { kind: 'moves', win: { answer: 'Nxc6+' } }
    },

    // ===== 5章 詰みの かたち ==========================================
    //
    // 6章（すてる）の下じきになる章。捨て駒は「捨てたあと どうなるか」が
    // 見えていないと、ただ捨てるだけになる。先に詰みの形を2つ知っておく。
    // どちらも1手で詰む手が盤に1つしか無いことを確かめてある。

    {
      chapter: 4,
      en: 'Back-rank mate',
      ja: 'バックランクメイト',
      fen: '6k1/5ppp/8/8/8/8/1B3PPP/3R2K1 w - - 0 1',
      body: [
        { t: 'p', en: 'The pawns in front of the king protect it — and trap it.',
          ja: 'キングの 前に ポーンが 3まい ならんで いる。まもって くれて いるけど、同時に にげ道を ふさいで いる。キングは 前に 出られない。' },
        { t: 'pairs', items: [
          { en: 'back-rank mate', ja: 'バックランクメイト（下段の詰み）', sym: '#' }
        ] },
        { t: 'p', en: 'A rook on the back rank covers the whole row.',
          ja: 'そこへ ルークが いちばん 下の だんに 入ると、その だん ぜんぶを よこ一列 ねらう ことに なる。キングは 前にも 出られず、よこにも にげられない。これで 詰み。' },
        { t: 'p', en: 'Your own king has exactly the same weakness.',
          ja: 'この 盤を よく 見て。白の キングも まったく 同じ かたちを して いる。g1 の キングの 前に f2・g2・h2 の ポーン。黒に ルークが あったら、同じ ことを やられて いた。' },
        { t: 'key',
          en: 'Make a hole for your king before someone makes one for you.',
          ja: 'じぶんの ポーンが にげ道を ふさぐ。1マス 空けて おくと あんしん。' }
      ],
      task: { en: 'Mate in one.',
              ja: '1手で 詰ませよう。' },
      goal: { kind: 'moves', win: { answer: 'Rd8#' } }
    },

    {
      chapter: 4,
      en: 'Smothered mate',
      ja: 'スマザードメイト',
      fen: '6rk/6pp/8/q3N3/8/8/PP4P1/6K1 w - - 0 1',
      body: [
        { t: 'p', en: 'This black king is walled in by its own pieces.',
          ja: 'こんどは キングの まわりが ぜんぶ じぶんの こまで うまって いる。g8 に ルーク、g7 と h7 に ポーン。どこへも にげられない。' },
        { t: 'pairs', items: [
          { en: 'smothered mate', ja: 'スマザードメイト（窒息詰め）', sym: '#' }
        ] },
        { t: 'p', en: 'Only the knight can reach a king like that.',
          ja: 'ふつうの こまは、まわりが うまって いる キングに とどかない。線が ふさがれて いるから。でも ナイトだけは とびこえられる。1巻で ならった とおり。' },
        { t: 'p', en: 'Walled in means nowhere to run.',
          ja: 'そして まわりが うまって いる ことが、そのまま 詰みに なる。王手を かけられても、にげる マスが 1つも ない。じぶんの こまに かこまれて いる から。' },
        { t: 'key',
          en: 'The knight jumps, so a walled-in king is not safe at all.',
          ja: 'ナイトは とびこえる。かこまれた キングほど あぶない。' }
      ],
      task: { en: 'Mate in one with the knight.',
              ja: 'ナイトで 1手で 詰ませよう。' },
      goal: { kind: 'moves', win: { answer: 'Nf7#' } }
    },

    // ===== 6章 すてる ==================================================
    //
    // 捨て駒の目的を3つに分けてある。詰ますため・おびき出すため・そらすため。
    // 最初に「詰ますため」を置くのは、いちばん理由がはっきりしているから。
    // 詰んだら そこで終わるので、残った駒の数に意味が無くなる。
    //
    // 3つめ（そらす）だけ見分ける回にしてある。そらす手で駒得する盤を
    // 作ろうとすると、相手にほかの受けができたり、盤に別のねらいが
    // 混ざったりした。実際、ルークをそらす盤を組んだつもりが、
    // 相手のバックランクが弱くて Qxc6 がそのまま通る盤になっていた。
    // この回で分かってほしいのは「仕事をしている こまを見つける」ことなので、
    // 見分ける回にした。

    {
      chapter: 5,
      en: 'Sacrifice for mate',
      ja: '詰ますための サクリファイス',
      fen: '5r1k/6pp/7N/8/8/1Q6/5PPP/6K1 w - - 0 1',
      body: [
        { t: 'p', en: 'Sometimes you give away your strongest piece on purpose.',
          ja: 'いちばん つよい クイーンを、わざと とらせる ことが ある。ふつうなら とんでもない そんだけど、そのあと 詰むなら 話は べつ。' },
        { t: 'pairs', items: [
          { en: 'sacrifice', ja: 'サクリファイス（捨て駒）', sym: '' }
        ] },
        { t: 'p', en: 'Once it is mate, the pieces left do not matter.',
          ja: '詰んだら そこで しょうぶは おわる。のこった こまを 数える ばめんが 来ない。だから「9の クイーンを すてて 詰ます」は、ちゃんと 得な 手。' },
        { t: 'p', en: 'Look at who is guarding g8.',
          ja: 'この 盤を 見て。h6 の ナイトが g8 を まもって いる。だから クイーンが g8 に 入っても、キングは とれない。とれるのは f8 の ルークだけ。' },
        { t: 'p', en: 'And when the rook takes, it blocks the king in.',
          ja: 'そして ルークが g8 に 来ると、キングの にげ道が ふさがる。まわりが じぶんの こまで うまる。前の 回で ならった あの かたちに なる。' },
        { t: 'key',
          en: 'If it is mate, the value of the piece does not matter.',
          ja: '詰むなら、こまの ねうちは かんけい ない。' }
      ],
      task: { en: 'Give up the queen so the knight can mate.',
              ja: 'クイーンを すてて、ナイトで 詰ませよう。2手で 詰む。' },
      goal: { kind: 'moves', win: { answer: 'Qg8+' } }
    },

    {
      chapter: 5,
      en: 'Decoy',
      ja: 'おびき出す',
      fen: '7k/2q3pp/8/4N3/8/8/5PPP/3R2K1 w - - 0 1',
      body: [
        { t: 'p', en: 'The second reason to give a piece up: to drag an enemy piece somewhere.',
          ja: 'すてる りゆうは もう1つ ある。あいての こまを、行かせたい マスへ ひっぱり出す ため。これを おびき出すと いう。' },
        { t: 'pairs', items: [
          { en: 'decoy', ja: 'おびき出す', sym: '' }
        ] },
        { t: 'p', en: 'Give it something it has no choice but to take.',
          ja: 'こつは「とるしか ない」かたちに する こと。王手を かければ、あいては それを 外す ことしか できない。外す ほうほうが 1つだけなら、そこへ 行かせる ことが できる。' },
        { t: 'p', en: 'And d8 happens to be a forking square.',
          ja: 'この 盤で ルークを d8 に すてると、クイーンは とるしか なくなる。そして d8 という マスは、e5 の ナイトから 見ると、キングと いっしょに ねらえる マス。前に ならった フォークが 待って いる。' },
        { t: 'key',
          en: 'Throw it where you want them to go.',
          ja: 'とらせたい マスへ、わざと すてる。' }
      ],
      task: { en: 'Sacrifice the rook to pull the queen onto a forking square.',
              ja: 'ルークを すてて、クイーンを ナイトの フォークに かかる マスへ ひっぱり出そう。' },
      goal: { kind: 'moves', win: { answer: 'Rd8+' } }
    },

    {
      chapter: 5,
      en: 'Deflection',
      ja: 'そらす',
      fen: '2r3k1/5pp1/2b4p/8/Q7/8/5PPP/3R2K1 w - - 0 1',
      goals: ['c6'],
      body: [
        { t: 'p', en: 'The opposite of a decoy: drive a piece away from its job.',
          ja: 'おびき出すの 反対が、そらす。あっちは「来させる」、こっちは「どかせる」。' },
        { t: 'pairs', items: [
          { en: 'decoy',      ja: 'おびき出す', sym: '来させる' },
          { en: 'deflection', ja: 'そらす',     sym: 'どかせる' }
        ] },
        { t: 'p', en: 'Some pieces are doing a job.',
          ja: '盤の 上の こまには、仕事を して いる ものが ある。だれかを まもって いたり、だいじな マスを おさえて いたり。見た目は じっと して いるけど、いなく なったら こまる こま。' },
        { t: 'p', en: 'Give that piece something it must take.',
          ja: 'その こまに、どうしても 取らなければ ならない ものを 出す。こまは 仕事を はなれて 取りに 行く。そのとき、まもられて いた ほうが 落ちる。' },
        { t: 'p', en: 'First, learn to see the job.',
          ja: 'そらす 手を 見つける より さきに、「だれが 何を まもって いるか」が 見える ように なる ほうが 大事。この 回は それを さがす。' },
        { t: 'key',
          en: 'Find the piece doing a job, then make it leave.',
          ja: 'まもって いる こまを 見つけて、そこから どかせる。' }
      ],
      task: { en: 'The queen is eyeing one black piece. Press the piece that guards it.',
              ja: '白の クイーンが ねらって いる 黒の こまが 1つ ある。それを まもって いる こまは どれ？ おそう。' },
      goal: { kind: 'squares', ask: ['c8'], ordered: false }
    },

    // ===== 7章 見分ける ================================================
    //
    // ここまでは「これはフォークの回」と題が教えてくれていた。
    // 実際の盤には題が付いていない。この回だけ、何がひそんでいるかを
    // 言わない。ならった中から自分でえらぶ。

    {
      chapter: 6,
      en: 'No title this time',
      ja: 'なにが ひそんで いる？',
      fen: '1r4k1/5ppp/8/n7/8/8/3R1PPP/3R2K1 w - - 0 1',
      body: [
        { t: 'p', en: 'Until now the lesson title told you what to look for.',
          ja: 'ここまでは、回の 題が こたえを 半分 教えて くれて いた。「フォークの 回」と 書いて あれば、フォークを さがせば よかった。' },
        { t: 'p', en: 'A real board has no title.',
          ja: 'でも ほんとうの 対局に 題は ない。盤を 見て、ならった ものの 中から じぶんで えらぶ ことに なる。この 回は それを やってみる。' },
        { t: 'p', en: 'Two things you have learned fit together here.',
          ja: 'ヒントを 1つだけ。この 盤には、ならった わざが 2つ つながって いる。1つめで あいての こまを どかし、2つめで 詰ます。6章と 5章を 思い出して。' },
        { t: 'key',
          en: 'Look for the piece doing a job, then ask what happens if it leaves.',
          ja: '仕事を して いる こまを さがす。それが いなく なったら 何が おきる？' }
      ],
      task: { en: 'Find the move. It leads to mate in two.',
              ja: 'この 盤で いちばん いい 手を 見つけよう。2手で 詰む。' },
      // 詰むところまで指させる。最初の手だけで終えると、
      // 「なぜ詰むのか」が盤の上に出ないまま終わってしまう。
      //   answers … 白 黒 白 の順。黒の返し（Rxd8）は、それしか指せない手なので盤が指す。
      //   answer  … 最初の手。証明（check-v2）はここを見る
      //   notes   … 各手を指した直後に出す一言（answers と同じ並び）
      goal: { kind: 'moves', win: {
        answer: 'Rd8+',
        answers: ['Rd8+', 'Rxd8', 'Rxd8#'],
        notes: [
          { en: 'Rd8+ steps in with check. Black has exactly one legal move: take the rook.',
            ja: 'Rd8+。ルークが チェックで 入りこむ。黒が 指せる 手は 1つだけ。この ルークを とる しか ない。' },
          { en: 'Black\'s rook took on d8. It was pulled away from where it was. Now your other rook can take it.',
            ja: '黒の ルークが d8 に つられて 出て きた。もう1つの ルークで これを とれば、また チェック。' },
          { en: 'Checkmate! Black\'s own pawns on f7, g7 and h7 block the king\'s way out.',
            ja: 'チェックメイト！ f7・g7・h7 の 黒の ポーンが じゃまで、キングは 逃げられない。' }
        ]
      } }
    },

    // ===== おまけ ======================================================
    //
    // 題を付けない問題を4つ。くみあわせのボタンで選べる。
    // 1巻の「コンピュータと さす」と同じ位置づけで、レッスンではなく
    // 気がすむまで やる ところ。
    // こたえはボタンごとに持たせてある（goal.sets[].answer）。

    {
      chapter: 7,
      en: 'Four more, no titles',
      ja: 'まざった もんだい',
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      body: [
        { t: 'p', en: 'Four problems. Nobody tells you which trick it is.',
          ja: '題の ついて いない 問題が 4つ。どれも 1手。ならった ものの どれかが ひそんで いる。上の ボタンで えらべる。' },
        { t: 'p', en: 'Stuck? The hint shows which piece to move.',
          ja: 'わからなく なったら ヒントを おして。どの こまを うごかすかだけ 教えて くれる。行き先は 自分で さがす。' },
        { t: 'key',
          en: 'Ask three things: what can I take, what is undefended, what is lined up.',
          ja: 'なにが とれる？ まもられて いない こまは？ 1本の 線に 2つ ならんで いない？' }
      ],
      task: { en: 'Pick a problem and find the move.',
              ja: '問題を えらんで、いちばん いい 手を 見つけよう。' },
      goal: { kind: 'moves', moves: 1, win: {}, sets: [
        { en: 'Problem 1', ja: 'もんだい 1',
          fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', answer: 'Re8#' },
        { en: 'Problem 2', ja: 'もんだい 2',
          fen: '6k1/5ppp/8/3q1N2/8/8/PP4PP/6K1 w - - 0 1', answer: 'Ne7+' },
        { en: 'Problem 3', ja: 'もんだい 3',
          fen: '4k3/pp4pp/8/7n/8/8/PP4P1/4K2R w - - 0 1', answer: 'Rxh5' },
        { en: 'Problem 4', ja: 'もんだい 4',
          fen: '4k3/pp4pp/8/2q5/4N3/8/PP3PPP/4R1K1 w - - 0 1', answer: 'Nxc5+' }
      ] }
    }

  ]
};
