// ================================================================
// game.js – 華容道（HUARONG DAO）
// ================================================================
//
// 盤を動かす仕組みは /kids/shared/klotski.js にある。
// 3本のゲーム（箱入り娘・KLOTSKI・華容道）がそれを共有しており、
// このファイルにあるのは配置と名札と文言だけである。
// 盤の動きを変えたいときは共有側を直すこと。3本すべてが変わる。
//
// ★ 配置 ★
//   「橫刀立馬」と呼ばれる標準の並び。最短81手。
//   名前を確かめられた唯一の布局なので、この版だけは動かさずに置いてある。
//   （KLOTSKI は32手、箱入り娘は4段で81〜120手）
//
// ★ type に2つ書いてある駒がある ★
//   共有エンジンは type をそのまま class 属性に入れるので、
//   空白で区切れば複数の札を付けられる。
//   縦2マスの4人は、形としては同じ general だが、色だけ武将ごとに変える。
//     關羽 … 緑の衣      張飛 … 墨
//     趙雲 … 白銀        馬超 … 青
//     黃忠 … 土黄
//
// ★ 注音符號 ★
//   ruby に入れているのは台湾の読み方の記号。
//   箱入り娘にふりがなを振っているのと同じ理由で、
//   まだ漢字を習っていない子でも駒の名前が読める。
// ================================================================

KLOTSKI.start({

  bestKey: 'fdl_huarongdao_best',

  // 出口へ運ぶ駒と、その駒が収まるべき位置。
  // 出口は下辺の中央2マスなので x = 1、2マスの高さが最下段に収まる y = 3。
  goalId: 'caocao',
  goal: { x: 1, y: 3 },

  pieces: [
    { id: 'caocao',     type: 'caocao',            w: 2, h: 2, x: 1, y: 0, face: '曹操', ruby: 'ㄘㄠˊㄘㄠ',   label: '曹操' },
    { id: 'zhangfei',   type: 'general zhangfei',  w: 1, h: 2, x: 0, y: 0, face: '張飛', ruby: 'ㄓㄤㄈㄟ',     label: '張飛' },
    { id: 'zhaoyun',    type: 'general zhaoyun',   w: 1, h: 2, x: 3, y: 0, face: '趙雲', ruby: 'ㄓㄠˋㄩㄣˊ',  label: '趙雲' },
    { id: 'machao',     type: 'general machao',    w: 1, h: 2, x: 0, y: 2, face: '馬超', ruby: 'ㄇㄚˇㄔㄠ',    label: '馬超' },
    { id: 'huangzhong', type: 'general huangzhong',w: 1, h: 2, x: 3, y: 2, face: '黃忠', ruby: 'ㄏㄨㄤˊㄓㄨㄥ', label: '黃忠' },
    { id: 'guanyu',     type: 'guanyu',            w: 2, h: 1, x: 1, y: 2, face: '關羽', ruby: 'ㄍㄨㄢㄩˇ',    label: '關羽' },
    { id: 'bing1',      type: 'bing',              w: 1, h: 1, x: 1, y: 3, face: '兵',   ruby: 'ㄅㄧㄥ',       label: '兵' },
    { id: 'bing2',      type: 'bing',              w: 1, h: 1, x: 2, y: 3, face: '兵',   ruby: 'ㄅㄧㄥ',       label: '兵' },
    { id: 'bing3',      type: 'bing',              w: 1, h: 1, x: 0, y: 4, face: '兵',   ruby: 'ㄅㄧㄥ',       label: '兵' },
    { id: 'bing4',      type: 'bing',              w: 1, h: 1, x: 3, y: 4, face: '兵',   ruby: 'ㄅㄧㄥ',       label: '兵' }
  ],

  // 過關の画面に出す文言
  text: {
    result:    (moves, time) => moves + ' 步 ‧ ' + time,
    bestFirst: (moves)       => '最少 ' + moves + ' 步',
    bestKept:  (best)        => '最少 ' + best + ' 步',
    bestNew:   (prev)        => '新紀錄！之前是 ' + prev + ' 步'
  }
});
