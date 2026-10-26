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
// ★ 配置は3本とも同じ ★
//   標準配置（最短81手）。箱入り娘の娘、華容道の曹操に当たるのが big。
// ================================================================

KLOTSKI.start({

  bestKey: 'fdl_klotski_best',

  // 出口へ運ぶ駒と、その駒が収まるべき位置。
  // 出口は下辺の中央2マスなので x = 1、2マスの高さが最下段に収まる y = 3。
  goalId: 'big',
  goal: { x: 1, y: 3 },

  // label は読み上げ専用。同じ形が4つ並ぶため、番号を振って区別している。
  pieces: [
    { id: 'big',   type: 'big',  w: 2, h: 2, x: 1, y: 0, label: 'Big block' },
    { id: 'tall1', type: 'tall', w: 1, h: 2, x: 0, y: 0, label: 'Tall block 1' },
    { id: 'tall2', type: 'tall', w: 1, h: 2, x: 3, y: 0, label: 'Tall block 2' },
    { id: 'tall3', type: 'tall', w: 1, h: 2, x: 0, y: 2, label: 'Tall block 3' },
    { id: 'tall4', type: 'tall', w: 1, h: 2, x: 3, y: 2, label: 'Tall block 4' },
    { id: 'wide',  type: 'wide', w: 2, h: 1, x: 1, y: 2, label: 'Wide block' },
    { id: 'unit1', type: 'unit', w: 1, h: 1, x: 1, y: 3, label: 'Small block 1' },
    { id: 'unit2', type: 'unit', w: 1, h: 1, x: 2, y: 3, label: 'Small block 2' },
    { id: 'unit3', type: 'unit', w: 1, h: 1, x: 0, y: 4, label: 'Small block 3' },
    { id: 'unit4', type: 'unit', w: 1, h: 1, x: 3, y: 4, label: 'Small block 4' }
  ],

  // リザルト画面に出す文言。単数と複数を出し分ける
  text: {
    result:    (moves, time) => plural(moves) + ' · ' + time,
    bestFirst: (moves)       => 'Best ' + plural(moves),
    bestKept:  (best)        => 'Best ' + plural(best),
    bestNew:   (prev)        => 'New record! Previously ' + plural(prev)
  }
});

function plural(n) { return n + (n === 1 ? ' move' : ' moves'); }
