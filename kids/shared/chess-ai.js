// ================================================================
// chess-ai.js – 先を読む相手（「あそぶ」タブのコンピュータ）
// ================================================================
//
// /kids/chess-play/ だけが読み込む。巻のページは読み込まない。
//
// ★ chess-cpu.js と、どう使い分けるか ★
//   chess-cpu.js  決まりごとだけ。先を読まない。1巻のおまけが使う
//   chess-ai.js   先を読む。「あそぶ」タブが使う（これ）
//
//   2本あるのは、求めているものが違うからである。
//   1巻のおまけは「駒の動きを覚える練習台」で、こちらが仕掛ければ
//   駒が取れる相手でなければならない。実際あちらは14手に1回ほど
//   タダで駒を渡すが、あの回は「まもられて いない こまは とられる」を
//   教える回なので、それで用が足りている。強くすると教材として壊れる。
//
//   「あそぶ」は設計メモが冒頭に「レッスンではなく、実際に指して遊ぶ場所」
//   と書いている場所で、ここは手応えがある方がよい。
//
//   どちらを使うかはページが決める。chess-play/index.html だけが
//   このファイルを読み込み、chess-lessons.js は window.ChessAi が
//   あればそちらを使う。巻のページは読み込まないので、
//   1巻のおまけは今までどおり決まりごとの相手のままである。
//
// ★ ここにチェスのルールを書かない ★
//   合法手も、指した後の盤も、chess.js が返したものしか使わない。
//   読む速さのために手を自前で作ると、ルールが2か所になる。
//
// ★ どのくらい読むか ★
//   反復深化（iterative deepening）。1手先から順に深くしていき、
//   時間が来たら、最後に読み終わった深さの答えを使う。
//
//   深さを固定しないのは、端末の速さが10倍ちがうため。
//   固定すると、速い端末では余らせ、安い端末では固まる。
//   時間で区切れば、速い端末ほど深く読むという形に自然に収まる。
//
//     PC              4手     130ms
//     中位のスマホ     3〜4手  〜600ms
//     安い端末        3手     270ms
//
//   BUDGET を 600ms にしてあるのは、探索のあいだページが
//   固まるためである（JavaScript は1本道なので、考えている間は
//   指もスクロールも効かない）。待たせるのと固めるのは別物で、
//   待つ時間そのものは呼ぶ側が1.5秒に揃えている。
//   ここを伸ばすと、伸ばした分がそのまま「固まる時間」になる。
//
// ★ 何を良しとするか ★
//   駒のねうち（これが大半）＋ マスの良し悪し ＋ 少しの気まぐれ。
//   キングの安全や、ポーンの形の善し悪しは見ていない。
//   そこまで入れると、強さは上がるが、なぜその手なのかを
//   人が読んで追えなくなる。このサイトはそこを捨てない。
//
// ★ 取り合いの先だけは、深さを使い切った後も読む（静止探索）★
//   深さで打ち切ると「最後の1手でクイーンを取った」ところで数え終わり、
//   次に取り返されるのが見えない。取る手だけはその先を読み切る。
//   これを入れないと、読んでいるのに大駒を捨てる手を選ぶ。
//
// ★ 毎局おなじにならないように ★
//   いちばん良い手と僅差の手が複数あれば、その中から乱数で選ぶ。
//   chess-cpu.js と同じ考え方。検証では rng を差し替えて固定できる。
//
// DOM に触らない。画面のことは何も知らない。
// ================================================================

(function (root) {
  'use strict';

  var C = root.Chess;

  // 考えてよい上限。ここを超えた深さには進まない（上の★を読むこと）
  var BUDGET = 600;
  var MAX_DEPTH = 5;

  // 駒のねうち。1ポーン＝100 で数える。
  // chess.js の VALUE（1・3・5・9）と同じ比だが、こちらは
  // マスの良し悪しを足すので、1より細かい目盛りが要る
  var VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

  // マスの良し悪し。白から見た値で、盤の並び（0=a8 … 63=h1）のまま書く。
  // 黒は上下をひっくり返して使う。
  //
  // 中身は「中央に効く駒は良い」「ポーンは進むほど良い」
  // 「ナイトは隅がいちばん悪い」という、よく知られた目安をなぞったもの。
  // ここを細かくすると強くなるが、読んで分かる範囲に留めている。
  var PST = {
    P: [ 0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
         5,  5, 10, 25, 25, 10,  5,  5,
         0,  0,  0, 20, 20,  0,  0,  0,
         5, -5,-10,  0,  0,-10, -5,  5,
         5, 10, 10,-20,-20, 10, 10,  5,
         0,  0,  0,  0,  0,  0,  0,  0],
    N: [-50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50],
    B: [-20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20],
    R: [  0,  0,  0,  0,  0,  0,  0,  0,
          5, 10, 10, 10, 10, 10, 10,  5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
          0,  0,  0,  5,  5,  0,  0,  0],
    Q: [-20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
         -5,  0,  5,  5,  5,  5,  0, -5,
          0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20],
    // キングは、駒が多いうちは隅に隠れている方が良い。
    // 終盤は逆に中央へ出た方が良いが、そこは見ていない
    K: [-30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
         20, 20,  0,  0,  0,  0, 20, 20,
         20, 30, 10,  0,  0, 10, 30, 20]
  };

  var MATE = 100000;

  // これ以内の差は「同じくらい良い手」とみなす。5分の1ポーン。
  // 毎局おなじ展開にしないために、この中から乱数で選ぶ。
  // ゆるめると、見えていて損な手まで混ざる
  var TIE = 20;

  // 局面の点数。me から見た点。me が良ければ正。
  //
  // 持つ色を引数にしているのは、黒固定にすると
  // 「白を持たせたら点だけ裏返る」という壊れ方をするため。
  // いまは黒しか持たないが、裏返った点は詰み以外のすべてを
  // 逆向きにするので、気づきにくい不具合になる。
  function evaluate(pos, me) {
    var score = 0;
    for (var i = 0; i < 64; i++) {
      var p = pos.board[i];
      if (!p) continue;
      var t = C.typeOf(p);
      var white = C.colorOf(p) === 'w';
      // 盤の並びは 0 が a8。白の表は上下をひっくり返して引く
      var v = VALUE[t] + PST[t][white ? (56 - (i & 56)) + (i & 7) : i];
      score += (C.colorOf(p) === me) ? v : -v;
    }
    return score;
  }

  // 取る手だけを、読み切るまで続ける（静止探索）。
  // 深さで打ち切ると取り返しが見えないので、そこだけ先を見る
  function quiesce(pos, alpha, beta, me) {
    var stand = evaluate(pos, me);
    if (pos.turn === me) {
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
    } else {
      if (stand <= alpha) return alpha;
      if (stand < beta) beta = stand;
    }

    var moves = C.legalMoves(pos);
    var caps = [];
    for (var i = 0; i < moves.length; i++) {
      if (!moves[i].captured) continue;
      // 明らかに損な取り方は読まない。読む枝を減らすのが目的で、
      // 損得の判定は chess.js の交換評価にそのまま任せる
      if (C.exchangeOf(pos, moves[i]) < 0) continue;
      caps.push(moves[i]);
    }
    if (!caps.length) return pos.turn === me ? alpha : beta;
    caps.sort(function (a, b) { return VALUE[C.typeOf(b.captured)] - VALUE[C.typeOf(a.captured)]; });

    for (var k = 0; k < caps.length; k++) {
      var sc = quiesce(C.step(pos, caps[k]), alpha, beta, me);
      if (pos.turn === me) {
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      } else {
        if (sc <= alpha) return alpha;
        if (sc < beta) beta = sc;
      }
    }
    return pos.turn === me ? alpha : beta;
  }

  // 本体。me から見た点を返す。deadline を過ぎたら null を返して打ち切る
  function search(pos, depth, alpha, beta, me, deadline) {
    if (Date.now() > deadline) return null;

    var moves = C.legalMoves(pos);
    if (!moves.length) {
      // 指す手が無い。チェックされていれば詰み、されていなければ引き分け
      if (!C.inCheck(pos, pos.turn)) return 0;
      // 近い詰みほど良い点にする。でないと詰ませられるのに引き延ばす。
      //
      // ★ depth は「ここから先、あと何手読むか」の残りである ★
      //   根に近いほど残りは大きい。だから近い詰みを重く見るには
      //   depth を足す。引くと逆になり、遠い詰みのほうが良い点になって、
      //   詰ませられるのに詰まさず、詰まされる筋を選ぶようになる。
      //   浅く読むうちは詰みがそもそも見えないので表に出ないが、
      //   深く読めるようにした途端に効いてくる種類の間違いである。
      return pos.turn === me ? -(MATE + depth) : (MATE + depth);
    }
    if (depth <= 0) return quiesce(pos, alpha, beta, me);

    // 読む順。取る手を先に見ると、早く枝を落とせる
    moves.sort(function (a, b) {
      var av = a.captured ? VALUE[C.typeOf(a.captured)] - VALUE[C.typeOf(a.piece)] / 10 : -1;
      var bv = b.captured ? VALUE[C.typeOf(b.captured)] - VALUE[C.typeOf(b.piece)] / 10 : -1;
      return bv - av;
    });

    var mine = pos.turn === me;
    var best = mine ? -Infinity : Infinity;
    for (var i = 0; i < moves.length; i++) {
      var sc = search(C.step(pos, moves[i]), depth - 1, alpha, beta, me, deadline);
      if (sc === null) return null;
      if (mine) {
        if (sc > best) best = sc;
        if (best > alpha) alpha = best;
      } else {
        if (sc < best) best = sc;
        if (best < beta) beta = best;
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  function pick(list, rng) {
    return list[Math.floor((rng || Math.random)() * list.length)];
  }

  // 黒の手を選ぶ。
  //   pos       いまの局面（黒の手番）
  //   lastMove  使わない。chess-cpu.js と呼び方を揃えるためだけに受け取る
  //   rng       検証で差し替えるため
  // 返り値 … { move, depth, score, ms }。合法手が無ければ null
  function choose(pos, lastMove, rng) {
    var root = C.legalMoves(pos);
    if (!root.length) return null;
    if (root.length === 1) return { move: root[0], depth: 0, score: 0, ms: 0 };

    var me = pos.turn;
    var t0 = Date.now();
    var deadline = t0 + BUDGET;
    var bestMove = root[0], bestScore = 0, reached = 0;

    for (var depth = 1; depth <= MAX_DEPTH; depth++) {
      var scored = [], cut = false;
      // ここでも alpha を持ち越す。手ごとに窓を開け直すと、
      // いちばん大事な場所（最初の分かれ道）だけ枝刈りが効かず、
      // 同じ深さを読むのに倍以上の時間がかかる。
      // 下限を best より TIE だけ低くしてあるので、
      // 僅差で並ぶ手の点はそのまま残り、下の tie 選びは変わらない
      var ra = -Infinity;
      for (var i = 0; i < root.length; i++) {
        var sc = search(C.step(pos, root[i]), depth - 1, ra, Infinity, me, deadline);
        if (sc === null) { cut = true; break; }
        scored.push({ move: root[i], score: sc });
        // 窓を切った手は「これ以下」としか分からない値が返る。
        // その値が同点の線とちょうど重なると、読み切っていない手が
        // 同点集合に紛れ込む。1だけ下げて、必ず線の外に落とす
        if (sc - TIE - 1 > ra) ra = sc - TIE - 1;
      }
      // 時間切れで読み終わらなかった深さは捨てる。
      // 途中までの並びで決めると、まだ読んでいない手が
      // 「悪い手」として扱われ、浅く読んだときより弱くなる
      if (cut) break;

      scored.sort(function (a, b) { return b.score - a.score; });
      bestScore = scored[0].score;
      // 僅差は同じ価値とみなし、その中から選ぶ（TIE の説明は上）
      var tie = [];
      for (var k = 0; k < scored.length; k++) {
        if (scored[k].score >= bestScore - TIE) tie.push(scored[k].move);
      }
      bestMove = pick(tie, rng);
      reached = depth;

      // 詰みが見えたら、それ以上depthを伸ばしても意味がない
      if (bestScore >= MATE - 100) break;
      // 次の深さに入るだけの時間が残っていない。
      // 入っても読み終わらず捨てることになるので、ここで止める
      if (Date.now() - t0 > BUDGET / 3) break;
    }

    return { move: bestMove, depth: reached, score: bestScore, ms: Date.now() - t0 };
  }

  root.ChessAi = {
    choose: choose,
    evaluate: evaluate,
    BUDGET: BUDGET
  };

})(typeof window !== 'undefined' ? window : globalThis);
