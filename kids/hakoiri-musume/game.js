// ================================================================
// game.js – 箱入り娘（HAKOIRI MUSUME）
// ================================================================
//
// 4×5 の盤から、2×2 の「娘」を下の出口まで運び出すパズル。
// 江戸から伝わる木のオモチャで、中国では華容道、海外では Klotski と呼ばれる。
//
// ★ 盤面の仕組みはここには無い ★
//   動かす・数える・記録する仕組みは /kids/shared/klotski.js にある。
//   3本のゲーム（箱入り娘・KLOTSKI・華容道）がそれを共有しており、
//   このファイルに書いてあるのは、駒の名札と画面に出す文言だけである。
//   盤の動きを変えたいときは共有側を直すこと。3本すべてが変わる。
//
// ★ 配置 ★
//   標準配置。最短81手。
//   type は見た目（木の種類と木目の向き）を style.css へ伝えるだけの札で、
//   動き方には影響しない。どの駒も縦横に自由に動く。
//
// ★ 駒の名前 ★
//   商家の家族と奉公人。番頭・丁稚・女中は今では耳慣れない言葉だが、
//   このパズルが伝わってきた形をそのまま残している。
//   読めない年齢のために、駒にはふりがなを振っている。
// ================================================================

KLOTSKI.start({

  // 自己最少手数の保存キー。他のゲームと同じ fdl_ 接頭辞を付けている
  bestKey: 'fdl_hakoiri_best',

  // 出口へ運ぶ駒と、その駒が収まるべき位置。
  // 出口は下辺の中央2マスなので x = 1、2マスの高さが最下段に収まる y = 3。
  goalId: 'musume',
  goal: { x: 1, y: 3 },

  pieces: [
    { id: 'musume',  type: 'musume',     w: 2, h: 2, x: 1, y: 0, face: '娘',   ruby: 'むすめ',     label: 'むすめ' },
    { id: 'chichi',  type: 'vertical',   w: 1, h: 2, x: 0, y: 0, face: '父',   ruby: 'ちち',       label: 'ちち' },
    { id: 'haha',    type: 'vertical',   w: 1, h: 2, x: 3, y: 0, face: '母',   ruby: 'はは',       label: 'はは' },
    { id: 'sofu',    type: 'vertical',   w: 1, h: 2, x: 0, y: 2, face: '祖父', ruby: 'そふ',       label: 'そふ' },
    { id: 'sobo',    type: 'vertical',   w: 1, h: 2, x: 3, y: 2, face: '祖母', ruby: 'そぼ',       label: 'そぼ' },
    { id: 'banto',   type: 'horizontal', w: 2, h: 1, x: 1, y: 2, face: '番頭', ruby: 'ばんとう',   label: 'ばんとう' },
    { id: 'decchi1', type: 'small',      w: 1, h: 1, x: 1, y: 3, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
    { id: 'decchi2', type: 'small',      w: 1, h: 1, x: 2, y: 3, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
    { id: 'jochu1',  type: 'small',      w: 1, h: 1, x: 0, y: 4, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
    { id: 'jochu2',  type: 'small',      w: 1, h: 1, x: 3, y: 4, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' }
  ],

  // リザルト画面に出す文言。画面に出る日本語はここと index.html にしかない。
  text: {
    result:    (moves, time) => moves + '手 ・ ' + time,
    bestFirst: (moves)       => '自己最少 ' + moves + '手',
    bestKept:  (best)        => '自己最少 ' + best + '手',
    bestNew:   (prev)        => '新記録！ これまでは ' + prev + '手'
  }
});
