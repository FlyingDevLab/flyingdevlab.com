// ================================================================
// game.js – KLOTSKI
// ================================================================
//
// 盤を動かす仕組みは /kids/shared/klotski.js にある。
// 3本のゲーム（箱入り娘・KLOTSKI・華容道）がそれを共有しており、
// このファイルにあるのは配置と名札と文言だけである。
// 盤の動きを変えたいときは共有側を直すこと。3本すべてが変わる。
//
// ★ face を持たせていない ★
//   この版の駒は文字を持たない。大きさと色だけで区別する。
//   共有エンジンは face が無ければ駒の中身を空のままにする。
//   読み上げ用の名前は label にだけ入れてある。
//
// ★ 配置 ★
//   最短32手。3本の中でいちばんやさしい配置で、初めて触る人の入口にしている。
//   空き2マスが出口の真上にあるので、何をすればいいかが見た瞬間に分かる。
//   左右対称の形を選んである。対称な盤は「誰かが作った問題」に見える。
//
//   この32手は盤面を総当たりで解いて確かめた値（同じ駒を続けて動かすのは
//   1手と数える規則による）。配置を変えたら必ず解き直すこと。
//   華容道は橫刀立馬の81手、箱入り娘は4段で81〜120手。
//
// ★ クリアした回数 ★
//   上がるたびに1つ足して、盤の上に 🏆 と出す。2回目からは数字も付く。
//   数えているのは共有エンジンで、ここは保存キーと読み上げの言葉を渡すだけ。
//   見せるだけの数字で、何かを開く条件には使っていない。
//   ブラウザによっては、しばらく訪れないと保存を自動で消す。回数は黙って
//   0 に戻ることがあるので、何かを開く条件には使えない。
// ================================================================

KLOTSKI.start({

  // 配置を変えたときはキーも変える。前の配置で出した手数と
  // 比べられなくなるため（_v2 は 32手の配置になってからの記録）。
  bestKey: 'fdl_klotski_best_v2',

  // クリアした回数。配置を変えても回数は数え直さないが、
  // 手数のキーに合わせて _v2 を付けてある。
  clearsKey: 'fdl_klotski_clears_v2',

  // 出口へ運ぶ駒と、その駒が収まるべき位置。
  // 出口は下辺の中央2マスなので x = 1、2マスの高さが最下段に収まる y = 3。
  goalId: 'big',
  goal: { x: 1, y: 3 },

  // label は読み上げ専用。同じ形が4つ並ぶため、番号を振って区別している。
  pieces: [
    { id: 'big',   type: 'big',  w: 2, h: 2, x: 1, y: 0, label: 'Big block' },
    { id: 'tall1', type: 'tall', w: 1, h: 2, x: 0, y: 1, label: 'Tall block 1' },
    { id: 'tall2', type: 'tall', w: 1, h: 2, x: 3, y: 1, label: 'Tall block 2' },
    { id: 'tall3', type: 'tall', w: 1, h: 2, x: 0, y: 3, label: 'Tall block 3' },
    { id: 'tall4', type: 'tall', w: 1, h: 2, x: 3, y: 3, label: 'Tall block 4' },
    { id: 'wide',  type: 'wide', w: 2, h: 1, x: 1, y: 3, label: 'Wide block' },
    { id: 'unit1', type: 'unit', w: 1, h: 1, x: 0, y: 0, label: 'Small block 1' },
    { id: 'unit2', type: 'unit', w: 1, h: 1, x: 3, y: 0, label: 'Small block 2' },
    { id: 'unit3', type: 'unit', w: 1, h: 1, x: 1, y: 2, label: 'Small block 3' },
    { id: 'unit4', type: 'unit', w: 1, h: 1, x: 2, y: 2, label: 'Small block 4' }
  ],

  // リザルト画面に出す文言。単数と複数を出し分ける
  text: {
    result:    (moves)       => plural(moves),
    bestFirst: (moves)       => 'Best ' + plural(moves),
    bestKept:  (best)        => 'Best ' + plural(best),
    bestNew:   (prev)        => 'New record! Previously ' + plural(prev),
    // 画面には 🏆 しか出ないので、読み上げ用の言葉をここで渡す
    clears:    (n)           => n === 0 ? 'Not cleared yet'
                              : n === 1 ? 'Cleared once'
                              : 'Cleared ' + n + ' times'
  }
});

function plural(n) { return n + (n === 1 ? ' move' : ' moves'); }
