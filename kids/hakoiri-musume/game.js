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
//   このファイルにあるのは、盤の並べ方と駒の名札と文言、そして
//   むずかしさを選ぶ仕組みだけである。
//   盤の動きを変えたいときは共有側を直すこと。3本すべてが変わる。
//
// ★ むずかしさが4段ある ★
//   3本のうち、むずかしさを選べるのはこのゲームだけである。
//
//     標準    81手   古典の定番（中国では橫刀立馬と呼ばれる並び）
//     難関    89手   古典の駒立てで、始まりらしい形の中では最難関
//     おこ   103手   父と母が横長になり、娘の前に立ちはだかる
//     激おこ 120手   父・母・番頭の横長3枚が三段の壁になる
//
//   手数はいずれも盤面を総当たりで解いて確かめた値である
//   （同じ駒を続けて動かすのは1手と数える規則による）。
//   並べ方を変えたら必ず解き直し、ここの moves も書き換えること。
//
// ★ 丁稚は表、女中は奥 ★
//   出口は盤の下にある。商家でいえば下が表（店先）、上が奥にあたる。
//   商売を担う丁稚を表の側に、家事を担う女中を奥の側に置いている。
//
//   標準だけは丁稚が女中より上にいる。これは番頭のそばに置いているため。
//   丁稚は番頭に付いて商売を覚える。
//
// ★ 駒立てが2種類ある ★
//   標準と難関は古典の駒立て（縦2マスが4枚・横2マスが1枚）。
//   おこと激おこは横2マスが3枚で、縦2マスが2枚になる。
//   横長の駒は、横に1マス空いていないと動けず、縦に動くには上下に
//   2マスの空きが要る。これが3枚あると盤が一気に重くなる。
//
// ★ 開放 ★
//   最初は標準と難関だけを選べる。どれか1つでもクリアすると、
//   おこと激おこが開く。開いたものは閉じない。
//
// ★ 保存するもの ★
//   どこまで開いたか、最後に選んだむずかしさ、むずかしさごとの自己最少手数。
//   盤面も時間も保存しない。途中でやめたら盤面は捨てられる。
// ================================================================

(() => {
  'use strict';

  // ── むずかしさの表 ───────────────────────────────────────────
  //
  //   label  … ボタンに出す短い名前
  //   name   … 読み上げ用の正式な名前
  //   moves  … 最短手数（総当たりで解いて確かめた値）
  //   open   … 最初から選べるか
  //
  // 駒の並びは、左上を (0, 0) とするマス目の位置。
  // type は見た目（木の種類と木目の向き）を style.css へ伝えるだけの札で、
  // 動き方には影響しない。どの駒も縦横に自由に動く。

  const LEVELS = [
    {
      id: 'standard', label: '標準', name: '古典標準', moves: 81, open: true,
      //  父 娘 娘 母
      //  父 娘 娘 母
      //  祖 番 番 祖
      //  祖 丁 丁 祖
      //  女 ・ ・ 女
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
      ]
    },
    {
      id: 'hardest', label: '難関', name: '古典難関', moves: 89, open: true,
      //  父 娘 娘 女
      //  父 娘 娘 母
      //  祖 番 番 母
      //  祖 丁 祖 女
      //  丁 ・ 祖 ・
      pieces: [
        { id: 'musume',  type: 'musume',     w: 2, h: 2, x: 1, y: 0, face: '娘',   ruby: 'むすめ',     label: 'むすめ' },
        { id: 'chichi',  type: 'vertical',   w: 1, h: 2, x: 0, y: 0, face: '父',   ruby: 'ちち',       label: 'ちち' },
        { id: 'haha',    type: 'vertical',   w: 1, h: 2, x: 3, y: 1, face: '母',   ruby: 'はは',       label: 'はは' },
        { id: 'sofu',    type: 'vertical',   w: 1, h: 2, x: 0, y: 2, face: '祖父', ruby: 'そふ',       label: 'そふ' },
        { id: 'sobo',    type: 'vertical',   w: 1, h: 2, x: 2, y: 3, face: '祖母', ruby: 'そぼ',       label: 'そぼ' },
        { id: 'banto',   type: 'horizontal', w: 2, h: 1, x: 1, y: 2, face: '番頭', ruby: 'ばんとう',   label: 'ばんとう' },
        { id: 'decchi1', type: 'small',      w: 1, h: 1, x: 1, y: 3, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
        { id: 'decchi2', type: 'small',      w: 1, h: 1, x: 0, y: 4, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
        { id: 'jochu1',  type: 'small',      w: 1, h: 1, x: 3, y: 0, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
        { id: 'jochu2',  type: 'small',      w: 1, h: 1, x: 3, y: 3, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' }
      ]
    },
    {
      id: 'angry', label: 'おこ', name: '両親おこ', moves: 103, open: false,
      //  祖 娘 娘 祖
      //  祖 娘 娘 祖
      //  父 父 母 母
      //  女 番 番 女
      //  丁 ・ ・ 丁
      pieces: [
        { id: 'musume',  type: 'musume',     w: 2, h: 2, x: 1, y: 0, face: '娘',   ruby: 'むすめ',     label: 'むすめ' },
        { id: 'sofu',    type: 'vertical',   w: 1, h: 2, x: 0, y: 0, face: '祖父', ruby: 'そふ',       label: 'そふ' },
        { id: 'sobo',    type: 'vertical',   w: 1, h: 2, x: 3, y: 0, face: '祖母', ruby: 'そぼ',       label: 'そぼ' },
        { id: 'chichi',  type: 'horizontal', w: 2, h: 1, x: 0, y: 2, face: '父',   ruby: 'ちち',       label: 'ちち' },
        { id: 'haha',    type: 'horizontal', w: 2, h: 1, x: 2, y: 2, face: '母',   ruby: 'はは',       label: 'はは' },
        { id: 'banto',   type: 'horizontal', w: 2, h: 1, x: 1, y: 3, face: '番頭', ruby: 'ばんとう',   label: 'ばんとう' },
        { id: 'jochu1',  type: 'small',      w: 1, h: 1, x: 0, y: 3, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
        { id: 'jochu2',  type: 'small',      w: 1, h: 1, x: 3, y: 3, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
        { id: 'decchi1', type: 'small',      w: 1, h: 1, x: 0, y: 4, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
        { id: 'decchi2', type: 'small',      w: 1, h: 1, x: 3, y: 4, face: '丁稚', ruby: 'でっち',     label: 'でっち' }
      ]
    },
    {
      id: 'furious', label: '激おこ', name: '両親激おこ', moves: 120, open: false,
      //  女 娘 娘 女
      //  祖 娘 娘 祖
      //  祖 父 父 祖
      //  丁 母 母 丁
      //  ・ 番 番 ・
      pieces: [
        { id: 'musume',  type: 'musume',     w: 2, h: 2, x: 1, y: 0, face: '娘',   ruby: 'むすめ',     label: 'むすめ' },
        { id: 'sofu',    type: 'vertical',   w: 1, h: 2, x: 0, y: 1, face: '祖父', ruby: 'そふ',       label: 'そふ' },
        { id: 'sobo',    type: 'vertical',   w: 1, h: 2, x: 3, y: 1, face: '祖母', ruby: 'そぼ',       label: 'そぼ' },
        { id: 'chichi',  type: 'horizontal', w: 2, h: 1, x: 1, y: 2, face: '父',   ruby: 'ちち',       label: 'ちち' },
        { id: 'haha',    type: 'horizontal', w: 2, h: 1, x: 1, y: 3, face: '母',   ruby: 'はは',       label: 'はは' },
        { id: 'banto',   type: 'horizontal', w: 2, h: 1, x: 1, y: 4, face: '番頭', ruby: 'ばんとう',   label: 'ばんとう' },
        { id: 'jochu1',  type: 'small',      w: 1, h: 1, x: 0, y: 0, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
        { id: 'jochu2',  type: 'small',      w: 1, h: 1, x: 3, y: 0, face: '女中', ruby: 'じょちゅう', label: 'じょちゅう' },
        { id: 'decchi1', type: 'small',      w: 1, h: 1, x: 0, y: 3, face: '丁稚', ruby: 'でっち',     label: 'でっち' },
        { id: 'decchi2', type: 'small',      w: 1, h: 1, x: 3, y: 3, face: '丁稚', ruby: 'でっち',     label: 'でっち' }
      ]
    }
  ];

  const KEY_OPEN  = 'fdl_hakoiri_open';    // おこ・激おこを開いたか
  const KEY_LEVEL = 'fdl_hakoiri_level';   // 最後に選んだむずかしさ
  const KEY_BEST  = 'fdl_hakoiri_best_';   // + むずかしさのid ＝ 自己最少手数


  // ================================================================
  // 保存
  // ================================================================
  //
  // 読めない・書けない環境（プライベートブラウズなど）でも遊べるようにする。
  // 開いたかどうかだけは、保存できなくてもその場では覚えておく。
  // そうしないと、保存できない人は永久に おこ・激おこ を開けない。

  let openedNow = false;   // この訪問の中で開いたか（保存できないとき用）

  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 続行する */ }
  }

  function isOpen() { return openedNow || load(KEY_OPEN) === '1'; }

  function markOpen() {
    openedNow = true;
    save(KEY_OPEN, '1');
  }


  // ================================================================
  // 画面
  // ================================================================

  const box      = document.getElementById('levels');
  const noteEl   = document.getElementById('levelNote');
  const goalEl   = document.getElementById('note');
  const unlockEl = document.getElementById('unlock');

  let current = LEVELS[0];
  let game = null;

  function canPlay(level) { return level.open || isOpen(); }

  /** ボタンを作る。押せるかどうかと、今どれを選んでいるかを毎回描き直す。 */
  function drawButtons() {
    box.textContent = '';
    for (const level of LEVELS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'level';
      el.textContent = level.label;
      // 読み上げには正式な名前と手数を渡す。画面には短い名前しか出さない
      el.setAttribute('aria-label', level.name + ' 最短' + level.moves + '手');
      if (level === current) el.setAttribute('aria-current', 'true');
      if (!canPlay(level)) {
        // まだ開いていないものは押せない。名前は薄く見せたままにして、
        // この先に何があるかだけ分かるようにしておく
        el.disabled = true;
        el.setAttribute('aria-label', level.name + '（まだ開いていません）');
      }
      el.addEventListener('click', () => select(level));
      box.appendChild(el);
    }
  }

  function drawNote() {
    noteEl.textContent = '最短 ' + current.moves + '手';
    goalEl.textContent = '最短は' + current.moves + '手。挑戦してみよう。';
  }

  function select(level) {
    if (!canPlay(level)) return;
    current = level;
    save(KEY_LEVEL, level.id);
    unlockEl.hidden = true;
    game.setLayout(level.pieces, KEY_BEST + level.id);
    drawButtons();
    drawNote();
  }


  // ================================================================
  // クリアしたとき
  // ================================================================

  function onClear() {
    if (isOpen()) return;          // もう開いている
    markOpen();
    drawButtons();                 // おこ・激おこを押せるようにする
    unlockEl.textContent = 'おこ と 激おこ が ひらいた！';
    unlockEl.hidden = false;
  }


  // ================================================================
  // 始める
  // ================================================================

  // 前に選んでいたむずかしさから始める。開いていないものが保存されていた
  // 場合（記録を手で消した、など）は標準に戻す。
  const saved = LEVELS.find(l => l.id === load(KEY_LEVEL));
  if (saved && canPlay(saved)) current = saved;

  game = KLOTSKI.start({
    bestKey: KEY_BEST + current.id,
    goalId: 'musume',
    // 出口は下辺の中央2マスなので x = 1、2マスの高さが最下段に収まる y = 3
    goal: { x: 1, y: 3 },
    pieces: current.pieces,
    onClear: onClear,

    // リザルト画面に出す文言。画面に出る日本語はここと index.html にしかない。
    text: {
      result:    (moves, time) => moves + '手 ・ ' + time,
      bestFirst: (moves)       => '自己最少 ' + moves + '手',
      bestKept:  (best)        => '自己最少 ' + best + '手',
      bestNew:   (prev)        => '新記録！ これまでは ' + prev + '手'
    }
  });

  drawButtons();
  drawNote();
})();
