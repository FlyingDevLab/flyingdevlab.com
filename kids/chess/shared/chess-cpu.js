// ================================================================
// chess-cpu.js – 黒を動かす相手（1巻のおまけ「コンピュータと さす」）
// ================================================================
//
// 先を読まない。局面の良し悪しを点数にもしない。
// 上から順に「当てはまったら、それを指す」だけの決まりごと。
// 白（自分）をこちらから攻めに来ないので、駒の動きを覚える練習台になる。
//
//   1. 取り返す  白が直前に取ったマスに、黒の利きがあれば取り返す。
//                損得は一切見ない（クイーンでポーンを取り返して大損してもよい）
//   2. ただ取り  白の駒で、守られていないものを取れるなら取る。
//                取れるものが複数あれば、ねうちの大きいほう
//   3. 守る      取られそうな黒の駒（白に狙われ、黒が守っていない）があれば、
//                逃がすか、守りを足す。手を指した後に取られそうな駒が
//                減る（ねうちの合計が小さくなる）手だけを選ぶ
//   4. それ以外  黒の陣地（5〜8段）に留まる。白に狙われているマスへは入らない
//
// 各規則の中で候補が複数あれば、乱数で1つ選ぶ。毎局おなじ展開にならない。
// 検証では rng を差し替えて固定できる。
//
// ★ 規則に当てはまる手が無いときは、順に落とす ★
//   規則4は「陣地の中で、安全なマス」→「どこでも安全なマス」→「合法手なら何でも」。
//   黒が何も指せずに止まることはない（合法手が1つでもあれば必ず返す）。
//
// ★ 守っている／狙われている、の意味 ★
//   chess.js の attackedBy を使うだけ。ピンされた駒の利きも「利き」として数える。
//   ピンの正確な判定までは要らない決まりごとなので、そこは追わない。
//
// ★ ルールを書かない ★
//   合法手は chess.js の legalMoves が返したものだけを使う。
//   チェックされているときの応手も、そこで既に絞り込まれている。
//
// DOM に触らない。画面のことは何も知らない。
// ================================================================

(function (root) {
  'use strict';

  var C = root.Chess;

  // 黒の陣地。5段目から8段目（盤の黒がわ半分）
  var HOME_MIN_RANK = 5;

  function pick(list, rng) {
    return list[Math.floor((rng || Math.random)() * list.length)];
  }

  // 黒の駒のうち、白に狙われていて、黒が守っていないもの
  // （キングは数えない。キングへの攻撃は「チェック」で、合法手が既に解決している）
  function hanging(pos) {
    var out = [];
    for (var i = 0; i < 64; i++) {
      var p = pos.board[i];
      if (!p || C.colorOf(p) !== 'b' || C.typeOf(p) === 'K') continue;
      if (C.attackedBy(pos, i, 'w') && !C.attackedBy(pos, i, 'b')) out.push(i);
    }
    return out;
  }

  function hangingValue(pos) {
    var sum = 0;
    var list = hanging(pos);
    for (var i = 0; i < list.length; i++) sum += C.valueOf(pos.board[list[i]]);
    return sum;
  }

  // lastMove … 白が直前に指した手（chess.js の手）。無ければ null
  // 返り値 … { move, rule }。合法手が無ければ null。rule は 1〜4 と、落とした先の '4b' '4c'
  function choose(pos, lastMove, rng) {
    var legal = C.legalMoves(pos, 'b');
    if (!legal.length) return null;
    var i, m, c;

    // 1. 取り返す
    if (lastMove && lastMove.captured) {
      c = [];
      for (i = 0; i < legal.length; i++) {
        if (legal[i].captured && legal[i].capturedAt === lastMove.to) c.push(legal[i]);
      }
      if (c.length) return { move: pick(c, rng), rule: 1 };
    }

    // 2. ただ取り
    var best = 0;
    c = [];
    for (i = 0; i < legal.length; i++) {
      m = legal[i];
      if (!m.captured) continue;
      var next = C.apply(pos, m);
      // 取ったあと、その駒が白に取り返されるなら「守られていた」
      if (C.attackedBy(next, m.to, 'w')) continue;
      var v = C.valueOf(m.captured);
      if (v > best) { best = v; c = [m]; }
      else if (v === best) c.push(m);
    }
    if (c.length) return { move: pick(c, rng), rule: 2 };

    // 3. 守る
    var before = hangingValue(pos);
    if (before > 0) {
      var low = before;
      c = [];
      for (i = 0; i < legal.length; i++) {
        var after = hangingValue(C.apply(pos, legal[i]));
        if (after >= before) continue;
        if (after < low) { low = after; c = [legal[i]]; }
        else if (after === low) c.push(legal[i]);
      }
      if (c.length) return { move: pick(c, rng), rule: 3 };
    }

    // 4. それ以外。安全なマスだけ、できれば陣地の中だけ
    var safe = [], home = [];
    for (i = 0; i < legal.length; i++) {
      m = legal[i];
      if (C.attackedBy(C.apply(pos, m), m.to, 'w')) continue;
      safe.push(m);
      if (C.rankOf(m.to) >= HOME_MIN_RANK) home.push(m);
    }
    if (home.length) return { move: pick(home, rng), rule: 4 };
    if (safe.length) return { move: pick(safe, rng), rule: '4b' };
    return { move: pick(legal, rng), rule: '4c' };
  }

  root.ChessCpu = {
    choose: choose,
    hanging: hanging,
    hangingValue: hangingValue
  };

})(typeof window !== 'undefined' ? window : globalThis);
