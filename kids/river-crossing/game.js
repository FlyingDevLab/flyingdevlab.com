// ================================================================
// game.js – 川渡り（RIVER CROSSING）
// ================================================================
//
// こちら岸にいる みんなを、舟で むこう岸へ 運ぶパズル。
// ステージは4つあり、どれも最初から選べる。
//
// ★ 盤の仕組みは このファイルだけにある ★
//   箱入り娘・KLOTSKI・華容道の3本は /kids/shared/klotski.js を
//   共有しているが、このゲームは仕組みを分け合う相手がいない。
//   共有ファイルを作らなかったのは、使う側が1本しかないうちに
//   外へ出すと、何をそこへ置くべきかの線が引けないため。
//   同じパズルを2本目に作るときに切り出せばよい。
//
// ★ 手数は「川を渡った回数」 ★
//   舟に乗せる・降ろすは数えない。わたる を押して渡り切った回数だけ。
//   ルール違反で引き返した回は数えない。失敗は手数を汚さない。
//
// ★ ルール違反の見せ方 ★
//   違反になる組み合わせでも、舟は渡り切る。渡った先で何が起きるかを
//   出してから、約1.2秒後に自動で引き返す。
//   「押す前に止める」方式にしなかったのは、何が駄目なのかを
//   見せた方がこどもには伝わるため。戻すのは自動なので手が止まらない。
//   なお、誰も食べられないし、誰も泣かない。起きかけたところで引き返す。
//
// ★ 最短手数は総当たりで確かめた値 ★
//   7回 / 9回 / 11回 / 17回。幅優先探索で全状態を調べて確認した。
//   判定はこの実装と同じく「渡り終えた後の両岸」だけを見ている
//   （舟の中の組み合わせは見ていない。舟の上は一瞬であり、
//   そこまで咎めると こどもには理不尽に見えるため）。
//
//   3くみの親子だけは「漕げるのは親だけ」にすると解が消える。
//   総当たりで確かめたうえで、このステージは こどもも漕げることにした。
//
// ★ 時間は計らない ★
//   以前は手数の横に経過時間を出していたが、やめた。
//   動いている時計は、こどもにとって「急がなければいけない」という
//   合図になる。川渡しは急いで解くものではないし、
//   岸を眺めて誰を乗せるか考えている時間こそが中身である。
//   記録に残すのも手数だけにしている（箱入り娘ら3本も同じ扱い）。
//
// ★ 保存するもの ★
//   ステージごとの自己最少手数と、最後に選んだステージだけ。
//   盤面は保存しない。途中でやめたら最初からになる。
//   localStorage が使えない環境（プライベートモード等）では
//   記録が残らないだけで、遊ぶことはできる。
// ================================================================

(() => {
  'use strict';

  // 保存キー。形を変えるときは _v2 にして古い値を無視する
  const KEY_BEST = 'fdl_river_best_';
  const KEY_LAST = 'fdl_river_last';

  // 舟が渡るのにかける時間と、違反を見せてから引き返すまでの間
  const CROSS_MS = 550;
  const HOLD_MS  = 1200;

  // ── 駒と舟の絵 ────────────────────────────────────────────
  //
  // 絵は置いても置かなくてもよい。置いていなければ絵文字のまま遊べる。
  //
  // ★ なぜ images/ に置くのか ★
  //   /images/ は .gitignore で除外してあり、GitHub には上がらない。
  //   ここに絵を置けば、リポジトリをクローンした人の手元には絵が無く、
  //   そのまま絵文字で遊べる。自分で用意した絵を同じ名前で置けば、
  //   そちらに差し替わる。ハブのロゴ（/images/fdl-logo-192.png）と
  //   同じ置き方で、あちらは alt 文字が代わりを務めている。
  //
  // ★ 置いていないときに 404 を1回だけ出す ★
  //   まず boat.webp だけを試す。これが読めなければ、残りは一切
  //   読みにいかない。17回ではなく1回で済ませるため。
  //   読めたら残りも読み、1枚ずつ結果を覚える。
  //   揃っていない絵があっても、その駒だけ絵文字に戻る。
  //
  // ★ 約束ごと ★
  //   置き場所  /images/river-crossing/
  //   名前      下の art と、舟は boat
  //   形式      .webp（透過）
  //   大きさ    駒は正方形で 128px 以上、舟は横長で 480px 以上を推奨
  const ART_DIR = '/images/river-crossing/';
  const ART_EXT = '.webp';
  const ART_BOAT = 'boat';


  // ================================================================
  // ステージ表
  // ================================================================
  //
  //   short   … ステージ選択のボタンに出す短い名前と絵文字（と絵）。
  //             art はそのステージを代表する駒の絵を使い回している
  //             正式な名前（en / ja）は決まりごとの見出しに出す。
  //             狭い画面で4つ横に並べるため、ボタンには入り切らない
  //   par     … 最短手数（総当たりで確かめた値）
  //   seats   … 舟に乗れる人数
  //   rowers  … 漕げる人の id。null なら だれでも漕げる
  //   board   … 舟に乗せてよいかを見る（席の数だけで足りるなら無くてよい）
  //   check   … その岸に残してよいかを見る。駄目なら理由を返す
  //
  // board と check が返すのは { en, ja } の文言。null なら問題なし。
  // ================================================================

  const STAGES = [

    // ── 1. おおかみと やぎと キャベツ ──────────────────
    //   いちばん有名な川渡し。舟は せんどう＋1人。最短7回。
    {
      id: 'wolf',
      en: 'Wolf, Goat & Cabbage',
      ja: 'おおかみと やぎと キャベツ',
      short: { icon: '🐺', en: 'Wolf', ja: 'おおかみ', art: 'wolf' },
      par: 7,
      seats: 2,
      rowers: ['boatman'],
      actors: [
        { id: 'boatman', emoji: '🧑', en: 'Boatman', ja: 'せんどう', kind: 'person', art: 'boatman' },
        { id: 'wolf',    emoji: '🐺', en: 'Wolf',    ja: 'おおかみ', kind: 'beast', art: 'wolf' },
        { id: 'goat',    emoji: '🐐', en: 'Goat',    ja: 'やぎ',     kind: 'beast', art: 'goat' },
        { id: 'cabbage', emoji: '🥬', en: 'Cabbage', ja: 'キャベツ', kind: 'thing', art: 'cabbage' }
      ],
      rules: [
        { en: 'Only the boatman rows, with one passenger.',
          ja: 'こげるのは せんどう。のせられるのは ひとり。' },
        { en: 'Wolf left with goat: the goat is in trouble.',
          ja: 'おおかみと やぎを のこすと あぶない。' },
        { en: 'Goat left with cabbage: the cabbage is in trouble.',
          ja: 'やぎと キャベツを のこすと あぶない。' }
      ],
      check(bank) {
        if (bank.has('boatman')) return null;
        if (bank.has('wolf') && bank.has('goat')) {
          return { en: 'The wolf is going for the goat!', ja: 'おおかみが やぎを ねらってる！' };
        }
        if (bank.has('goat') && bank.has('cabbage')) {
          return { en: 'The goat is going for the cabbage!', ja: 'やぎが キャベツを かじろうとしてる！' };
        }
        return null;
      }
    },

    // ── 2. おとなと こども ────────────────────────────
    //   危ない組み合わせが1つも無いステージ。壁は舟の重さだけ。
    //   失敗が起きないので、違反の見せ方を知らないまま遊べる。最短9回。
    {
      id: 'weight',
      en: 'Grown-ups & Kids',
      ja: 'おとなと こども',
      short: { icon: '👦', en: 'Kids', ja: 'こども', art: 'boy' },
      par: 9,
      seats: 2,
      rowers: null,
      actors: [
        { id: 'adult1', emoji: '👨', en: 'Grown-up', ja: 'おとな', kind: 'adult', art: 'man' },
        { id: 'adult2', emoji: '👩', en: 'Grown-up', ja: 'おとな', kind: 'adult', art: 'woman' },
        { id: 'kid1',   emoji: '👦', en: 'Kid',      ja: 'こども', kind: 'kid', art: 'boy' },
        { id: 'kid2',   emoji: '👧', en: 'Kid',      ja: 'こども', kind: 'kid', art: 'girl' }
      ],
      rules: [
        { en: 'The boat holds one grown-up, or up to two kids.',
          ja: 'のれるのは おとな ひとり、または こども ふたりまで。' },
        { en: 'Anyone can row, and nobody is in danger here.',
          ja: 'だれでも こげる。あぶない くみあわせは ない。' }
      ],
      board(crew, actorOf) {
        let adults = 0;
        crew.forEach(id => { if (actorOf(id).kind === 'adult') adults += 1; });
        if (adults > 0 && adults < crew.size) {
          return { en: 'A grown-up and a kid are too heavy together.',
                   ja: 'おとなと こどもは いっしょに のれないよ。' };
        }
        if (adults > 1) {
          return { en: 'Only one grown-up fits.', ja: 'おとなは ひとりしか のれないよ。' };
        }
        return null;
      },
      check: null
    },

    // ── 3. 3くみの おやこ ─────────────────────────────
    //   よその親とふたりきりになると、こどもがこわがる。最短11回。
    //   古くは「嫉妬深い夫」として知られる問題を、親子に置き換えたもの。
    //   漕げる人を親だけに絞ると解が無くなるため、だれでも漕げる。
    {
      id: 'pairs',
      en: 'Three Parents & Kids',
      ja: '3くみの おやこ',
      short: { icon: '🐻', en: 'Parents', ja: 'おやこ', art: 'bear-parent' },
      par: 11,
      seats: 2,
      rowers: null,
      actors: [
        { id: 'bearP',   emoji: '🐻', en: 'Bear',   ja: 'おやぐま',   kind: 'parent', art: 'bear-parent' },
        { id: 'bearC',   emoji: '🐻', en: 'Cub',    ja: 'こぐま',     kind: 'child', parent: 'bearP', art: 'bear-child' },
        { id: 'rabbitP', emoji: '🐰', en: 'Rabbit', ja: 'おやうさぎ', kind: 'parent', art: 'rabbit-parent' },
        { id: 'rabbitC', emoji: '🐰', en: 'Bunny',  ja: 'こうさぎ',   kind: 'child', parent: 'rabbitP', art: 'rabbit-child' },
        { id: 'catP',    emoji: '🐱', en: 'Cat',    ja: 'おやねこ',   kind: 'parent', art: 'cat-parent' },
        { id: 'catC',    emoji: '🐱', en: 'Kitten', ja: 'こねこ',     kind: 'child', parent: 'catP', art: 'cat-child' }
      ],
      rules: [
        { en: 'The boat holds two. Anyone can row.',
          ja: 'ふねは ふたりのり。だれでも こげる。' },
        { en: 'A child is shy with somebody else’s parent.',
          ja: 'こどもは よその おやが にがて。' },
        { en: 'Never leave a child with another parent unless its own is there.',
          ja: 'じぶんの おやが いない ところに、よその おやと のこさない。' }
      ],
      check(bank) {
        for (const a of this.actors) {
          if (a.kind !== 'child' || !bank.has(a.id)) continue;
          if (bank.has(a.parent)) continue;
          for (const p of this.actors) {
            if (p.kind === 'parent' && p.id !== a.parent && bank.has(p.id)) {
              return { en: a.en + ' is shy without its parent!', ja: a.ja + 'が こわがってる！' };
            }
          }
        }
        return null;
      }
    },

    // ── 4. 8にんの いかだ ─────────────────────────────
    //   いちばん長い。最短17回。
    //   原型は「警官と泥棒」を含む形だが、こども向け領域なので
    //   せんせいと いぬ に置き換えてある。手数は変わらない。
    {
      id: 'raft',
      en: 'Eight on a Raft',
      ja: '8にんの いかだ',
      short: { icon: '🐕', en: 'Raft', ja: 'いかだ', art: 'dog' },
      par: 17,
      seats: 2,
      rowers: ['dad', 'mom', 'teacher'],
      actors: [
        { id: 'dad',     emoji: '👨',     en: 'Dad',      ja: 'おとうさん', kind: 'adult', art: 'man' },
        { id: 'mom',     emoji: '👩',     en: 'Mom',      ja: 'おかあさん', kind: 'adult', art: 'woman' },
        { id: 'boy1',    emoji: '👦',     en: 'Son',      ja: 'むすこ',     kind: 'son', art: 'boy' },
        { id: 'boy2',    emoji: '👦',     en: 'Son',      ja: 'むすこ',     kind: 'son', art: 'boy' },
        { id: 'girl1',   emoji: '👧',     en: 'Daughter', ja: 'むすめ',     kind: 'daughter', art: 'girl' },
        { id: 'girl2',   emoji: '👧',     en: 'Daughter', ja: 'むすめ',     kind: 'daughter', art: 'girl' },
        { id: 'teacher', emoji: '🧑‍🏫', en: 'Teacher',  ja: 'せんせい',   kind: 'adult', art: 'teacher' },
        { id: 'dog',     emoji: '🐕',     en: 'Dog',      ja: 'いぬ',       kind: 'dog', art: 'dog' }
      ],
      rules: [
        { en: 'Two on the raft. Only Dad, Mom and the teacher can row.',
          ja: 'いかだは ふたりのり。こげるのは おとうさん・おかあさん・せんせい。' },
        { en: 'Dad argues with a daughter when Mom is away.',
          ja: 'おとうさんと むすめは、おかあさんが いないと けんか。' },
        { en: 'Mom argues with a son when Dad is away.',
          ja: 'おかあさんと むすこは、おとうさんが いないと けんか。' },
        { en: 'The dog barks at everyone when the teacher is away.',
          ja: 'いぬは せんせいが いないと みんなに ほえる。' }
      ],
      check(bank) {
        const kindIn = (k) => this.actors.some(a => a.kind === k && bank.has(a.id));
        if (bank.has('dog') && !bank.has('teacher') && bank.size > 1) {
          return { en: 'The dog is barking at everyone!', ja: 'いぬが みんなに ほえてる！' };
        }
        if (bank.has('dad') && !bank.has('mom') && kindIn('daughter')) {
          return { en: 'Dad and his daughter are arguing!', ja: 'おとうさんと むすめが けんかしてる！' };
        }
        if (bank.has('mom') && !bank.has('dad') && kindIn('son')) {
          return { en: 'Mom and her son are arguing!', ja: 'おかあさんと むすこが けんかしてる！' };
        }
        return null;
      }
    }
  ];


  // ================================================================
  // 画面の部品
  // ================================================================

  const $ = (id) => document.getElementById(id);

  const el = {
    stages:  $('stages'),
    title:   $('stageTitle'),
    rules:   $('rules'),
    moves:   $('moves'),
    far:     $('tokensFar'),
    near:    $('tokensNear'),
    crew:    $('tokensBoat'),
    boat:    $('boat'),
    cross:   $('cross'),
    undo:    $('undo'),
    reset:   $('reset'),
    message: $('message'),
    clear:   $('clear'),
    result:  $('result'),
    best:    $('best'),
    note:    $('note'),
    again:   $('again'),
    next:    $('next')
  };


  // ================================================================
  // 遊んでいる間の状態
  // ================================================================
  //
  //   where   … 駒の id → 'near'（こちら岸）/ 'far'（むこう岸）/ 'boat'（舟の上）
  //   boatAt  … 舟が どちらの岸に 着けてあるか
  //   history … 渡る直前の状態。戻す と、違反で引き返すときに使う
  //   busy    … 舟が動いている間。この間は操作を受け付けない
  //   gen     … 盤の世代番号。ステージを変えるかやり直すたびに増える
  //
  // ★ gen が要る理由 ★
  //   渡る処理は setTimeout で「舟が着いたあと」を予約する。
  //   その待ち時間のうちにステージを切り替えると、予約していた後始末が
  //   新しい盤の上で動いてしまい、手数が1から始まり、戻す には
  //   前の盤の記録が残る（実際にそうなった）。
  //   予約した時点の gen を覚えておき、発火したときに変わっていたら
  //   何もせず捨てる。clearTimeout で消す手もあるが、予約は2段あり、
  //   消し忘れが起きやすい。増えた数を見るだけの方が取りこぼさない。
  // ================================================================

  let stage   = null;
  let byId    = Object.create(null);
  let where   = Object.create(null);
  let boatAt  = 'near';
  let moves   = 0;
  let history = [];
  let busy    = false;
  let done    = false;
  let gen     = 0;
  // 読み込めた絵の一覧。null は「まだ調べていない／置いていない」
  let artOk   = null;


  // ── 動きを減らす設定のときは、舟を滑らせずに瞬間移動させる ──
  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  const crossMs = () => (reduced() ? 0 : CROSS_MS);
  const holdMs  = () => (reduced() ? HOLD_MS + 400 : HOLD_MS);


  // ================================================================
  // 保存（読めなくても書けなくても遊べる）
  // ================================================================

  function load(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* 使えないだけ */ }
  }
  function loadBest(id) {
    const n = parseInt(load(KEY_BEST + id), 10);
    return (isFinite(n) && n > 0) ? n : null;
  }


  // ================================================================
  // 盤の読み取り
  // ================================================================

  function bank(side) {
    const s = new Set();
    for (const id in where) if (where[id] === side) s.add(id);
    return s;
  }
  function crewSet() { return bank('boat'); }

  function hasRower(crew) {
    if (!stage.rowers) return crew.size > 0;
    for (const id of crew) if (stage.rowers.indexOf(id) >= 0) return true;
    return false;
  }

  function snapshot() {
    return { where: Object.assign(Object.create(null), where), boatAt: boatAt };
  }
  function restore(s) {
    where  = Object.assign(Object.create(null), s.where);
    boatAt = s.boatAt;
  }


  // ================================================================
  // 描き直し
  // ================================================================
  //
  // 駒は毎回 作り直している。岸と舟の間を行き来するため、
  // 作り直した方が置き場所の取り違えが起きない。
  // ただしキーボードで操作している人の居場所が飛ぶので、
  // 直前に触れていた駒へフォーカスを戻している。
  // ================================================================

  function render() {
    const held = (document.activeElement && document.activeElement.dataset)
      ? document.activeElement.dataset.actor : null;

    el.far.textContent  = '';
    el.near.textContent = '';
    el.crew.textContent = '';

    stage.actors.forEach(a => {
      const box = where[a.id] === 'boat' ? el.crew
                : where[a.id] === 'far'  ? el.far
                : el.near;
      box.appendChild(token(a));
    });

    // 空いている席。何人まで乗れるかを 見ただけで分かるようにする
    const empty = stage.seats - crewSet().size;
    for (let i = 0; i < empty; i++) {
      const seat = document.createElement('span');
      seat.className = 'seat';
      seat.setAttribute('aria-hidden', 'true');
      el.crew.appendChild(seat);
    }

    el.boat.classList.toggle('at-far',  boatAt === 'far');
    el.boat.classList.toggle('at-near', boatAt === 'near');

    el.moves.textContent = String(moves);
    // busy（舟が動いている間）では disabled にしない。
    // 押したボタンがその場で無効になると、キーボードの居場所が body へ
    // 飛んでしまい、渡るたびに Tab を押し直すことになる。
    // 舟が動いている間の操作は、各処理の先頭の busy 判定が弾いている。
    el.cross.disabled = done || crewSet().size === 0;
    el.undo.disabled  = done || history.length === 0;

    if (held) {
      const back = el.far.querySelector('[data-actor="' + held + '"]')
                || el.near.querySelector('[data-actor="' + held + '"]')
                || el.crew.querySelector('[data-actor="' + held + '"]');
      if (back && !back.disabled) back.focus();
    }
  }

  function token(a) {
    const place = where[a.id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'token token--' + a.kind;
    b.dataset.actor = a.id;
    // 舟が着いていない岸の駒には触れない。触れても何も起きない方が迷う。
    // busy を混ぜていないのは上のボタンと同じ理由で、舟に乗っている駒に
    // フォーカスを当てたまま渡れるようにするため
    b.disabled = done || (place !== 'boat' && place !== boatAt);
    b.setAttribute('aria-label', a.en + ' / ' + a.ja + ' – ' + (
      place === 'boat' ? 'in the boat' : place === 'far' ? 'far side' : 'this side'
    ));

    // 顔。絵があれば絵、無ければ絵文字。
    // どちらも aria-hidden で、読み上げには下の名前と aria-label が使われる
    const face = document.createElement('span');
    face.className = 'token-face';
    face.setAttribute('aria-hidden', 'true');
    if (artOk && artOk[a.art]) {
      const im = document.createElement('img');
      im.className = 'token-art';
      im.src = ART_DIR + a.art + ART_EXT;
      im.alt = '';
      im.decoding = 'async';
      // 調べたあとで消された場合に備えて、ここでも絵文字へ戻せるようにする
      im.addEventListener('error', () => {
        im.remove();
        face.textContent = a.emoji;
      });
      face.appendChild(im);
    } else {
      face.textContent = a.emoji;
    }

    const en = document.createElement('span');
    en.className = 'token-en';
    en.textContent = a.en;

    const ja = document.createElement('span');
    ja.className = 'token-ja';
    ja.lang = 'ja';
    ja.textContent = a.ja;

    b.appendChild(face);
    b.appendChild(en);
    b.appendChild(ja);
    b.addEventListener('click', () => tap(a.id));
    return b;
  }

  // 言いたいことを1つだけ出す場所。常に置いてあり、空のときは何も見えない。
  // hidden にしないのは、読み上げの live 領域は隠すと伝わらなくなるため。
  function say(msg) {
    el.message.textContent = '';
    el.message.classList.toggle('is-on', !!msg);
    if (!msg) return;
    const en = document.createElement('span');
    en.textContent = msg.en;
    const ja = document.createElement('span');
    ja.className = 'ja';
    ja.lang = 'ja';
    ja.textContent = msg.ja;
    el.message.appendChild(en);
    el.message.appendChild(ja);
  }


  // ================================================================
  // 操作
  // ================================================================

  // 駒をタップする。岸にいれば舟へ、舟にいれば今いる側の岸へ。
  function tap(id) {
    if (busy || done) return;

    if (where[id] === 'boat') {
      where[id] = boatAt;
      say(null);
      render();
      return;
    }
    if (where[id] !== boatAt) return;

    const next = crewSet();
    next.add(id);

    if (next.size > stage.seats) {
      say({ en: 'The boat is full.', ja: 'ふねは もう いっぱいだよ。' });
      return;
    }
    if (stage.board) {
      const no = stage.board.call(stage, next, (x) => byId[x]);
      if (no) { say(no); return; }
    }

    where[id] = 'boat';
    say(null);
    render();
  }

  // 渡る。渡り切ってから、両岸に残った顔ぶれを見る。
  function cross() {
    if (busy || done) return;

    const crew = crewSet();
    if (crew.size === 0) return;

    // 漕げる人がいないときは、ここで初めて理由を伝える。
    // ボタンを押せなくしてしまうと、なぜ進めないのかが分からない。
    if (!hasRower(crew)) {
      say({ en: 'Nobody in the boat can row it.', ja: 'この ふねを こげる ひとが いないよ。' });
      return;
    }

    const before = snapshot();
    const myGen = gen;
    // 渡り終えると舟が空になり、わたる が押せなくなる。
    // キーボードで わたる を押していた場合、そこで居場所が body へ飛ぶ。
    // 押していたのが わたる だったときだけ、着いた岸の最初の駒へ移す。
    // マウスで押したときも同じ処理が走るが、直前の操作がマウスなら
    // :focus-visible が当たらないため、輪郭は出ない。
    const fromCross = (document.activeElement === el.cross);
    busy = true;
    say(null);

    // 舟の居場所だけ先に変える。乗っている面々は舟に乗ったまま一緒に滑る
    boatAt = (boatAt === 'near') ? 'far' : 'near';
    render();

    window.setTimeout(() => {
      if (myGen !== gen) return;                     // 盤が入れ替わっていた
      crew.forEach(id => { where[id] = boatAt; });   // 着いた岸で降りる
      render();

      const bad = stage.check
        ? (stage.check.call(stage, bank('near')) || stage.check.call(stage, bank('far')))
        : null;

      if (bad) {
        // 起きかけたところを見せてから、乗り直して引き返す。
        // before は「乗ったまま、前の岸にいる」状態なので、
        // 戻すとそのまま舟に乗り直して帰る絵になる。
        say(bad);
        window.setTimeout(() => {
          if (myGen !== gen) return;                 // 盤が入れ替わっていた
          restore(before);
          busy = false;
          render();
        }, holdMs());
        return;
      }

      moves += 1;
      history.push(before);
      busy = false;
      render();

      if (bank('far').size === stage.actors.length) { win(); return; }

      // 「わたる が押せなくなったか」で判断している。
      // 「フォーカスが body へ落ちたか」で判断すると空振りする。
      // ボタンを disabled にしても、その場では activeElement が
      // まだそのボタンのままで、body へ移るのは少しあとになるため。
      if (fromCross && el.cross.disabled) {
        const nextBox = (boatAt === 'far') ? el.far : el.near;
        const first = nextBox.querySelector('[data-actor]:not(:disabled)');
        if (first) first.focus();
      }
    }, crossMs());
  }

  function undo() {
    if (busy || done || history.length === 0) return;
    restore(history.pop());
    moves = Math.max(0, moves - 1);
    say(null);
    render();
  }


  // ================================================================
  // クリア
  // ================================================================

  function win() {
    done = true;

    const best   = loadBest(stage.id);
    const record = (best === null || moves < best);
    if (record) save(KEY_BEST + stage.id, String(moves));

    pair(el.result,
      moves + ' crossings',
      moves + 'かいで わたりきった');

    pair(el.best,
      record ? 'New best!' : 'Your best: ' + best + ' crossings',
      record ? 'あたらしい きろく！' : 'いままでの さいこう：' + best + 'かい');

    pair(el.note,
      moves === stage.par
        ? 'That is the shortest way there is.'
        : 'The shortest way is ' + stage.par + ' crossings.',
      moves === stage.par
        ? 'これが いちばん みじかい わたりかた。'
        : 'いちばん みじかい わたりかたは ' + stage.par + 'かい。');

    const i = STAGES.indexOf(stage);
    el.next.hidden = (i >= STAGES.length - 1);

    el.clear.hidden = false;
    el.again.focus();
  }

  // 英語と日本語を1行ずつ入れる
  function pair(box, enText, jaText) {
    box.textContent = '';
    const en = document.createElement('span');
    en.textContent = enText;
    const ja = document.createElement('span');
    ja.className = 'ja';
    ja.lang = 'ja';
    ja.textContent = jaText;
    box.appendChild(en);
    box.appendChild(ja);
  }


  // ================================================================
  // ステージの組み立て
  // ================================================================

  function buildStages() {
    el.stages.textContent = '';
    STAGES.forEach((st, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage-btn' + (st === stage ? ' is-on' : '');
      b.setAttribute('aria-pressed', st === stage ? 'true' : 'false');

      // ボタンに出すのは短い名前。正式な名前は決まりごとの見出しに出る。
      // 読み上げには番号と正式な名前を渡す（短い名前だけでは足りない）
      b.setAttribute('aria-label', 'Stage ' + (i + 1) + ': ' + st.en + ' / ' + st.ja);

      const no = document.createElement('span');
      no.className = 'stage-no';
      no.setAttribute('aria-hidden', 'true');
      no.textContent = String(i + 1);

      // 駒と同じで、絵があれば絵、無ければ絵文字
      const icon = document.createElement('span');
      icon.className = 'stage-icon';
      icon.setAttribute('aria-hidden', 'true');
      if (artOk && artOk[st.short.art]) {
        const im = document.createElement('img');
        im.className = 'stage-art';
        im.src = ART_DIR + st.short.art + ART_EXT;
        im.alt = '';
        im.decoding = 'async';
        im.addEventListener('error', () => { im.remove(); icon.textContent = st.short.icon; });
        icon.appendChild(im);
      } else {
        icon.textContent = st.short.icon;
      }

      const en = document.createElement('span');
      en.className = 'stage-en';
      en.setAttribute('aria-hidden', 'true');
      en.textContent = st.short.en;

      const ja = document.createElement('span');
      ja.className = 'stage-ja';
      ja.lang = 'ja';
      ja.setAttribute('aria-hidden', 'true');
      ja.textContent = st.short.ja;

      b.appendChild(no);
      b.appendChild(icon);
      b.appendChild(en);
      b.appendChild(ja);
      b.addEventListener('click', () => { if (st !== stage) setStage(st); });
      el.stages.appendChild(b);
    });
  }

  function buildRules() {
    pair(el.title, stage.en, stage.ja);
    el.rules.textContent = '';
    stage.rules.forEach(r => {
      const li = document.createElement('li');
      pair(li, r.en, r.ja);
      el.rules.appendChild(li);
    });
    const li = document.createElement('li');
    li.className = 'rules-par';
    const best = loadBest(stage.id);
    pair(li,
      'Shortest: ' + stage.par + ' crossings' + (best !== null ? '  ·  your best: ' + best : ''),
      'さいたん：' + stage.par + 'かい' + (best !== null ? '　／　じぶんの さいこう：' + best + 'かい' : ''));
    el.rules.appendChild(li);
  }

  function setStage(st) {
    stage = st;
    byId = Object.create(null);
    stage.actors.forEach(a => { byId[a.id] = a; });
    save(KEY_LAST, st.id);
    buildStages();
    restart();
  }

  function restart() {
    gen += 1;
    where = Object.create(null);
    stage.actors.forEach(a => { where[a.id] = 'near'; });
    boatAt  = 'near';
    moves   = 0;
    history = [];
    busy    = false;
    done    = false;
    el.clear.hidden = true;
    buildRules();
    say(null);
    render();
  }


  // ================================================================
  // 絵を探す
  // ================================================================
  //
  // 盤はもう絵文字で描き終わっている。絵が見つかったときだけ描き直す。
  // 先に絵を待ってから描くと、置いていない人の画面が
  // 読み込みの間なにも出ないまま止まる。
  // ================================================================

  function findArt() {
    const probe = new Image();
    probe.addEventListener('error', () => { /* 置いていない。絵文字のまま */ });
    probe.addEventListener('load', () => {
      const names = [];
      STAGES.forEach(st => st.actors.forEach(a => {
        if (a.art && names.indexOf(a.art) < 0) names.push(a.art);
      }));
      const found = Object.create(null);
      let left = names.length;
      const settle = () => {
        if (--left > 0) return;
        artOk = found;
        // 絵のときの舟は幅も置き場所も変わる。そのまま class を足すと、
        // 絵文字のときの位置から新しい位置まで 0.55 秒かけて滑ってしまう。
        // この1回だけ動きを止めて、瞬間的に入れ替える。
        el.boat.style.transition = 'none';
        el.boat.classList.add('has-art');
        // 川の広さも絵のときだけ変える。CSS から川に届くように、
        // いちばん外側の <html> に目印を付けておく
        document.documentElement.classList.add('art-on');
        void el.boat.offsetWidth;          // ここまでを一度描かせる
        el.boat.style.transition = '';
        buildStages();
        render();
      };
      names.forEach(n => {
        const im = new Image();
        im.addEventListener('load',  () => { found[n] = true; settle(); });
        im.addEventListener('error', () => { settle(); });
        im.src = ART_DIR + n + ART_EXT;
      });
    });
    probe.src = ART_DIR + ART_BOAT + ART_EXT;
  }


  // ================================================================
  // 立ち上げ
  // ================================================================

  el.cross.addEventListener('click', cross);
  el.undo.addEventListener('click', undo);
  el.reset.addEventListener('click', restart);
  el.again.addEventListener('click', restart);
  el.next.addEventListener('click', () => {
    const i = STAGES.indexOf(stage);
    if (i < STAGES.length - 1) setStage(STAGES[i + 1]);
  });

  const last = load(KEY_LAST);
  setStage(STAGES.find(s => s.id === last) || STAGES[0]);
  findArt();
})();
