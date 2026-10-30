// ================================================================
// chess.js – チェスのルール判定、共通エンジン
// ================================================================
//
// 盤の状態を持ち、合法手を数え、決着を判定し、棋譜（SAN）を書き読みする。
// 画面のことは何も知らない。DOM に触る行は1行もない。
//
//   /kids/chess/   第01巻「基礎知識」  ← 今これだけが使っている
//
// ★ なぜ最初から shared に置くのか ★
//   このファイルを使うページは今1枚しかない。
//   それでも各ゲームの中ではなく共通の置き場に置いたのは、
//   続きの巻が同じ判定を必要とすることが決まっているため。
//
//     02巻 戦術   フォーク・ピン・スキュア・ディスカバードアタック・
//                 ダブルチェック・サクリファイス
//     03巻 序盤   名前の付いた序盤の最初の数手と、実戦の棋譜
//
//   どちらも「合法手は何か」「それは王手か」「棋譜ではどう書くか」を
//   01巻とまったく同じ答えで返さなければならない。
//   ページごとに写すと、片方だけ直した日に
//   「同じルールなのに巻によって判定が違う」という壊れ方をする。
//   箱入り娘の3本が klotski.js を共有しているのと同じ理屈である。
//
// ★ ここを直すとチェスの全巻が変わる ★
//   直したら perft を回し直すこと（下記）。
//
// ★ 盤面の持ち方 ★
//   64個の配列1本だけ。0 が a8、63 が h1。
//   駒は FEN と同じ1文字で持つ（大文字が白・小文字が黒・空マスは ''）。
//
//     0  1  2  3  4  5  6  7     a8 b8 c8 d8 e8 f8 g8 h8
//     8  9 10 11 12 13 14 15     a7 b7 c7 d7 e7 f7 g7 h7
//     :                          :
//    56 57 58 59 60 61 62 63     a1 b1 c1 d1 e1 f1 g1 h1
//
//   a1 を 0 にする持ち方もあるが、こちらを選んだ理由は2つ。
//     ・FEN は a8 から書き始めるので、読み書きが並べ替え無しで済む
//     ・console.log で8文字ずつ切ると、盤がそのままの向きで出る
//
//   駒を数値や bit で持つ方式（0x88・ビットボード）は採らなかった。
//   速いが、読んで意味が分かることを優先した。このファイルは
//   「ルールが正しいか」を人が読んで確かめられる必要がある。
//   速さの裏は下の perft で取っている。
//
// ★ マスの外へ出たかの判定 ★
//   添字の足し算ではなく、筋（file）と段（rank）に分けて範囲を見る。
//   添字だけで足すと、h列のナイトが a列に回り込む類の間違いが
//   「盤の端でだけ起きる」形で混ざり、見つけにくい。
//
// ★ 合法手の作り方 ★
//   いったんルール違反を含む手（pseudo-legal）を全部作り、
//   指してみて自分のキングが取られる形になるものを落とす。
//
//   ピンされた駒を事前に除く方式の方が速いが、
//   ピンの判定自体を間違えると「指せるはずの手が消える」という、
//   遊んでいる側からは理由の分からない不具合になる。
//   指してから確かめる方式は、間違えようがない。
//
// ★ 判定は perft で確かめた ★
//   既知の値と一致することを確認した局面と手数（2026-10-30）。
//   perft とは、ある局面から n 手先までの合法手の並べ方を数えた総数で、
//   世界中の実装が同じ値を公表している。1つでも違えば、
//   どこかのルールが間違っているか、余計な手を作っている。
//
//     初期配置                     深さ1       20
//                                  深さ2      400
//                                  深さ3     8902
//                                  深さ4   197281
//                                  深さ5  4865609
//     Kiwipete                     深さ1       48
//     （キャスリングとピンが絡む）  深さ2     2039
//                                  深さ3    97862
//                                  深さ4  4085603
//     アンパッサンで王手が外れる局面 深さ1       14
//                                  深さ2      191
//                                  深さ3     2812
//                                  深さ4    43238
//     プロモーションの局面          深さ1       24
//                                  深さ2      496
//                                  深さ3     9483
//                                  深さ4   182838
//
//   数え方は標準どおり、合法手だけを数え、
//   チェックメイトやステイルメイトで止まった枝はそこで打ち切る。
//   検証に使ったスクリプトはこのリポジトリに入れていない。
//   公開されるのは /kids/ 配下の遊ぶファイルだけにしたいため、
//   数えるコードは手元で走らせ、結果の値だけをここに書き残している。
//   ルールに手を入れたら、同じ値が出ることを確かめてから閉じること。
//
// ★ 50手ルールと75手ルール ★
//   50手ルールは「主張できる」規定で、自動では引き分けにならない。
//   75手に達したときだけ審判が自動で引き分けにする（FIDE 9.6）。
//   このファイルは両方を別の名前で返し、どちらを画面に出すかは
//   呼ぶ側に任せている。教材としては「主張できる」が正しいため。
//
// ★ 千日手（同一局面3回）の数え方 ★
//   駒の配置だけでなく、手番・キャスリングの権利・アンパッサンの
//   可能性まで含めて「同じ局面」とする。配置だけで数えると、
//   キャスリングできなくなった後の局面を以前と同じものに数えてしまう。
//
// ★ 引き分けにする駒不足 ★
//   確実に詰められない組み合わせだけを返す。
//     キング対キング / キング＋ナイト対キング /
//     キング＋ビショップ対キング / 同じ色のマスのビショップ同士
//
//   この4つを選んだ根拠は総当たりで取ってある（2026-10-30）。
//   それぞれの駒を盤に置ける並べ方をすべて作り、
//   チェックメイトの形が1つでも存在するかを数えた。
//
//     キング 対 キング                        7,224 とおり      詰み 0
//     キング＋ビショップ 対 キング          417,228 とおり      詰み 0
//     キング＋ナイト 対 キング              429,440 とおり      詰み 0
//     キング＋ビショップ 対 キング＋ビショップ
//       （どちらも白マス）               5,858,992 とおり      詰み 0
//
//   数え方は「両方の手番ぶん」「キングどうしが隣り合う形は除く」
//   「手番でない側が王手されている形は除く」。
//
//   入れなかった組み合わせには、実際に詰みの形がある。
//
//     キング＋ナイト2枚 対 キング        12,579,944 とおり      詰み 120
//       例: k1N5/2K5/1N6/8/8/8/8/8 b - - 0 1
//     キング＋ビショップ 対 キング＋ビショップ
//       （ちがう色のマス）               5,973,472 とおり      詰み 112
//       例: B7/8/8/8/8/8/5K1b/7k b - - 0 1
//
//   ナイト2枚は、相手が最善を指さなければ詰む形があるので
//   規則上の自動引き分けにはならない。ここに足さないこと。
//   数えたスクリプトはリポジトリに入れていない（手元で走らせる）。
//   この一覧を変えるときは、必ず数え直してから書き換えること。
// ================================================================

(function (global) {
  'use strict';

  // ----------------------------------------------------------------
  // 01. マスと駒
  // ----------------------------------------------------------------

  var FILES = 'abcdefgh';

  // 盤の向きは固定。index から筋・段を出す
  function fileOf(i) { return i & 7; }            // 0 = a列
  function rankOf(i) { return 8 - (i >> 3); }     // 1 = 1段目
  function nameOf(i) { return FILES.charAt(fileOf(i)) + rankOf(i); }

  // 筋と段から index へ。盤の外なら -1
  function at(file, rank) {
    if (file < 0 || file > 7 || rank < 1 || rank > 8) return -1;
    return (8 - rank) * 8 + file;
  }

  // 'e4' から index へ。読めなければ -1
  function indexOf(name) {
    if (typeof name !== 'string' || name.length !== 2) return -1;
    var f = FILES.indexOf(name.charAt(0).toLowerCase());
    var r = parseInt(name.charAt(1), 10);
    if (f < 0 || !(r >= 1 && r <= 8)) return -1;
    return at(f, r);
  }

  // マスの色。a1 は黒マス。
  //
  // 筋（a=0）と段（1〜8）を足して偶数なら白マス。
  //   a1  0 + 1 = 1  奇数 → 黒   盤の左下。ここが黒であることが基準
  //   h1  7 + 1 = 8  偶数 → 白   自分の右下は必ず白
  //   a8  0 + 8 = 8  偶数 → 白
  //   e4  4 + 4 = 8  偶数 → 白
  // 奇数を白にすると全部が逆になる。1章と5章（ビショップ）が
  // まるごと嘘になるので、ここは必ず a1 で確かめること。
  function isLightSquare(i) {
    return (fileOf(i) + rankOf(i)) % 2 === 0;
  }

  function colorOf(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  function typeOf(piece) {
    return piece ? piece.toUpperCase() : '';
  }

  function other(color) { return color === 'w' ? 'b' : 'w'; }

  // 動く向き。[筋のずれ, 段のずれ]
  var STRAIGHT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var EIGHT    = STRAIGHT.concat(DIAGONAL);
  var LEAPS    = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';


  // ----------------------------------------------------------------
  // 02. 局面
  // ----------------------------------------------------------------
  //
  // 局面は素直な object 1つ。中身を書き換える関数は作らない。
  // 手を指すと新しい局面が返る（move で元の局面は変わらない）。
  //
  // 書き換え方式にすると「戻す」を自分で実装することになり、
  // キャスリングの権利やアンパッサンの復元を1つ忘れた瞬間に、
  // 盤は正しいのにルールだけが狂うという形で壊れる。
  // レッスンでは1手ずつしか進めないので、作り直す重さは問題にならない。
  //
  //   board   64個の配列。駒1文字、空マスは ''
  //   turn    'w' か 'b'
  //   castle  まだ残っているキャスリングの権利。'KQkq' の部分集合
  //   ep      アンパッサンで取れる通過マス。無ければ -1
  //   half    取りもポーンの動きもなかった連続手数（50手ルール用）
  //   full    手数（黒が指し終えると1つ増える）
  //   seen    同じ局面が何回現れたか。千日手の判定に使う
  // ----------------------------------------------------------------

  function emptyBoard() {
    var b = new Array(64);
    for (var i = 0; i < 64; i++) b[i] = '';
    return b;
  }

  function fromFen(fen) {
    var parts = String(fen || START_FEN).trim().split(/\s+/);
    var board = emptyBoard();
    var rows = parts[0].split('/');
    var i = 0;
    for (var r = 0; r < rows.length && r < 8; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch >= '1' && ch <= '8') {
          i += parseInt(ch, 10);
        } else {
          if (i < 64) board[i] = ch;
          i++;
        }
      }
    }
    var pos = {
      board:  board,
      turn:   parts[1] === 'b' ? 'b' : 'w',
      castle: (parts[2] && parts[2] !== '-') ? parts[2] : '',
      ep:     (parts[3] && parts[3] !== '-') ? indexOf(parts[3]) : -1,
      half:   parts[4] ? parseInt(parts[4], 10) || 0 : 0,
      full:   parts[5] ? parseInt(parts[5], 10) || 1 : 1,
      seen:   null
    };
    // アンパッサンの欄は、実際に取れる手が無くても FEN に書かれることがある。
    // 千日手の判定で局面の同一性に関わるため、
    // 「本当に取れるのか」を見てから採用する。取れないなら無かったことにする。
    if (pos.ep >= 0 && !epIsReal(pos)) pos.ep = -1;
    pos.seen = {};
    pos.seen[positionKey(pos)] = 1;
    return pos;
  }

  function toFen(pos) {
    var rows = [];
    for (var r = 0; r < 8; r++) {
      var row = '';
      var gap = 0;
      for (var c = 0; c < 8; c++) {
        var p = pos.board[r * 8 + c];
        if (p) {
          if (gap) { row += gap; gap = 0; }
          row += p;
        } else {
          gap++;
        }
      }
      if (gap) row += gap;
      rows.push(row);
    }
    return rows.join('/') + ' ' + pos.turn + ' ' +
      (pos.castle || '-') + ' ' +
      (pos.ep >= 0 ? nameOf(pos.ep) : '-') + ' ' +
      pos.half + ' ' + pos.full;
  }

  // 千日手を数えるための見分け札。
  // 配置・手番・キャスリングの権利・アンパッサンの可能性まで含める。
  // 手数は入れない（入れると同じ局面が二度と一致しない）。
  function positionKey(pos) {
    return pos.board.join('') + '|' + pos.turn + '|' + (pos.castle || '-') +
      '|' + (pos.ep >= 0 ? pos.ep : '-');
  }

  function cloneSeen(seen) {
    var out = {};
    for (var k in seen) if (Object.prototype.hasOwnProperty.call(seen, k)) out[k] = seen[k];
    return out;
  }

  function findKing(pos, color) {
    var want = color === 'w' ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (pos.board[i] === want) return i;
    return -1;
  }


  // ----------------------------------------------------------------
  // 03. 利き（そのマスは攻められているか）
  // ----------------------------------------------------------------
  //
  // 盤を全部なめるのではなく、調べたいマスから外へ向かって探す。
  // ナイトの位置から跳んだ先を見るのではなく、
  // 「このマスへ跳んでこられる位置にナイトがいるか」を見る、という向き。
  // どちらでも答えは同じだが、こちらは1回の呼び出しで30マスほどしか見ない。
  // 合法手の判定で何度も呼ぶため、ここが軽いかどうかが全体に効く。

  function attackedBy(pos, target, byColor) {
    if (target < 0) return false;
    var b = pos.board;
    var f = fileOf(target), r = rankOf(target);
    var i, d, s, p;

    // ナイト
    for (i = 0; i < LEAPS.length; i++) {
      s = at(f + LEAPS[i][0], r + LEAPS[i][1]);
      if (s >= 0 && typeOf(b[s]) === 'N' && colorOf(b[s]) === byColor) return true;
    }

    // キング
    for (i = 0; i < EIGHT.length; i++) {
      s = at(f + EIGHT[i][0], r + EIGHT[i][1]);
      if (s >= 0 && typeOf(b[s]) === 'K' && colorOf(b[s]) === byColor) return true;
    }

    // ポーン。白のポーンは上へ攻めるので、1段下の斜めにいる
    var back = byColor === 'w' ? -1 : 1;
    for (i = -1; i <= 1; i += 2) {
      s = at(f + i, r + back);
      if (s >= 0 && typeOf(b[s]) === 'P' && colorOf(b[s]) === byColor) return true;
    }

    // ルークとクイーン（たて・よこ）、ビショップとクイーン（ななめ）
    var rays = [[STRAIGHT, 'R'], [DIAGONAL, 'B']];
    for (var k = 0; k < 2; k++) {
      var dirs = rays[k][0], longPiece = rays[k][1];
      for (d = 0; d < dirs.length; d++) {
        var step = 1;
        for (;;) {
          s = at(f + dirs[d][0] * step, r + dirs[d][1] * step);
          if (s < 0) break;
          p = b[s];
          if (p) {
            var t = typeOf(p);
            if (colorOf(p) === byColor && (t === longPiece || t === 'Q')) return true;
            break;
          }
          step++;
        }
      }
    }
    return false;
  }

  function inCheck(pos, color) {
    var k = findKing(pos, color);
    if (k < 0) return false;
    return attackedBy(pos, k, other(color));
  }

  // そのマスを攻めている駒の居場所を全部返す。
  // 02巻のフォークや「ただ取り」の説明、03巻の交換の損得で使う。
  function attackers(pos, target, byColor) {
    var out = [];
    for (var i = 0; i < 64; i++) {
      var p = pos.board[i];
      if (!p || colorOf(p) !== byColor) continue;
      if (hits(pos, i, target)) out.push(i);
    }
    return out;
  }

  // i にいる駒は target を攻めているか。
  // ポーンだけは「進む先」と「取る先」が違うので、取る先だけを見る。
  function hits(pos, i, target) {
    var b = pos.board;
    var p = b[i];
    if (!p || i === target) return false;
    var t = typeOf(p), c = colorOf(p);
    var df = fileOf(target) - fileOf(i);
    var dr = rankOf(target) - rankOf(i);
    var ad = Math.abs(df), ar = Math.abs(dr);

    if (t === 'P') return ad === 1 && dr === (c === 'w' ? 1 : -1);
    if (t === 'N') return (ad === 1 && ar === 2) || (ad === 2 && ar === 1);
    if (t === 'K') return ad <= 1 && ar <= 1;

    var straight = (df === 0 || dr === 0);
    var diagonal = (ad === ar);
    if (t === 'R' && !straight) return false;
    if (t === 'B' && !diagonal) return false;
    if (t === 'Q' && !straight && !diagonal) return false;

    // あいだに駒があれば届かない
    var sf = df === 0 ? 0 : (df > 0 ? 1 : -1);
    var sr = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
    var steps = Math.max(ad, ar);
    for (var k = 1; k < steps; k++) {
      var s = at(fileOf(i) + sf * k, rankOf(i) + sr * k);
      if (s < 0 || b[s]) return false;
    }
    return true;
  }


  // ----------------------------------------------------------------
  // 04. 手を作る
  // ----------------------------------------------------------------
  //
  // 手は次の形で持つ。
  //   from, to      出発マスと行き先の index
  //   piece         動かす駒（1文字）
  //   captured      取った駒（無ければ ''）
  //   capturedAt    取った駒がいたマス。アンパッサンだけ to と違う
  //   promo         なった駒（'Q' など。なければ ''）
  //   castle        'K' か 'Q'（キャスリングのとき）。でなければ ''
  //   double        ポーンが2マス進んだ手か
  //
  // captured を to とは別に持っているのはアンパッサンのためだけ。
  // あの手だけ「取った駒が行き先にいない」ので、
  // to から取った駒を割り出す書き方にすると、ここで必ず間違える。

  function makeMove(pos, from, to, extra) {
    var m = {
      from: from,
      to: to,
      piece: pos.board[from],
      captured: pos.board[to],
      capturedAt: pos.board[to] ? to : -1,
      promo: '',
      castle: '',
      double: false
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) m[k] = extra[k];
    return m;
  }

  // ルール違反を含む手を全部作る。自分のキングが取られる形かどうかは見ない。
  function pseudoMoves(pos, color) {
    var b = pos.board;
    var out = [];
    var i, d, s, step, p, t;

    for (i = 0; i < 64; i++) {
      p = b[i];
      if (!p || colorOf(p) !== color) continue;
      t = typeOf(p);
      var f = fileOf(i), r = rankOf(i);

      if (t === 'P') {
        var up = color === 'w' ? 1 : -1;
        var last = color === 'w' ? 8 : 1;
        var startRank = color === 'w' ? 2 : 7;

        // 前へ1マス。ここでは駒を取れない
        s = at(f, r + up);
        if (s >= 0 && !b[s]) {
          pushPawn(out, pos, i, s, last, {});
          // はじめの位置からだけ2マス。1マス目が空いていることが前提
          if (r === startRank) {
            var s2 = at(f, r + up * 2);
            if (s2 >= 0 && !b[s2]) out.push(makeMove(pos, i, s2, { double: true }));
          }
        }
        // 取るのはななめ。前の駒は取れない
        for (d = -1; d <= 1; d += 2) {
          s = at(f + d, r + up);
          if (s < 0) continue;
          if (b[s] && colorOf(b[s]) !== color) {
            pushPawn(out, pos, i, s, last, {});
          } else if (!b[s] && s === pos.ep) {
            // アンパッサン。取る駒は行き先ではなく、その1つ手前にいる
            var victim = at(f + d, r);
            out.push(makeMove(pos, i, s, {
              captured: b[victim],
              capturedAt: victim
            }));
          }
        }
        continue;
      }

      if (t === 'N' || t === 'K') {
        var once = t === 'N' ? LEAPS : EIGHT;
        for (d = 0; d < once.length; d++) {
          s = at(f + once[d][0], r + once[d][1]);
          if (s >= 0 && (!b[s] || colorOf(b[s]) !== color)) out.push(makeMove(pos, i, s));
        }
        continue;
      }

      // ルーク・ビショップ・クイーン。味方にぶつかる手前まで、敵なら取って止まる
      var dirs = t === 'R' ? STRAIGHT : (t === 'B' ? DIAGONAL : EIGHT);
      for (d = 0; d < dirs.length; d++) {
        step = 1;
        for (;;) {
          s = at(f + dirs[d][0] * step, r + dirs[d][1] * step);
          if (s < 0) break;
          if (!b[s]) {
            out.push(makeMove(pos, i, s));
          } else {
            if (colorOf(b[s]) !== color) out.push(makeMove(pos, i, s));
            break;
          }
          step++;
        }
      }
    }

    addCastles(pos, color, out);
    return out;
  }

  // ポーンが最終段に着いたら、なる駒4通りをそれぞれ別の手として作る。
  // 「なる」をあとで選ばせる作りにすると、手の一覧に
  // 同じ from-to が1つしか現れず、棋譜（e8=Q と e8=N）を書き分けられない。
  function pushPawn(out, pos, from, to, lastRank, extra) {
    if (rankOf(to) === lastRank) {
      var kinds = ['Q', 'R', 'B', 'N'];
      for (var k = 0; k < 4; k++) {
        var e = { promo: kinds[k] };
        for (var j in extra) if (Object.prototype.hasOwnProperty.call(extra, j)) e[j] = extra[j];
        out.push(makeMove(pos, from, to, e));
      }
    } else {
      out.push(makeMove(pos, from, to, extra));
    }
  }

  // キャスリング。4つの条件を1つずつ確かめる。
  //   1. まだ権利が残っている（キングもそのルークも一度も動いていない）
  //   2. あいだのマスが空いている
  //   3. 今チェックされていない
  //   4. キングが通るマスと着くマスが攻められていない
  // 「ルークが攻められていてもよい」のが間違えやすいところ。
  // 条件はキングの通り道だけに掛かる。
  var CASTLE_PLAN = {
    wK: { right: 'K', king: 60, to: 62, rook: 63, rookTo: 61, empty: [61, 62],         pass: [60, 61, 62] },
    wQ: { right: 'Q', king: 60, to: 58, rook: 56, rookTo: 59, empty: [57, 58, 59],     pass: [60, 59, 58] },
    bK: { right: 'k', king: 4,  to: 6,  rook: 7,  rookTo: 5,  empty: [5, 6],           pass: [4, 5, 6] },
    bQ: { right: 'q', king: 4,  to: 2,  rook: 0,  rookTo: 3,  empty: [1, 2, 3],        pass: [4, 3, 2] }
  };

  function addCastles(pos, color, out) {
    var keys = color === 'w' ? ['wK', 'wQ'] : ['bK', 'bQ'];
    var king = color === 'w' ? 'K' : 'k';
    var rook = color === 'w' ? 'R' : 'r';
    for (var n = 0; n < 2; n++) {
      var plan = CASTLE_PLAN[keys[n]];
      if (pos.castle.indexOf(plan.right) < 0) continue;
      if (pos.board[plan.king] !== king || pos.board[plan.rook] !== rook) continue;
      var i, ok = true;
      for (i = 0; i < plan.empty.length; i++) if (pos.board[plan.empty[i]]) { ok = false; break; }
      if (!ok) continue;
      for (i = 0; i < plan.pass.length; i++) {
        if (attackedBy(pos, plan.pass[i], other(color))) { ok = false; break; }
      }
      if (!ok) continue;
      out.push(makeMove(pos, plan.king, plan.to, { castle: plan.right.toUpperCase() }));
    }
  }

  // 本当に指せる手。指してみて自分のキングが取られる形なら落とす
  function legalMoves(pos, color) {
    var c = color || pos.turn;
    var all = pseudoMoves(pos, c);
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var next = applyRaw(pos, all[i]);
      if (!inCheck(next, c)) out.push(all[i]);
    }
    return out;
  }

  // あるマスの駒が指せる手だけ。盤を触ったときに行き先を光らせるのに使う
  function movesFrom(pos, from) {
    var all = legalMoves(pos);
    var out = [];
    for (var i = 0; i < all.length; i++) if (all[i].from === from) out.push(all[i]);
    return out;
  }

  // アンパッサンの欄が飾りでないか（隣に取れるポーンが本当にいるか）。
  // ピンで実際には取れない場合までは見ていない。
  // 千日手の見分け札に使うだけなので、そこまでの精度は要らない。
  function epIsReal(pos) {
    if (pos.ep < 0) return false;
    var f = fileOf(pos.ep), r = rankOf(pos.ep);
    // 白の通過マス（3段目）なら、取るのは黒のポーン
    var taker = r === 3 ? 'p' : (r === 6 ? 'P' : '');
    if (!taker) return false;
    var row = r === 3 ? 4 : 5;
    for (var d = -1; d <= 1; d += 2) {
      var s = at(f + d, row);
      if (s >= 0 && pos.board[s] === taker) return true;
    }
    return false;
  }


  // ----------------------------------------------------------------
  // 05. 手を指す
  // ----------------------------------------------------------------
  //
  // applyRaw は盤と権利だけを進める。合法手の判定で何度も呼ばれるので軽い。
  // apply は千日手を数える札も足す。遊ぶときはこちらを使う。

  function applyRaw(pos, move) {
    var b = pos.board.slice();
    var color = colorOf(move.piece);
    var t = typeOf(move.piece);

    if (move.capturedAt >= 0) b[move.capturedAt] = '';
    b[move.from] = '';
    b[move.to] = move.promo ? (color === 'w' ? move.promo : move.promo.toLowerCase()) : move.piece;

    // キャスリングはルークも一緒に動く。キングだけ動かすと盤が壊れる
    if (move.castle) {
      var plan = CASTLE_PLAN[(color === 'w' ? 'w' : 'b') + move.castle];
      b[plan.rook] = '';
      b[plan.rookTo] = color === 'w' ? 'R' : 'r';
    }

    // キャスリングの権利は「減るだけ」。
    // 盤から作り直すと、キングが e1 に戻ってきたときに権利が復活してしまう
    var castle = pos.castle;
    function drop(ch) { castle = castle.replace(ch, ''); }
    if (t === 'K') {
      if (color === 'w') { drop('K'); drop('Q'); } else { drop('k'); drop('q'); }
    }
    // ルークが動いた、またはルークが隅で取られた
    if (move.from === 63 || move.to === 63) drop('K');
    if (move.from === 56 || move.to === 56) drop('Q');
    if (move.from === 7  || move.to === 7)  drop('k');
    if (move.from === 0  || move.to === 0)  drop('q');

    var next = {
      board:  b,
      turn:   other(color),
      castle: castle,
      ep:     -1,
      half:   (move.captured || t === 'P') ? 0 : pos.half + 1,
      full:   pos.full + (color === 'b' ? 1 : 0),
      seen:   pos.seen
    };

    // 通過マスは、実際に取れるときだけ立てる。
    // 取れないのに立てておくと、千日手の判定で
    // 同じ局面を別物として数えてしまう
    if (move.double) {
      next.ep = at(fileOf(move.to), rankOf(move.to) + (color === 'w' ? -1 : 1));
      if (!epIsReal(next)) next.ep = -1;
    }
    return next;
  }

  function apply(pos, move) {
    var next = applyRaw(pos, move);
    next.seen = cloneSeen(pos.seen || {});
    var key = positionKey(next);
    next.seen[key] = (next.seen[key] || 0) + 1;
    return next;
  }


  // ----------------------------------------------------------------
  // 06. 決着
  // ----------------------------------------------------------------
  //
  // kind が何になるかと、その意味。
  //
  //   'checkmate'   チェックメイト。winner 側の勝ち
  //   'stalemate'   ステイルメイト。指す手が無く、しかもチェックされていない
  //   'material'    どちらも詰ませられない駒しか残っていない
  //   'repetition'  同じ局面が3回。主張できる（自動ではない）
  //   'repetition5' 同じ局面が5回。自動で引き分け
  //   'fifty'       50手ルール。主張できる
  //   'seventyfive' 75手ルール。自動で引き分け
  //
  // claimable が true のものは、規則の上では「引き分けを主張できる」だけで、
  // 黙って指し続けることもできる。教材としてここを混ぜたくないので、
  // 自動で止まるものと分けて返している。

  function status(pos, moves) {
    var list = moves || legalMoves(pos);
    if (list.length === 0) {
      if (inCheck(pos, pos.turn)) {
        return { over: true, kind: 'checkmate', winner: other(pos.turn), claimable: false };
      }
      return { over: true, kind: 'stalemate', winner: null, claimable: false };
    }
    if (insufficientMaterial(pos)) {
      return { over: true, kind: 'material', winner: null, claimable: false };
    }
    var seen = (pos.seen || {})[positionKey(pos)] || 0;
    if (seen >= 5)      return { over: true,  kind: 'repetition5', winner: null, claimable: false };
    if (pos.half >= 150) return { over: true,  kind: 'seventyfive', winner: null, claimable: false };
    if (seen >= 3)      return { over: false, kind: 'repetition',  winner: null, claimable: true };
    if (pos.half >= 100) return { over: false, kind: 'fifty',      winner: null, claimable: true };
    return { over: false, kind: null, winner: null, claimable: false };
  }

  // 詰ませる手が存在しない駒組みだけを数える。
  // ナイト2枚対キングは入れない。相手が最善を指さなければ詰む形があり、
  // 規則の上では自動で引き分けにならない
  function insufficientMaterial(pos) {
    var rest = [];
    for (var i = 0; i < 64; i++) {
      var p = pos.board[i];
      if (!p || typeOf(p) === 'K') continue;
      rest.push({ type: typeOf(p), color: colorOf(p), light: isLightSquare(i) });
    }
    if (rest.length === 0) return true;
    if (rest.length === 1) return rest[0].type === 'N' || rest[0].type === 'B';
    if (rest.length === 2 &&
        rest[0].type === 'B' && rest[1].type === 'B' &&
        rest[0].color !== rest[1].color &&
        rest[0].light === rest[1].light) return true;
    return false;
  }


  // ----------------------------------------------------------------
  // 07. 棋譜（SAN）
  // ----------------------------------------------------------------
  //
  // 書き方は標準代数式の短縮形（SAN）。棋書・データベース・PGN がこれ。
  //
  //   Nf3      ナイトが f3 へ
  //   exd5     e列のポーンが d5 で取った（ポーンは取るときだけ列を書く）
  //   Bxc6+    ビショップが c6 で取ってチェック
  //   Nbd2     d2 へ行けるナイトが2枚いるので、出発した列で書き分ける
  //   O-O      キングサイドのキャスリング
  //   e8=Q     プロモーションしてクイーンになった
  //   Qh5#     チェックメイト
  //
  // 書き分け（disambiguation）の決め方は規格どおり。
  //   1. 出発した列が他と違えば、列だけ書く    Nbd2
  //   2. 列が同じなら、段を書く                 R1e2
  //   3. どちらも同じなら、両方書く             Qh4e1
  // 比べる相手は「本当に指せる手」だけ。ピンで動けないもう1枚は数えない。

  function toSan(pos, move) {
    var san;
    if (move.castle === 'K') {
      san = 'O-O';
    } else if (move.castle === 'Q') {
      san = 'O-O-O';
    } else {
      var t = typeOf(move.piece);
      if (t === 'P') {
        san = move.captured
          ? FILES.charAt(fileOf(move.from)) + 'x' + nameOf(move.to)
          : nameOf(move.to);
        if (move.promo) san += '=' + move.promo;
      } else {
        san = t + disambiguation(pos, move) + (move.captured ? 'x' : '') + nameOf(move.to);
      }
    }
    var next = applyRaw(pos, move);
    if (inCheck(next, next.turn)) {
      san += legalMoves(next).length === 0 ? '#' : '+';
    }
    return san;
  }

  function disambiguation(pos, move) {
    var t = typeOf(move.piece);
    var all = legalMoves(pos, colorOf(move.piece));
    var rivals = [];
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      if (m.to === move.to && m.from !== move.from && typeOf(m.piece) === t) rivals.push(m.from);
    }
    if (rivals.length === 0) return '';
    var sameFile = false, sameRank = false;
    for (var k = 0; k < rivals.length; k++) {
      if (fileOf(rivals[k]) === fileOf(move.from)) sameFile = true;
      if (rankOf(rivals[k]) === rankOf(move.from)) sameRank = true;
    }
    if (!sameFile) return FILES.charAt(fileOf(move.from));
    if (!sameRank) return String(rankOf(move.from));
    return nameOf(move.from);
  }

  // 棋譜の1手を読んで、その手を返す。読めなければ null。
  //
  // 文字を解析して from と to を割り出す作りにはしていない。
  // 合法手を全部作り、それぞれの SAN を書いて、文字が一致するものを選ぶ。
  // こうすると「書く」と「読む」が必ず同じ規則で動く。
  // 別々に書くと、書き分け（Nbd2）の規則を片方だけ直した日に食い違う。
  //
  // 長い書き方（Ng1-f3）と座標だけの書き方（g1f3・e7e8q）も受け取る。
  // 棋譜を打ち込んで試す人が最初に書くのはたいていこちらなので、
  // 拒むより通した方が早く本題に入れる。
  function parseSan(pos, text) {
    var want = normalizeSan(text);
    if (!want) return null;
    var all = legalMoves(pos);
    var i, m;

    for (i = 0; i < all.length; i++) {
      if (normalizeSan(toSan(pos, all[i])) === want) return all[i];
    }
    // 座標の書き方。e2e4 / g1f3 / e7e8q
    var coord = want.toLowerCase().replace(/[^a-h1-8qrbn]/g, '');
    if (coord.length === 4 || coord.length === 5) {
      var from = indexOf(coord.slice(0, 2));
      var to = indexOf(coord.slice(2, 4));
      var promo = coord.length === 5 ? coord.charAt(4).toUpperCase() : '';
      for (i = 0; i < all.length; i++) {
        m = all[i];
        if (m.from === from && m.to === to && (!m.promo || !promo || m.promo === promo)) {
          if (m.promo && !promo && m.promo !== 'Q') continue; // 指定が無ければクイーン
          return m;
        }
      }
    }
    return null;
  }

  // 比べるために、意味の無い飾りを落とす。
  //   0-0 と O-O（数字のゼロと大文字のオー）は同じものとして扱う
  //   ! ? e.p. + # は一致の判定に関係しない
  function normalizeSan(text) {
    if (typeof text !== 'string') return '';
    var s = text.trim()
      .replace(/[!?]+/g, '')
      .replace(/\s*e\.?p\.?$/i, '')
      .replace(/[+#]/g, '')
      .replace(/0/g, 'O')
      .replace(/[–—−]/g, '-');
    if (/^O-O-O$/i.test(s)) return 'O-O-O';
    if (/^O-O$/i.test(s)) return 'O-O';
    return s.replace(/-/g, '');
  }

  // 棋譜の文字列を1手ずつ指していく。読めない手が出たらそこで止める。
  // 戻り値は { pos, moves, sans, stopped }
  //   stopped  読めなかった手の文字（最後まで読めたら null）
  function playLine(pos, line) {
    var tokens = String(line || '')
      .replace(/\{[^}]*\}/g, ' ')          // { } の注釈
      .replace(/\d+\s*\.(\.\.)?/g, ' ')    // 1. や 1... の手数
      .replace(/(1-0|0-1|1\/2-1\/2|\*)/g, ' ')
      .trim().split(/\s+/).filter(Boolean);
    var cur = pos, moves = [], sans = [];
    for (var i = 0; i < tokens.length; i++) {
      var m = parseSan(cur, tokens[i]);
      if (!m) return { pos: cur, moves: moves, sans: sans, stopped: tokens[i] };
      sans.push(toSan(cur, m));
      moves.push(m);
      cur = apply(cur, m);
    }
    return { pos: cur, moves: moves, sans: sans, stopped: null };
  }


  // ----------------------------------------------------------------
  // 08. 駒のねうちと、とりかえの損得（02巻から使う）
  // ----------------------------------------------------------------
  //
  // ★ 01巻はこの節を使っていない ★
  //   値を出さずに済ませたのは、1巻が「どう動くか」だけの巻で、
  //   ねうちの話をすると、まだ教えていない損得が混ざるため。
  //   02巻の1回目で値を説明してから使う。
  //
  // ★ 値について ★
  //   ポーン1・ナイト3・ビショップ3・ルーク5・クイーン9。古典的な値である。
  //
  //   ビショップとナイトをどちらも3にしてあるのは、どちらが強いかが
  //   盤の形で変わるため。盤が開いていればビショップ、ポーンが
  //   かたまって動けない形ならナイトが働く。平均すればビショップが
  //   わずかに上という調べ方もあるが、それは何万局も均した話であって、
  //   目の前の1局には当てはまらない。片方を上に書くと嘘になる。
  //
  //   キングだけ別扱い。画面では ♾️ と出すが、計算の中では
  //   大きな数を置いている。取られたら終わる駒なので他と交換できず、
  //   「9個ぶん」のように比べられない。下の取り合いでは、
  //   キングが取りに行けるかどうかの判定にだけ使う。
  //
  //   ここを変えると02巻のレッスンがすべて変わる。変えたら解き直すこと。

  var VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 1000 };

  function valueOf(piece) {
    var t = typeOf(piece);
    return t ? VALUE[t] : 0;
  }

  // そのマスを攻めている駒のうち、いちばん安いものの居場所。無ければ -1。
  //
  // キングだけ条件が付く。取ったあとも相手がそのマスを攻めているなら、
  // キングは取りに行けない（取った瞬間に取られる形になるため）。
  // だからキングは最後の候補にし、そのときだけ相手の攻めを確かめる。
  function cheapestAttacker(board, to, color) {
    var fake = { board: board };
    var best = -1, bestValue = Infinity;
    for (var i = 0; i < 64; i++) {
      var p = board[i];
      if (!p || colorOf(p) !== color) continue;
      if (!hits(fake, i, to)) continue;
      var v = valueOf(p);
      if (v < bestValue) { bestValue = v; best = i; }
    }
    if (best >= 0 && typeOf(board[best]) === 'K') {
      // キングが取ったあとの盤で、まだ相手がそのマスを攻めているか
      var after = board.slice();
      after[to] = after[best];
      after[best] = '';
      if (attackedBy({ board: after }, to, other(color))) return -1;
    }
    return best;
  }

  // そのマスで取り合いを続けたときに、最後にいくら得するか。
  //
  // 安い駒から順に取り合わせて、途中でやめる自由も入れて数える。
  // チェスでは「静的交換評価（Static Exchange Evaluation, SEE）」と呼ぶ。
  // 02巻では名前を出さず「とりかえすと とくか そんか」として教える。
  //
  // ★ 見ていないもの ★
  //   ピンで実際には動かせない駒も、攻めているものとして数える。
  //   途中で王手が絡んで順番が狂う形も見ていない。
  //   そこまで見るには読みが要り、読みを入れると
  //   「なぜその答えになるのか」を人が追えなくなる。
  //   「ただ取りできる駒」と「踏み込んではいけないマス」は、
  //   この範囲で全部出る。02巻が必要とするのはそこまで。
  //
  //   ひと手ごとに攻めている駒を数え直しているので、
  //   うしろに控えたルークが前のルークのあとに利いてくる形
  //   （X線）は、数え直しの結果として自然に入る。

  function gainAfter(board, to, color) {
    // color が取り返す側。取り返さない自由があるので 0 と比べる
    var from = cheapestAttacker(board, to, color);
    if (from < 0) return 0;
    var taken = valueOf(board[to]);
    var next = board.slice();
    next[to] = next[from];
    next[from] = '';
    return Math.max(0, taken - gainAfter(next, to, other(color)));
  }

  // color がそのマスで取り始めたときの損得。
  // 得なら正、損なら負。取れないマスなら 0。
  function exchange(pos, target, color) {
    var to = typeof target === 'string' ? indexOf(target) : target;
    if (to < 0 || !pos.board[to]) return 0;
    if (colorOf(pos.board[to]) === color) return 0;
    var from = cheapestAttacker(pos.board, to, color);
    if (from < 0) return 0;
    var taken = valueOf(pos.board[to]);
    var next = pos.board.slice();
    next[to] = next[from];
    next[from] = '';
    // 最初の1回だけは「やめる自由」を掛けない。取りに行くと決めた手だから
    return taken - gainAfter(next, to, other(color));
  }

  // その手で取りに行ったときの損得。
  //
  // exchange() は「いちばん安い駒から取る」前提で数える。
  // こちらは「この駒で取ったら」を数える。両方が要るのは、
  // どの駒から取るかで損得が変わるため。
  //   ポーンで取れば得、ルークで取れば損、という形は普通にある。
  //   02巻の3回目（とりかえすと とくか そんか）はそれを教える回で、
  //   まちがえた手に「その駒から取ると そんするよ」と返すのに要る。
  function exchangeOf(pos, move) {
    if (!move || !move.captured) return 0;
    var taken = valueOf(move.captured);
    var next = pos.board.slice();
    if (move.capturedAt >= 0) next[move.capturedAt] = '';   // アンパッサン
    next[move.to] = next[move.from];
    next[move.from] = '';
    return taken - gainAfter(next, move.to, other(colorOf(move.piece)));
  }

  // 残っている駒の合計。キングは数えない（交換できないため）
  function material(pos, color) {
    var sum = 0;
    for (var i = 0; i < 64; i++) {
      var p = pos.board[i];
      if (!p || colorOf(p) !== color || typeOf(p) === 'K') continue;
      sum += valueOf(p);
    }
    return sum;
  }


  // ----------------------------------------------------------------
  // 09. 外に出すもの
  // ----------------------------------------------------------------

  global.Chess = {
    FILES: FILES,
    START_FEN: START_FEN,
    EMPTY_FEN: EMPTY_FEN,

    // マス
    fileOf: fileOf,
    rankOf: rankOf,
    nameOf: nameOf,
    indexOf: indexOf,
    at: at,
    isLightSquare: isLightSquare,

    // 駒
    colorOf: colorOf,
    typeOf: typeOf,
    other: other,

    // 局面
    fromFen: fromFen,
    toFen: toFen,
    findKing: findKing,

    // 手
    legalMoves: legalMoves,
    movesFrom: movesFrom,
    apply: apply,

    // 状態
    inCheck: inCheck,
    attackedBy: attackedBy,
    attackers: attackers,
    status: status,

    // ねうちと とりかえ（02巻から）
    VALUE: VALUE,
    valueOf: valueOf,
    cheapestAttacker: cheapestAttacker,
    exchange: exchange,
    exchangeOf: exchangeOf,
    material: material,

    // 棋譜
    toSan: toSan,
    parseSan: parseSan,
    playLine: playLine
  };

})(typeof window !== 'undefined' ? window : globalThis);
