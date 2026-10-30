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
    { en: 'Value and trades', ja: 'ねうちと とりかえ' }
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
    }

  ]
};
