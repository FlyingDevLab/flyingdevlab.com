// ================================================================
// chess-lessons.js – チェスのレッスン画面、共通の仕組み
// ================================================================
//
// 役わり分け。
//   /kids/shared/chess.js           ルールの判定だけ。DOM を知らない
//   /kids/shared/chess-lessons.js   盤を描き、押されたのを受け、課題を見る（これ）
//   /kids/shared/chess-lessons.css  その見た目
//   各巻の lessons.js               その巻の文章・盤・できたの条件だけ
//
// ★ 巻をまたいで共有している ★
//   /kids/chess/           01巻 基礎知識
//   /kids/chess-tactics/   02巻 戦術
//   /kids/chess-openings/  03巻 序盤
//   /kids/chess-play/      あそぶ（巻ではなくタブ）
//
//   この1本を巻ごとに写すと、片方で見つけた不具合を何度も直すことになり、
//   1つ直し忘れると「同じ作りなのに巻によって挙動が違う」という、
//   いちばん気づきにくい壊れ方をする。箱入り娘の3本が klotski.js を
//   共有しているのと同じ理屈である。
//
//   ★ ここを直すとチェスの全巻が変わる。直したら全部の巻を開いて確かめること。
//
// このファイルにチェスのルールを書かない。
// 「ナイトはどう動くか」を知っているのは chess.js だけで、
// こちらは legalMoves が返してきた手しか盤に出さない。
// 両方にルールを書くと、片方だけ直した日に
// 「印は出るのに指せない」という形で食い違う。
//
// ★ 鍵を掛けていない ★
//   どのレッスンもいつでも開ける。localStorage に置くのは
//   「見たレッスンに ✓ を付ける」だけで、消えても開くところは変わらない。
//   理由は index.html の設計メモに書いた。
//
// ★ 相手は考えない ★
//   先を読む仕組み（探索）も、良し悪しを点数にする仕組み（評価）も入っていない。
//   駒の動きを覚える章（2章）は still のレッスンで、相手の駒は動かない。
//   動く的を追いかけさせると、覚えたい「駒の動き」より
//   「逃げる的の読み」が主題になってしまう。
//   棋譜の章は、白と黒の両方を自分で指す。
//
//   自動で相手が動くのは2回だけ。
//   ・20「ひきわけと とうりょう」 … 黒のキングが逃げる（fleeMove）
//   ・おまけ「コンピュータと さす」 … 黒が決まりごとで指す（/kids/shared/chess-cpu.js）
//   どちらも先は読まない。
//
//   20のほうは「次に自分が動ける数がいちばん多い所へ逃げる」
//   という決まりごとを1つ当てているだけである（fleeMove）。
//   あの回は詰みの形が存在しない駒組みなので、でたらめに動かしても成立する。
//   決まりごとを置いたのはステイルメイトを避けるためで、
//   理由はその関数の上に書いた。
//
// ★ 棋譜をまちがえた手は、盤に乗せない ★
//   「きふの とおりに さす」課題では、ちがう手を指そうとしても
//   盤は動かさず、何を指そうとしたかだけを伝える。
//   いったん動かしてから戻す作りにすると、
//   まちがいが一度 盤の上の事実になってしまい、
//   読み直すときに「どこまでが正しい形か」が分からなくなる。
// ================================================================

(function () {
  'use strict';

  var C = window.Chess;
  var DATA = window.CHESS_LESSONS;

  // ----------------------------------------------------------------
  // 01. 道具
  // ----------------------------------------------------------------

  function el(id) { return document.getElementById(id); }

  var ui = {
    volumes:    el('volumes'),
    toc:        el('toc'),
    lessonNo:   el('lessonNo'),
    title:      el('lessonTitle'),
    body:       el('lessonBody'),
    task:       el('task'),
    sets:       el('sets'),
    hint:       el('hint'),
    board:      el('board'),
    ranks:      el('ranks'),
    files:      el('files'),
    palette:    el('palette'),
    paletteBox: el('paletteChoices'),
    promo:      el('promo'),
    promoBox:   el('promoChoices'),
    done:       el('done'),
    doneTitle:  el('doneTitle'),
    doneNote:   el('doneNote'),
    retry:      el('retry'),
    advance:    el('advance'),
    message:    el('message'),
    level:      el('level'),
    undo:       el('undo'),
    forward:    el('forward'),
    reset:      el('reset'),
    record:     el('recordText'),
    recordHint: el('recordHint'),
    copy:       el('copy'),
    sound:      el('sound'),
    prev:       el('prev'),
    next:       el('next')
  };

  var PIECE_EN = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
  var PIECE_JA = { K: 'キング', Q: 'クイーン', R: 'ルーク', B: 'ビショップ', N: 'ナイト', P: 'ポーン' };

  // 英語と日本語を1行に並べる。画面に出す短い文はすべてこれを通す
  function say(en, ja, tone) {
    ui.message.className = 'message' + (tone ? ' ' + tone : '');
    ui.message.innerHTML = '';
    ui.message.appendChild(document.createTextNode(en));
    if (ja) {
      var s = document.createElement('span');
      s.className = 'ja';
      s.lang = 'ja';
      s.textContent = ja;
      ui.message.appendChild(document.createTextNode(' '));
      ui.message.appendChild(s);
    }
  }
  function clearSay() { say('', ''); }

  // 指した手の音。取ったか、チェックになったかで鳴らし分ける。
  //
  // ★ 音でしか分からないことを作らない ★
  //   指した手は盤の印と棋譜に必ず出る。音はその控えでしかない。
  //   耳が使えなくても、音を消していても、失われる情報は無い。
  //   鳴らす仕掛けそのものは chess-sound.js にある（読み込んでいない
  //   ページでは、ここが黙って何もしない）。
  function sayMoveSound(move, after) {
    var snd = window.ChessSound;
    if (!snd) return;
    if (C.status(after).over) return snd.over();
    if (C.inCheck(after, after.turn)) return snd.check();
    if (move && move.captured) return snd.capture();
    snd.move();
  }

  // 駒を1つ置いた・取り除いたときの音（並べる回と ならべて あそぶ）
  function sayPlaceSound() {
    if (window.ChessSound) window.ChessSound.move();
  }

  // 英語の見出し＋日本語の添え書き。<i class="ja"> を使う形に揃える
  function bi(node, en, ja) {
    node.textContent = en;
    if (ja) {
      var i = document.createElement('i');
      i.className = 'ja';
      i.lang = 'ja';
      i.textContent = ja;
      node.appendChild(i);
    }
    return node;
  }

  function pieceSvg(piece) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'piece piece--' + C.colorOf(piece));
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    // href と xlink:href を両方入れる。古い Safari は href を見ない
    use.setAttribute('href', '#pc-' + C.typeOf(piece));
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#pc-' + C.typeOf(piece));
    svg.appendChild(use);
    return svg;
  }


  // ----------------------------------------------------------------
  // 02. 見たレッスンの ✓
  // ----------------------------------------------------------------
  //
  // プライベートモードでは localStorage に触るだけで例外が出る環境がある。
  // 読み書きの両方を try で包み、失敗したら黙って無しとして続ける。
  // ここが無くてもレッスンは全部開く（それがこの作りの要点）。

  // 巻ごとに分ける。1巻の ✓ が2巻に出てしまわないように
  var SEEN_KEY = 'fdl_chess' + ((DATA.volume && DATA.volume.no) || 1) + '_seen';

  function readSeen() {
    try {
      var raw = window.localStorage.getItem(SEEN_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeSeen(map) {
    try { window.localStorage.setItem(SEEN_KEY, JSON.stringify(map)); } catch (e) { /* 使えないだけ */ }
  }

  var seen = readSeen();


  // ----------------------------------------------------------------
  // 02b. つよさの段（「あそぶ」でコンピュータと指すとき）
  // ----------------------------------------------------------------
  //
  // 勝ったら1つ上がり、負けたら2つ下がる（下限1・上限5）。
  // 強さを選ぶ画面は置いていない。選ばせると、こどもは自分に
  // 合う段を知らないまま選ぶことになる。指した結果のほうが正しい。
  //
  // ★ 負けを −2 にしてある理由 ★
  //   勝ち +1・負け −2 だと、実力よりすこし下に落ち着く。
  //   子ども向けにはその偏りが良い。勝てない相手と続けて指しても
  //   覚えることは増えないが、たまに勝てる相手となら続く。
  //   1つずつ上下させると、実力が拮抗したところで勝ったり負けたりが
  //   続き、ゆるい局がいつまでも来ない。
  //
  // ★ 消えても困らない ★
  //   localStorage が使えない環境では、毎回まんなか（3段）から始まる。
  //   段が巻の進み方に影響することは無い。
  var LEVEL_KEY = 'fdl_chess_level';
  var LEVEL_MIN = 1, LEVEL_MAX = 5, LEVEL_START = 3;

  function readLevel() {
    try {
      var n = parseInt(window.localStorage.getItem(LEVEL_KEY), 10);
      if (n >= LEVEL_MIN && n <= LEVEL_MAX) return n;
    } catch (e) { /* 使えないだけ */ }
    return LEVEL_START;
  }
  function writeLevel(n) {
    try { window.localStorage.setItem(LEVEL_KEY, String(n)); } catch (e) { /* 使えないだけ */ }
  }

  var level = readLevel();

  // 決着がついたときに呼ぶ。winner は 'w'（こちらの勝ち）/'b'/null
  function moveLevel(winner) {
    if (!window.ChessAi) return;          // 決まりごとの相手に段は無い
    var was = level;
    if (winner === 'w') level = Math.min(LEVEL_MAX, level + 1);
    else if (winner === 'b') level = Math.max(LEVEL_MIN, level - 2);
    if (level === was) return;
    writeLevel(level);
    paintLevel();
  }

  // 音の入り切り。読み込んでいないページではボタンごと隠す
  function paintSound() {
    if (!ui.sound) return;
    if (!window.ChessSound) { ui.sound.hidden = true; return; }
    var on = window.ChessSound.isOn();
    ui.sound.classList.toggle('off', !on);
    ui.sound.setAttribute('aria-pressed', on ? 'true' : 'false');
    ui.sound.setAttribute('aria-label',
      on ? 'Turn the piece sound off / こまの おとを けす'
         : 'Turn the piece sound on / こまの おとを つける');
  }

  function paintLevel() {
    if (!ui.level) return;
    ui.level.hidden = !window.ChessAi;
    if (!window.ChessAi) return;
    bi(ui.level, 'Strength ' + level + ' / ' + LEVEL_MAX, 'つよさ ' + level + ' / ' + LEVEL_MAX);
  }

  function markSeen(i) {
    if (seen[i]) return;
    seen[i] = 1;
    writeSeen(seen);
    paintToc();
  }


  // 1つ分の呼び名。巻は「Lesson」だが、「あそぶ」で選ぶのはレッスンではなく
  // 指し方（モード）なので、lessons.js の volume に unitEn を書いて差し替える。
  // 書かなければ Lesson のまま（01〜03巻はどれも書いていない）。
  //
  // 英語にだけ出る。日本語側は章の名前がそのまま入るので、
  // ここで日本語を持つと、使われない組が1つ増えるだけになる。
  var UNIT_EN = (DATA.volume && DATA.volume.unitEn) || 'Lesson';


  // ----------------------------------------------------------------
  // 03. いまの状態
  // ----------------------------------------------------------------

  var S = {
    index:   0,
    lesson:  null,
    start:   null,   // そのレッスンの最初の局面
    pos:     null,
    past:    [],     // もどすため。{ pos, san, color }
    record:  [],     // 棋譜。{ san, color }
    pick:    -1,     // 持ち上げている駒のマス
    askAt:   0,      // squares 課題の何問目か
    hit:     {},     // squares 課題で押せたマス
    lineAt:  0,      // line 課題の何手目か
    hinted:  false,  // ヒントを押したか（押した回だけ印を出す）
    held:    '',     // 並べるレッスンでつまんでいる駒
    placed:  {},     // 並べるレッスンで自分が置いたマス（取り除けるのはここだけ）
    waiting: null,   // プロモーションの行き先待ち { from, to }
    replay:  null,   // { list:[局面], sans:[], at:0 }
    chased:  0,      // 追いかけ回（chase）で自分が指した手数
    setAt:   0,      // 追いかけ回で選んでいる駒のくみあわせ
    phase:   'setup',// ならべて あそぶ：'setup'（並べている）→ 'play'（指している）
    vsCpu:   false,  // ならべて あそぶ：黒をコンピュータが指すか
    arrFen:  '',     // ならべて あそぶ：並べ終えた盤（やりなおすと、ここへ戻る）
    keepFen: '',     // やりなおしで並べ直しに戻るときだけ入る
    ansAt:   0,      // win.answers の何手めまで進んだか（偶数=白の番、奇数=黒が自動で指す番）
    last:    null,   // 直前に指した手 { from, to }。盤に印を出すため
    scored:  false,  // この局の決着で、つよさの段をもう動かしたか
    waitBlack: false,// 黒が逃げるのを見せている最中。そのあいだ盤は触れない
    timer:   0,      // 黒を動かすまでの待ち。レッスンを変えたら必ず止める
    done:    false
  };

  function lesson() { return S.lesson; }
  // 始まりの盤。追いかけ回だけ、選んだくみあわせで変わる
  function startFen() {
    var g = S.lesson.goal;
    if (g.sets && g.sets[S.setAt]) return g.sets[S.setAt].fen;
    return S.lesson.fen;
  }
  function goal() { return S.lesson.goal; }
  function win() { return goal().win || {}; }

  // いま解いている問題のこたえ。
  // くみあわせを選べる回（おまけ）では、選んだものに こたえが付いている。
  // win.answer を直に見ると、問題を切り替えても最初のこたえのままになる
  function answerNow() {
    var g = goal();
    var set = g.sets && g.sets[S.setAt];
    if (set && set.answer) return set.answer;
    var w = g.win || {};
    // 詰みまで指させる問題。win.answers は「白 黒 白 …」の順に全部書く。
    // 白の番だけ答えを返し、黒の番は盤が自動で指すので空にする
    if (w.answers) return (S.ansAt % 2 === 0) ? (w.answers[S.ansAt] || '') : '';
    return w.answer;
  }


  // ----------------------------------------------------------------
  // 04. 目次
  // ----------------------------------------------------------------
  //
  // 章ごとに見出しを置き、その下にレッスンの番号を並べる。
  // 番号だけにしているのは、23のレッスン名を狭い画面に並べると
  // 目次だけで画面が1つ埋まるため。開いたレッスンの名前は下に大きく出る。

  // 巻のボタン。1枚のハブカードから入って、ここで巻を選ぶ。
  // ハブに巻ごとのカードを並べると、一覧がチェスで埋まるため
  function paintVolumes() {
    if (!ui.volumes || !DATA.volumes) return;
    ui.volumes.innerHTML = '';
    DATA.volumes.forEach(function (v) {
      var here = v.no === (DATA.volume && DATA.volume.no);
      var node = document.createElement(here ? 'span' : 'a');
      if (!here) node.href = v.url;
      node.className = 'vol-btn' + (here ? ' current' : '');
      // 「あそぶ」は巻ではなくタブ。vol. を付けない
      bi(node, (v.tab ? '' : 'vol.' + v.no + ' ') + v.en, v.ja);
      if (here) node.setAttribute('aria-current', 'page');
      ui.volumes.appendChild(node);
    });
  }

  var tocButtons = [];

  function buildToc() {
    ui.toc.innerHTML = '';
    tocButtons = [];
    DATA.chapters.forEach(function (ch, ci) {
      var box = document.createElement('div');
      box.className = 'toc-chapter';

      var head = document.createElement('p');
      head.className = 'toc-head';
      bi(head, ch.en, ch.ja);
      box.appendChild(head);

      var row = document.createElement('div');
      row.className = 'toc-row';
      DATA.lessons.forEach(function (les, li) {
        if (les.chapter !== ci) return;
        var b = document.createElement('button');
        b.type = 'button';
        // 用語の章（named）は、番号ではなく名前を出す。
        //
        // ★ 章ごとに分けている理由 ★
        //   目次を番号だけにしてあるのは、レッスン名を狭い画面に並べると
        //   目次だけで画面が1つ埋まるため（その判断は今も変えていない）。
        //   ただし「名前の ある じょばん」のように、題が名前である章だけは、
        //   番号にすると何の回なのかが目次から消える。
        //   イタリアン・ルイロペスを覚える回が 7 8 としか出ていない形が それ。
        //
        //   出し分けの境目は「その章の題が名前か、説明文か」。
        //     名前（駒の名前・序盤の名前・対局の名前）… 名前を出す
        //     説明文（中央を とる 等）              … 番号のまま
        //   説明文の章を名前にしても、長い題が並んで目次が伸びるだけで、
        //   目次から辿れるようになるものが無い。
        //
        // ★ 出し分けは章ごと。1つの章の中では混ぜない ★
        //   名前の章に説明文の題が1つ混ざることはある
        //   （03巻4章の「さいごを 自分で」）。それでも章ごと名前に揃える。
        //   1つの章の中で番号と名前が隣り合うと、揃っていないものが
        //   並んでいるようにしか見えないため。
        if (ch.named) {
          b.className = 'toc-btn toc-btn--named';
          bi(b, les.en, les.ja);
        } else {
          b.className = 'toc-btn';
          b.textContent = String(li + 1);
        }
        // 読み上げは名前を出す章でも番号から言う。
        // 「レッスン7のイタリアン」と、目次の中の居場所が先に分かる形にする
        b.setAttribute('aria-label', UNIT_EN + ' ' + (li + 1) + ': ' + les.en);
        b.addEventListener('click', function () { open(li); });
        row.appendChild(b);
        tocButtons[li] = b;
      });
      box.appendChild(row);
      ui.toc.appendChild(box);
    });
    paintToc();
  }

  function paintToc() {
    tocButtons.forEach(function (b, i) {
      if (!b) return;
      b.classList.toggle('current', i === S.index);
      b.classList.toggle('seen', !!seen[i]);
      if (i === S.index) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }


  // ----------------------------------------------------------------
  // 05. レッスンを開く
  // ----------------------------------------------------------------

  function open(i) {
    if (i < 0 || i >= DATA.lessons.length) return;
    S.index = i;
    S.lesson = DATA.lessons[i];
    S.setAt = 0;
    markSeen(i);
    paintToc();
    writeLesson();
    restart();
    // 読むところまで戻す。目次を押したあと盤だけが変わって
    // 気づかない、という形にしないため
    if (ui.title.scrollIntoView) ui.title.scrollIntoView({ block: 'start' });
  }

  function writeLesson() {
    var les = lesson();
    var ch = DATA.chapters[les.chapter];

    // 章の名前もここで英語と日本語を並べる。英語だけの行を作らない
    bi(ui.lessonNo,
       UNIT_EN + ' ' + (S.index + 1) + ' / ' + DATA.lessons.length + '  ·  ' + ch.en,
       ch.ja);
    bi(ui.title, les.en, les.ja);

    ui.body.innerHTML = '';
    (les.body || []).forEach(function (block) {
      if (block.t === 'p') {
        var p = document.createElement('p');
        if (block.en) {
          var en = document.createElement('span');
          en.className = 'en';
          en.lang = 'en';
          en.textContent = block.en;
          p.appendChild(en);
        }
        var ja = document.createElement('span');
        ja.lang = 'ja';
        ja.textContent = block.ja;
        p.appendChild(ja);
        ui.body.appendChild(p);

      } else if (block.t === 'pairs') {
        var ul = document.createElement('ul');
        ul.className = 'pair-list';
        block.items.forEach(function (it) {
          var li = document.createElement('li');
          li.className = 'pair';
          var a = document.createElement('span');
          a.className = 'pair-en';
          a.lang = 'en';
          a.textContent = it.en;
          var b = document.createElement('span');
          b.className = 'pair-ja';
          b.lang = 'ja';
          b.textContent = it.ja;
          li.appendChild(a);
          li.appendChild(b);
          if (it.sym) {
            var c = document.createElement('span');
            c.className = 'pair-sym';
            c.textContent = it.sym;
            li.appendChild(c);
          }
          ul.appendChild(li);
        });
        ui.body.appendChild(ul);

      } else if (block.t === 'key') {
        var k = document.createElement('p');
        k.className = 'key';
        if (block.en) {
          var ken = document.createElement('span');
          ken.className = 'en';
          ken.lang = 'en';
          ken.textContent = block.en;
          k.appendChild(ken);
        }
        var kja = document.createElement('span');
        kja.lang = 'ja';
        kja.textContent = block.ja;
        k.appendChild(kja);
        ui.body.appendChild(k);
      }
    });

    ui.prev.disabled = S.index === 0;
    ui.next.disabled = S.index === DATA.lessons.length - 1;
  }


  // ----------------------------------------------------------------
  // 06. 盤
  // ----------------------------------------------------------------
  //
  // 64マスは1回だけ作り、以後は中身と印を塗り替える。
  // 毎回作り直すと、キーボードで辿っている最中に居場所が消える。

  var squares = [];

  function buildBoard() {
    ui.board.innerHTML = '';
    squares = [];
    for (var i = 0; i < 64; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq' + (C.isLightSquare(i) ? '' : ' dark');
      b.dataset.i = String(i);
      b.addEventListener('click', onSquare);
      ui.board.appendChild(b);
      squares.push(b);
    }
    // 盤の外の名前。段は上から 8→1、筋は左から a→h
    ui.ranks.innerHTML = '';
    ui.files.innerHTML = '';
    for (var r = 8; r >= 1; r--) {
      var s = document.createElement('span');
      s.textContent = String(r);
      ui.ranks.appendChild(s);
    }
    for (var f = 0; f < 8; f++) {
      var t = document.createElement('span');
      t.textContent = C.FILES.charAt(f);
      ui.files.appendChild(t);
    }
  }

  function paint() {
    var kind = goal().kind;
    var pos = S.pos;
    // 指せる手は1回だけ集め、印を付けるのと押せるかどうかの両方で使う
    var able = movesByFrom(pos);
    var marks = markSet(able);

    for (var i = 0; i < 64; i++) {
      var b = squares[i];
      var piece = pos.board[i];

      // 駒
      b.innerHTML = '';
      if (piece) b.appendChild(pieceSvg(piece));

      // 印
      b.className = 'sq' + (C.isLightSquare(i) ? '' : ' dark') +
        (piece ? ' occupied' : '') +
        (marks.pick === i ? ' pick' : '') +
        (marks.goto[i] ? ' goto' : '') +
        (marks.goal[i] ? ' goal' : '') +
        (marks.ask[i] ? ' ask' : '') +
        (marks.check === i ? ' check' : '') +
        (marks.hint === i ? ' hint' : '') +
        (marks.last[i] ? ' last' : '');

      // 押せるかどうか。
      // 追いかけ回は「できた」のあとも触れたままにする。
      // 納得するまで動かす回なので、止めると目的と反対になる
      b.disabled = (S.done && kind !== 'chase') ? true : !touchable(i, kind, able);

      // 読み上げ。マスの名前を必ず先に言う（1章の目的がこれ）
      b.setAttribute('aria-label', C.nameOf(i) + ', ' +
        (C.isLightSquare(i) ? 'light' : 'dark') + ' square, ' +
        (piece ? (C.colorOf(piece) === 'w' ? 'white ' : 'black ') + PIECE_EN[C.typeOf(piece)] : 'empty'));
    }

  }

  // 印を付けるマスを集める。able は movesByFrom が集めた「指せる手」
  function markSet(able) {
    var out = { pick: -1, goto: {}, goal: {}, ask: {}, check: -1, hint: hintFrom(), last: {} };
    // 直前に指した手の、出発マスと行き先。
    // これが無いと、黒が動いても盤に跡が残らず、
    // 何が変わったのかを自分で探すことになる
    if (S.last) { out.last[S.last.from] = 1; out.last[S.last.to] = 1; }
    var kind = goal().kind;
    var pos = S.pos;

    if (kind === 'squares' && !S.done) {
      var g = goal();
      if (g.ordered) {
        var next = g.ask[S.askAt];
        if (next) out.ask[C.indexOf(next)] = 1;
      } else {
        g.ask.forEach(function (n) { if (!S.hit[n]) out.ask[C.indexOf(n)] = 1; });
      }
      return out;
    }

    // 課題の的。まだ駒が残っているところだけ
    (lesson().goals || []).forEach(function (n) {
      var at = C.indexOf(n);
      var w = win();
      if (w.capture && w.capture.indexOf(n) >= 0) {
        if (pos.board[at] && C.colorOf(pos.board[at]) !== S.start.turn) out.goal[at] = 1;
      } else {
        out.goal[at] = 1;
      }
    });

    if (S.pick >= 0) {
      out.pick = S.pick;
      (able[S.pick] || []).forEach(function (m) { out.goto[m.to] = 1; });
    }

    // チェックされているキング。どちらの色でも出す
    ['w', 'b'].forEach(function (col) {
      if (C.inCheck(pos, col)) out.check = C.findKing(pos, col);
    });

    return out;
  }

  // そのマスは押す意味があるか。
  // 押しても何も起きないマスを押せる状態にしておくと
  // 「押したのに動かない」になる（川渡りの駒と同じ考え方）
  function touchable(i, kind, able) {
    var pos = S.pos;
    if (kind === 'read' || kind === 'replay') return false;
    if (kind === 'squares') return true;
    if (kind === 'setup') {
      // 並べる前から居る駒には触れない。置いた駒は取り除ける
      if (pos.board[i] && !S.placed[i]) return false;
      return !!(S.held || S.placed[i]);
    }
    // 並べて あそぶ（並べているあいだ）：駒をつまんでいれば空きマス、置いた駒は取り除ける
    if (kind === 'sandbox' && S.phase === 'setup') return !!(S.held || pos.board[i]);
    if (S.waiting || S.waitBlack) return false;
    // 行ける先として光っているマスは押せる
    if (S.pick >= 0) {
      var from = able[S.pick] || [];
      for (var k = 0; k < from.length; k++) if (from[k].to === i) return true;
    }
    // 自分の手番の駒で、動ける手があるもの。
    // only の縛りは able を作るときに掛けてあるので、ここでは見ない
    var p = pos.board[i];
    if (!p || C.colorOf(p) !== pos.turn) return false;
    return !!(able[i] && able[i].length);
  }

  // そのレッスンで指してよい手か（only の縛り）
  function allowed(m) {
    var only = lesson().only;
    if (only && C.typeOf(m.piece) !== only) return false;
    return true;
  }

  // そのマスの駒が、このレッスンで指してよい手だけ。
  // 「行ける先を光らせる」「押せるかどうか」「押された先はどの手か」が
  // 同じ答えを使うように、縛りを掛ける場所を1か所にしてある
  function allowedFrom(pos, from) {
    return C.movesFrom(pos, from).filter(allowed);
  }

  // いまの局面で指せる手を、出発マスごとに1回だけ集める。
  //
  // ★ なぜ1回にまとめるのか ★
  //   paint() は64マスそれぞれに touchable() で「押す意味があるか」を聞く。
  //   その中で movesFrom を呼ぶと、movesFrom は中で合法手を丸ごと
  //   作り直すので、1タップで合法手の生成が98回走っていた。
  //   盤を塗っているあいだ局面は変わらないのだから、集めるのは1回でよい。
  //   答えは変わらない。変わるのは速さだけである。
  function movesByFrom(pos) {
    var out = {};
    var all = C.legalMoves(pos);
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      if (!allowed(m)) continue;
      if (!out[m.from]) out[m.from] = [];
      out[m.from].push(m);
    }
    return out;
  }


  // ----------------------------------------------------------------
  // 07. マスを押したとき
  // ----------------------------------------------------------------
  //
  // レッスンの種類で分かれる。ここが入口。

  function onSquare(ev) {
    var kind = goal().kind;
    if (S.done && kind !== 'chase') return;
    var i = parseInt(ev.currentTarget.dataset.i, 10);

    if (kind === 'squares') return answerSquare(i);
    if (kind === 'setup')   return placePiece(i);
    if (kind === 'sandbox' && S.phase === 'setup') return sandboxPlace(i);
    return touchPiece(i);
  }

  // --- 1章：言われたマスを押す ---
  function answerSquare(i) {
    var g = goal();
    var name = C.nameOf(i);

    if (g.ordered) {
      var want = g.ask[S.askAt];
      if (name !== want) {
        shake(i);
        say('That is ' + name + '. Look for ' + want + '.',
            'そこは ' + name + '。さがして いるのは ' + want + '。', 'bad');
        return;
      }
      S.askAt++;
      S.hit[name] = 1;
      if (S.askAt >= g.ask.length) {
        // ここも順番なし版と同じ。言わずに finish() へ行くと
        // 「できた！」の上に「つぎは ○○」が残り、
        // つぎが無いのに在ると書いてあることになる
        var all = g.ask.length > 1;
        say('Yes, ' + name + '.' + (all ? ' That is all ' + g.ask.length + '.' : ''),
            'せいかい。' + (all ? g.ask.length + 'つ ぜんぶ。' : ''), 'good');
        return finish();
      }
      say('Yes, ' + name + '.', 'せいかい。つぎは ' + g.ask[S.askAt] + '。', 'good');
      paint();
      return;
    }

    if (g.ask.indexOf(name) < 0) {
      shake(i);
      say('Not ' + name + '.', name + 'は ちがうよ。', 'bad');
      return;
    }
    if (S.hit[name]) {
      say(name + ' is already done.', name + 'は もう おしたよ。');
      return;
    }
    S.hit[name] = 1;
    var left = g.ask.filter(function (n) { return !S.hit[n]; }).length;

    // 最後の1マスでも一言は言う。言わずに finish() へ行くと、
    // 「できた！」の上に1つ前の「あと 1つ」が残ったままになり、
    // のこり0なのに1と書いてあることになる。
    // 押すマスが1つだけの回は数を言わない（「1つ ぜんぶ」は日本語にならない）
    var tailEn = '', tailJa = '';
    if (left > 0) {
      tailEn = ' ' + left + ' to go.';
      tailJa = 'あと ' + left + 'つ。';
    } else if (g.ask.length > 1) {
      tailEn = ' That is all ' + g.ask.length + '.';
      tailJa = g.ask.length + 'つ ぜんぶ。';
    }

    if (g.say === 'value') {
      // ねうちを教える回。押した駒の名前と値を返す
      var q = S.pos.board[i];
      var t = C.typeOf(q);
      var worth = t === 'K' ? '♾️' : String(C.VALUE[t]);
      say(PIECE_EN[t] + ' = ' + worth + '.' + tailEn,
          PIECE_JA[t] + 'は ' + worth + '。' + tailJa, 'good');
    } else {
      say('Yes, ' + name + '.' + tailEn,
          'せいかい。' + tailJa, 'good');
    }
    if (left === 0) return finish();
    paint();
  }

  // --- ならべて あそぶ ---
  //
  // 好きな駒を白黒とも置いて、そこから指す。置く駒の数に上限は付けない
  // （合法な盤でなくても並べられる）。ただし、指し始められない盤だけは
  // 置く段階で止める：キングは1つずつ、ポーンは1〜8段に置けない、
  // 1色16枚まで、ポーンは8枚まで。
  // 「あそぶ」を押すと、黒が白からチェックされていない盤だけが始まる
  // （白の番なのに黒が詰みの形では、指す手が決まらないため）。
  var SANDBOX_PIECES = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'];
  var START_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  function sandboxPlace(i) {
    var b = S.pos.board;
    // 置いた駒を押したら取り除く
    if (b[i]) {
      b[i] = '';
      paintSandboxPalette();
      paint();
      sayPlaceSound();
      clearSay();
      return;
    }
    if (!S.held) {
      say('Pick a piece from the shelf first.', 'まず 下から こまを えらんでね。');
      return;
    }
    var color = C.colorOf(S.held), type = C.typeOf(S.held);
    var total = 0, pawns = 0, kings = 0;
    for (var k = 0; k < 64; k++) {
      var q = b[k];
      if (!q || C.colorOf(q) !== color) continue;
      total++;
      if (C.typeOf(q) === 'P') pawns++;
      if (C.typeOf(q) === 'K') kings++;
    }
    var side = color === 'w' ? ['White', '白'] : ['Black', '黒'];
    if (type === 'K' && kings >= 1) {
      return say(side[0] + ' already has a king. There is one king each.',
                 side[1] + 'の キングは もう いるよ。キングは 1つずつ。', 'bad');
    }
    if (type === 'P' && (C.rankOf(i) === 1 || C.rankOf(i) === 8)) {
      return say('Pawns cannot stand on the first or last row.',
                 'ポーンは いちばん 下と いちばん 上の だんには おけない。', 'bad');
    }
    if (type === 'P' && pawns >= 8) {
      return say('There are only eight pawns each.', 'ポーンは 8つまで。', 'bad');
    }
    if (total >= 16) {
      return say('Sixteen pieces each is the most.', 'こまは 1色 16まいまで。', 'bad');
    }
    b[i] = S.held;
    paintSandboxPalette();
    paint();
    sayPlaceSound();
    clearSay();
  }

  // 並べた盤で、キャスリングの権利を決める。キングとルークがはじめの場所に
  // いる組だけ、できる。盤の外の履歴は無いので、場所だけで決めるしかない
  function castleOfBoard(b) {
    var out = '';
    if (b[60] === 'K' && b[63] === 'R') out += 'K';
    if (b[60] === 'K' && b[56] === 'R') out += 'Q';
    if (b[4] === 'k' && b[7] === 'r') out += 'k';
    if (b[4] === 'k' && b[0] === 'r') out += 'q';
    return out;
  }

  function sandboxFill(fen) {
    S.pos = C.fromFen(fen);
    S.held = '';
    paintSandboxPalette();
    paint();
    clearSay();
  }

  function sandboxStart(vsCpu) {
    var b = S.pos.board;
    var cand = { board: b.slice(), turn: 'w', castle: castleOfBoard(b), ep: -1, half: 0, full: 1, seen: {} };
    if (C.findKing(cand, 'w') < 0 || C.findKing(cand, 'b') < 0) {
      return say('Both kings are needed: one white, one black.',
                 'キングが 白と 黒に 1つずつ ひつよう。', 'bad');
    }
    var fen = C.toFen(cand);
    var pos = C.fromFen(fen);
    if (C.inCheck(pos, 'b')) {
      return say('It is White to move, but Black is already in check. Move the pieces.',
                 '白の 番なのに 黒の キングが チェックされて いる。こまを おきなおしてね。', 'bad');
    }
    S.arrFen = fen;
    S.vsCpu = !!vsCpu;
    S.phase = 'play';
    S.start = C.fromFen(fen);
    S.pos = C.fromFen(fen);
    S.past = [];
    S.record = [];
    S.held = '';
    S.pick = -1;
    ui.palette.hidden = true;
    writeRecord();
    paint();
    updateButtons();
    if (C.status(S.pos).over || C.inCheck(S.pos, 'w')) return reportFree(S.pos);
    if (vsCpu) say('You play White; the computer plays Black. Your move.',
                   '白が きみで、黒は コンピュータ。どうぞ。');
    else say('White moves first.', '白から どうぞ。');
  }

  function paintSandboxPalette() {
    ui.palette.hidden = false;
    ui.paletteBox.innerHTML = '';
    ui.paletteBox.className = 'palette-choices palette-choices--twelve';
    SANDBOX_PIECES.forEach(function (piece) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'palette-btn' + (S.held === piece ? ' picked' : '');
      b.appendChild(pieceSvg(piece));
      b.setAttribute('aria-label',
        (C.colorOf(piece) === 'w' ? 'White ' : 'Black ') + PIECE_EN[C.typeOf(piece)]);
      if (S.held === piece) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        S.held = (S.held === piece) ? '' : piece;
        paintSandboxPalette();
        paint();
      });
      ui.paletteBox.appendChild(b);
    });

    // 並べ方の近道と、始めるボタン。棚のあとに置く
    var old = ui.palette.querySelector('.palette-actions');
    if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.className = 'palette-actions';
    function act(en, ja, primary, fn) {
      var a = document.createElement('button');
      a.type = 'button';
      a.className = 'btn' + (primary ? ' primary' : '');
      bi(a, en, ja);
      a.addEventListener('click', fn);
      box.appendChild(a);
    }
    act('Starting position', 'はじめの ならび', false, function () { sandboxFill(START_BOARD_FEN); });
    act('Clear the board', 'ぜんぶ けす', false, function () { sandboxFill(C.EMPTY_FEN); });
    act('Play with a friend', 'ふたりで あそぶ', true, function () { sandboxStart(false); });
    act('Play the computer', 'コンピュータと あそぶ', true, function () { sandboxStart(true); });
    ui.palette.appendChild(box);
  }

  // --- 5章：駒を並べる ---
  function placePiece(i) {
    // 置いた駒を押したら取り除く
    if (S.placed[i]) {
      S.pos.board[i] = '';
      delete S.placed[i];
      paintPalette();
      paint();
      sayPlaceSound();
      clearSay();
      return;
    }
    if (!S.held) {
      say('Pick a piece from the shelf first.', 'まず 下から こまを えらんでね。');
      return;
    }
    if (S.pos.board[i]) return;

    // 8枚ぶんしか置けない。たなの残りで止める
    if (leftOf(S.held) <= 0) {
      say('No more ' + PIECE_EN[S.held] + ' to place.',
          PIECE_JA[S.held] + 'は もう ぜんぶ おいたよ。');
      return;
    }
    S.pos.board[i] = S.held;
    S.placed[i] = 1;
    paintPalette();
    paint();
    sayPlaceSound();

    var want = C.fromFen(goal().want);
    var filled = Object.keys(S.placed).length;
    if (filled >= 8) {
      var same = true;
      for (var k = 0; k < 64; k++) if (S.pos.board[k] !== want.board[k]) same = false;
      if (same) return finish();
      say('All eight are down, but not all in the right place.',
          '8まい おけたけど、どこかが ちがう。クイーンは 白マスの d1 だよ。', 'bad');
      return;
    }
    clearSay();
  }

  // そのこまを あと何枚おけるか
  function leftOf(type) {
    var want = C.fromFen(goal().want);
    var need = 0, have = 0;
    for (var i = 0; i < 64; i++) {
      if (want.board[i] === type) need++;
      if (S.placed[i] && S.pos.board[i] === type) have++;
    }
    return need - have;
  }

  // 駒のくみあわせを選ぶボタン。追いかけ回と、おまけ（相手の選択）で出す
  var SETS_LABEL = ui.sets ? ui.sets.getAttribute('aria-label') : '';
  function paintSets() {
    var g = goal();
    if (!g.sets) { ui.sets.hidden = true; return; }
    // 見出しは回ごとに変えられる。HTML に書いた「駒のくみあわせ」は
    // 追いかけ回の言葉なので、おまけで読み上げるとちがう話になる
    ui.sets.setAttribute('aria-label', g.setsLabel || SETS_LABEL);
    ui.sets.hidden = false;
    ui.sets.innerHTML = '';
    g.sets.forEach(function (set, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'set-btn' + (i === S.setAt ? ' current' : '');
      bi(b, set.en, set.ja);
      if (i === S.setAt) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', function () {
        if (i === S.setAt) return;
        S.setAt = i;
        restart();
      });
      ui.sets.appendChild(b);
    });
  }

  function paintPalette() {
    var g = goal();
    if (g.kind === 'sandbox' && S.phase === 'setup') return paintSandboxPalette();
    if (g.kind !== 'setup') { ui.palette.hidden = true; return; }
    ui.palette.hidden = false;
    ui.paletteBox.innerHTML = '';
    ui.paletteBox.className = 'palette-choices';
    g.palette.forEach(function (type) {
      var b = document.createElement('button');
      b.type = 'button';
      var left = leftOf(type);
      b.className = 'palette-btn' + (S.held === type ? ' picked' : '') + (left <= 0 ? ' empty' : '');
      b.appendChild(pieceSvg(type));
      var tag = document.createElement('span');
      tag.className = 'palette-left';
      tag.textContent = String(left);
      b.appendChild(tag);
      b.setAttribute('aria-label', 'White ' + PIECE_EN[type] + ', ' + left + ' left to place');
      b.disabled = left <= 0;
      b.addEventListener('click', function () {
        S.held = (S.held === type) ? '' : type;
        paintPalette();
        paint();
      });
      ui.paletteBox.appendChild(b);
    });
  }

  // --- 2章以降：駒を触って指す ---
  function touchPiece(i) {
    var pos = S.pos;

    // 行ける先を押した → 指す
    if (S.pick >= 0) {
      var goes = allowedFrom(pos, S.pick).some(function (m) { return m.to === i; });
      if (goes) return tryMove(S.pick, i);
      if (i === S.pick) { S.pick = -1; paint(); clearSay(); return; }
    }

    var p = pos.board[i];
    if (!p) { S.pick = -1; paint(); clearSay(); return; }

    if (C.colorOf(p) !== pos.turn) {
      say('It is ' + (pos.turn === 'w' ? 'White' : 'Black') + ' to move.',
          'いまは ' + (pos.turn === 'w' ? '白' : '黒') + 'の てばんだよ。');
      return;
    }
    if (lesson().only && C.typeOf(p) !== lesson().only) {
      say('Move the ' + PIECE_EN[lesson().only] + ' in this lesson.',
          'この レッスンは ' + PIECE_JA[lesson().only] + 'を うごかす れんしゅう。');
      return;
    }
    S.pick = i;
    paint();
    if (allowedFrom(pos, i).length === 0) {
      say('That ' + PIECE_EN[C.typeOf(p)] + ' has nowhere to go.',
          'その ' + PIECE_JA[C.typeOf(p)] + 'は、いま どこへも 行けない。');
    } else {
      clearSay();
    }
  }


  // ----------------------------------------------------------------
  // 08. 手を指す
  // ----------------------------------------------------------------

  function tryMove(from, to) {
    var pos = S.pos;
    var list = allowedFrom(pos, from).filter(function (m) { return m.to === to; });
    if (!list.length) return;

    // なる手が混ざっている（同じ from-to で4通り）
    if (list.length > 1 && list[0].promo) {
      var w = win();
      // 棋譜どおりに指す課題なら、書いてある駒に決まっている
      var wanted = w.line ? (/=([QRBN])/.exec(w.line[S.lineAt] || '') || [])[1] : null;
      if (wanted) return doMove(pickPromo(list, wanted));
      S.waiting = { from: from, to: to, list: list };
      askPromo(list);
      return;
    }
    doMove(list[0]);
  }

  function pickPromo(list, type) {
    for (var i = 0; i < list.length; i++) if (list[i].promo === type) return list[i];
    return list[0];
  }

  function doMove(move) {
    var pos = S.pos;
    var w = win();

    // 自分で手を見つける課題。ちがう手は盤に乗せず、なぜ違うかだけ返す。
    // いったん動かしてから戻すと、まちがいが盤の上の事実になってしまう
    var want = answerNow();
    if (want) {
      var tried = C.toSan(pos, move);
      if (!sameSan(tried, want)) {
        shake(move.to);
        tellWrong(pos, move, tried);
        S.pick = -1;
        paint();
        return;
      }
    }

    // 棋譜どおりに指す課題。ちがう手は盤に乗せない
    if (w.line) {
      var wantLine = w.line[S.lineAt];
      var got = C.toSan(pos, move);
      if (!sameSan(got, wantLine)) {
        shake(move.to);
        say('The notation says ' + wantLine + '. That move is ' + got + '.',
            'きふは ' + wantLine + '。いま さそうと したのは ' + got + '。', 'bad');
        S.pick = -1;
        paint();
        return;
      }
    }

    // チェックから逃げる課題。どの方法を使ったか、指す前に調べておく
    var way = null;
    if (w.escape && C.inCheck(pos, pos.turn)) {
      var checkers = C.attackers(pos, C.findKing(pos, pos.turn), C.other(pos.turn));
      if (C.typeOf(move.piece) === 'K') way = 'king';
      else if (checkers.indexOf(move.to) >= 0) way = 'capture';
      else way = 'block';
    }

    var san = C.toSan(pos, move);
    S.past.push({ pos: pos, record: S.record.slice(), lineAt: S.lineAt,
                  chased: S.chased, ansAt: S.ansAt, last: S.last });
    S.record.push({ san: san, color: pos.turn });

    var next = C.apply(pos, move);
    // 相手が動かないレッスンは、手番を自分に戻す
    if (lesson().still) next.turn = pos.turn;
    S.pos = next;
    S.last = { from: move.from, to: move.to };
    S.pick = -1;
    S.waiting = null;
    ui.promo.hidden = true;

    if (w.line) S.lineAt++;

    writeRecord();
    paint();
    updateButtons();
    sayMoveSound(move, S.pos);
    // 前の一言（「なる こまを えらんで」など）をここで消す。
    // judge が新しい一言を入れるので、入れ替わりになる
    clearSay();
    judge(move, san, way);
  }

  // まちがえた手に、なぜ違うかを返す。
  // とりかえの損得から文を作るので、問題ごとに書かなくて済む
  function tellWrong(pos, move, san) {
    if (move.captured) {
      var v = C.exchangeOf(pos, move);
      if (v < 0) {
        return say(san + ' loses ' + (-v) + ' — it gets taken back.',
                   san + 'は とりかえされて ' + (-v) + ' そんするよ。', 'bad');
      }
      if (v === 0) {
        return say(san + ' is an even trade.',
                   san + 'は とりかえっこ。とくには ならないよ。', 'bad');
      }
      return say('That wins something, but there is more.',
                 'とくは するけど、もっと いい手が あるよ。', 'bad');
    }
    // 取る手でないときの返し。
    // こたえが「とる手」かどうかで変える。1章は ただ取りを さがす回なので
    // 「とれる こまを 見てみて」で合うが、2章の フォークは
    // とる手が こたえでは ない。同じ文を返すと、さがす場所をまちがえさせる
    var right = C.parseSan(pos, answerNow());
    if (right && right.captured) {
      return say('Not that move. Look at what you can take.',
                 'ちがう手だよ。とれる こまを 見てみて。', 'bad');
    }
    say('Not that move. Read the task again and look at the whole board.',
        'ちがう手だよ。やる ことを もう一度 読んで、盤ぜんたいを 見てみて。', 'bad');
  }

  function sameSan(a, b) {
    return String(a).replace(/[+#!?]/g, '') === String(b).replace(/[+#!?]/g, '');
  }


  // ----------------------------------------------------------------
  // 08b. 黒のキングが逃げる（20「ひきわけと とうりょう」だけ）
  // ----------------------------------------------------------------
  //
  // 考える相手ではない。キングが逃げるだけの決まりごとである。
  //
  // この回で見せたいのは「キングとビショップだけでは詰ませられない」で、
  // それは盤上に詰みの形が1つも存在しないという事実なので、
  // 黒がどう指しても詰むことはない。でたらめに動かしても成立する。
  //
  // それでも逃げ方を決めてあるのは、ステイルメイトを避けるため。
  // 詰みは存在しないが、ステイルメイトの形は存在する。でたらめに動くと
  // 自分から隅へ入って動けなくなり、「詰まないこと」を見せたい回に
  // 別の引き分けが割り込む。
  //
  // だから「次に動ける数」をいちばん重く見る。そのうえで白のキングから
  // 離れ、盤の真ん中へ寄る。追いかけても逃げ切られる感じが出る。

  function fleeMove(pos) {
    var list = C.legalMoves(pos);
    if (!list.length) return null;
    var wk = C.findKing(pos, 'w');
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var next = C.apply(pos, m);
      // 指したあとの局面は相手の手番になっている。
      // そのまま数えると白の手の数になるので、色を指定して黒の手を数える。
      // ここを間違えると「相手がいちばん動ける場所」へ逃げることになり、
      // 逃げ方として反対を向く
      var room = C.legalMoves(next, C.colorOf(m.piece)).length;
      var away = Math.max(Math.abs(C.fileOf(m.to) - C.fileOf(wk)),
                          Math.abs(C.rankOf(m.to) - C.rankOf(wk)));
      // 盤の真ん中からの遠さ。端ほど大きい
      var edge = Math.max(Math.abs(C.fileOf(m.to) - 3.5), Math.abs(C.rankOf(m.to) - 4.5));
      var score = room * 100 + away * 10 - edge * 6;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }

  // 黒を指す仕掛け。ページが読み込んだものを使う。
  //
  //   chess-ai.js を読み込んでいる    → 先を読む相手（「あそぶ」タブ）
  //   chess-cpu.js だけ読み込んでいる → 決まりごとの相手（1巻のおまけ）
  //
  // どちらを使うかは index.html の <script> が決める。
  // ここに「どの巻はどちら」という表を持たないのは、表を持つと
  // 巻を足すたびに2か所を直すことになるため。
  //
  // どちらも黒専用のつもりで呼ぶ。chess-cpu.js は中で黒を直書きしており
  // （legalMoves(pos, 'b')）、白を持たせると白の手番で黒の手を返す。
  // 「あそぶ」も巻のおまけも、自分が白と決まっているので困らない。
  // 黒を持って指す回を作るときは、まずあちらを直すこと。
  function blackBrain() {
    return window.ChessAi || window.ChessCpu || null;
  }

  // おまけで「コンピュータと さす」を選んでいるか。
  // 選びは goal.sets に cpu: true を付けて持つ（追いかけ回の駒の選びと同じ置き場）
  function cpuOn() {
    var g = goal();
    if (!blackBrain()) return false;
    // 並べて あそぶ：並べ終えて指しているあいだだけ
    if (g.kind === 'sandbox') return S.phase === 'play' && S.vsCpu;
    if (g.kind !== 'free') return false;
    var set = g.sets && g.sets[S.setAt];
    return !!(g.cpu || (set && set.cpu));
  }

  // 黒が指すまでの間。
  //
  // ★ 「待つ」と「固まる」は別のものである ★
  //   先を読む相手は、考えているあいだページが止まる（JavaScript は
  //   1本道なので、指もスクロールも効かない）。待ち時間をぜんぶ
  //   探索に使うと「間を置いている」ではなく「固まっている」になる。
  //
  //   そこで、考えた時間を測って、残りを待つ形にしてある。
  //     1. 自分の手が盤に乗ったのを見せる（LEAD）
  //     2. 考える（止まる。chess-ai.js の安全弁が上限）
  //     3. 1.5秒になるまで待つ（止まらない）
  //     4. 指す
  //   どの端末でも合計は 1.5秒で揃い、固まるのは 2 の分だけになる。
  //
  // ★ なぜ 1.5秒も置くのか ★
  //   速すぎると、黒が動いたのかどうかが分からない。
  //   盤は一瞬で書き換わるので、見ていないと何が起きたか追えない。
  //   直前の手に印を付けた（markSet の last）のも同じ理由で、
  //   時間と印と音の3つで「いま黒が指した」を伝えている。
  var BLACK_PAUSE = 420;    // 決まった返し・逃げるだけの回。考えないので短い
  var CPU_TOTAL   = 1500;   // 考える相手のときの、合計の間
  var CPU_LEAD    = 150;    // 考え始める前に、自分の手を見せる間
  var CPU_MIN     = 250;    // 考え終わってから指すまでの、最低限の間

  // 黒を動かして見せる。白の手が盤に乗ってから少し置く。
  // すぐ動かすと、自分の手と相手の手が同時に起きたように見える
  // lastMove … 白が直前に指した手。CPU の「取り返す」が使う
  // 黒が1手指す。3つの道（決まった返し・コンピュータ・逃げる）が
  // 同じことをしていたので1つにまとめた。
  // 棋譜に積み、盤を進め、直前の手の印を付け、音を鳴らすところまで。
  function playBlack(move) {
    var san = C.toSan(S.pos, move);
    S.past.push({ pos: S.pos, record: S.record.slice(), lineAt: S.lineAt,
                  chased: S.chased, ansAt: S.ansAt, last: S.last });
    S.record.push({ san: san, color: S.pos.turn });
    S.pos = C.apply(S.pos, move);
    S.last = { from: move.from, to: move.to };
    writeRecord();
    paint();
    updateButtons();
    sayMoveSound(move, S.pos);
  }

  function letBlackRun(lastMove) {
    S.waitBlack = true;
    paint();
    // 待っているあいだに目次を押されたら、この手は捨てる。
    // 片付けないと、次のレッスンの盤に黒の手が落ちる
    // （レッスン18を開いた瞬間に白が1手動く、という壊れ方をしていた）
    var mine = S.index;
    var setWas = S.setAt;
    // 考える相手のときだけ先に短く置く。考えた時間は向こうで測って埋める
    var thinks = (goal().kind === 'free' || goal().kind === 'sandbox') && cpuOn();
    S.timer = window.setTimeout(function () {
      S.timer = 0;
      S.waitBlack = false;
      if (S.index !== mine) return;

      // 詰みまで指させる問題：決まった返しを指す
      var sw = win();
      if (goal().kind === 'moves' && sw.answers) {
        var sm = C.parseSan(S.pos, sw.answers[S.ansAt]);
        if (!sm) { paint(); return; }
        playBlack(sm);
        sayNote(sw, S.ansAt);
        S.ansAt++;
        return;
      }

      // おまけ・あそぶ：コンピュータが指す
      if (goal().kind === 'free' || goal().kind === 'sandbox') {
        // 待っているあいだに「ふたりで さす」へ切り替えられたら指さない。
        // 抜けるときも必ず塗り直す。waitBlack のあいだ盤は
        // 64マスすべてを押せなくしているので、塗り直さずに抜けると
        // 黒が指しも しないまま、盤を触れない状態で残る
        if (S.setAt !== setWas || !cpuOn()) { paint(); return; }

        var brain = blackBrain();
        var t0 = Date.now();
        // 段は ChessAi だけが見る。ChessCpu は受け取っても使わない
        var r = brain.choose(S.pos, lastMove, null, { level: level });   // ここだけ止まる
        var spent = Date.now() - t0;
        if (!r) { paint(); return reportFree(S.pos); }

        // 合計が CPU_TOTAL になるように、残りを待ってから指す。
        // 考えるのが速い端末ほど長く待つ（強さではなく間を揃える）
        var rest = Math.max(CPU_MIN, CPU_TOTAL - CPU_LEAD - spent);
        S.waitBlack = true;
        S.timer = window.setTimeout(function () {
          S.timer = 0;
          S.waitBlack = false;
          if (S.index !== mine || S.setAt !== setWas || !cpuOn()) { paint(); return; }
          playBlack(r.move);
          reportFree(S.pos);
        }, rest);
        return;
      }

      // ここまで来るのは追いかけ回だけ。ほかの回から呼ばれていたら
      // 黒は指さないが、盤は押せる状態に戻しておく（上と同じ理由）
      if (goal().kind !== 'chase') { paint(); return; }
      var m = fleeMove(S.pos);
      if (!m) { paint(); return chaseReport(); }
      playBlack(m);
      chaseReport();
    }, thinks ? CPU_LEAD : BLACK_PAUSE);
  }

  // 何手さしたか、まだ詰んでいないことを伝える
  function chaseReport() {
    var want = goal().moves;
    var left = want - S.chased;
    var st = C.status(S.pos);
    if (st.kind === 'stalemate') {
      say('Stalemate — a draw. Still not checkmate.',
          'ステイルメイト。これも ひきわけ。チェックメイトでは ない。', 'good');
      return finish();
    }
    // 自分の駒を取られたとき。キングのとなりに置けば取られる。
    // こどもが普通にやる手なので、だまって続けさせない。
    // レッスン15の「まもられて いない こまは とられる」と同じ話でもある。
    //
    // 手数が足りていても、まずこちらを出す。「詰まない」の知らせで
    // 上書きすると、取られた理由を知らないまま終わってしまう。
    // くみあわせによって駒が違う（ビショップ・ナイト）ので、名前は盤から拾う
    var mine = '';
    S.pos.board.forEach(function (q) {
      if (q && C.colorOf(q) === 'w' && C.typeOf(q) !== 'K') mine = C.typeOf(q);
    });
    if (!mine) {
      say('Your piece was taken — it stood next to the king unprotected.',
          'こまを とられて しまった。キングの となりに おくと とられる。' +
          'キングだけに なったら、なおさら 詰ませられない。「やりなおす」で もう一度。', 'bad');
      if (left <= 0 && !S.done) finish();
      return;
    }

    if (left <= 0) {
      say('Still no checkmate. There is no way to make one.',
          S.chased + '手 さしても 詰まない。じつは どう ならべても 詰む かたちが ない。', 'good');
      // 知らせは1回だけ。そのあとは数えながら、好きなだけ指し続けられる
      if (!S.done) return finish();
      return;
    }

    if (C.inCheck(S.pos, 'b')) {
      say('Check — but the king just walks away. ' + left + ' to go.',
          'チェック。でも キングは よけて いく。あと ' + left + '手。');
      return;
    }
    say('No checkmate yet. ' + left + ' to go.',
        'まだ 詰まない。あと ' + left + '手。');
  }


  // ----------------------------------------------------------------
  // 09. できたかどうか
  // ----------------------------------------------------------------

  // win.notes[i] … i 手めを指した直後に出す一言。何が起きたか分からない人のため
  function sayNote(w, i) {
    var n = w.notes && w.notes[i];
    if (n) say(n.en, n.ja, 'good');
  }

  // おまけ：盤の状態を一言で伝える（決着・チェック・ひきわけ）
  function reportFree(pos) {
    var st = C.status(pos);
    // 決着がついた局だけ、つよさの段を上げ下げする。
    // 同じ局で二度動かさないよう、決着を見たことを覚えておく
    if (st.over && cpuOn() && !S.scored) {
      S.scored = true;
      moveLevel(st.winner);
    }
    if (st.kind === 'checkmate') {
      say('Checkmate. ' + (st.winner === 'w' ? 'White' : 'Black') + ' wins.',
          'チェックメイト。' + (st.winner === 'w' ? '白' : '黒') + 'の かち。', 'good');
    } else if (st.kind === 'stalemate') {
      say('Stalemate. A draw.', 'ステイルメイト。ひきわけ。', 'good');
    } else if (st.kind === 'material') {
      say('Neither side can mate. A draw.', 'もう どちらも 詰ませられない。ひきわけ。', 'good');
    } else if (st.kind === 'repetition5' || st.kind === 'seventyfive') {
      say('Automatic draw.', 'じどうで ひきわけ。', 'good');
    } else if (st.claimable) {
      say('A draw can be claimed here.', 'いま「ひきわけに しよう」と 言える ばんめん。');
    } else if (C.inCheck(pos, pos.turn)) {
      say('Check.', 'チェック。' + (pos.turn === 'w' ? '白' : '黒') + 'の キングが ねらわれて いる。');
    } else {
      clearSay();
    }
  }

  function judge(move, san, way) {
    var w = win();
    var pos = S.pos;
    var kind = goal().kind;

    if (kind === 'chase') {
      S.chased++;
      // 白が指した直後。黒に逃げる手が無ければステイルメイト
      if (C.legalMoves(S.pos).length === 0) return chaseReport();
      letBlackRun();
      return;
    }

    if (kind === 'free' || kind === 'sandbox') {
      reportFree(pos);
      // コンピュータと さす：白が指して、まだ続くなら黒の番
      if (cpuOn() && pos.turn === 'b' && !C.status(pos).over) letBlackRun(move);
      return;
    }

    // 詰みまで指させる問題。白の正解のあと、黒の返し（決まっている）を盤が指す。
    // 手のあとに「いま何が起きたか」を一言で返す（notes[手の番号]）
    if (w.answers) {
      sayNote(w, S.ansAt);
      S.ansAt++;
      if (S.ansAt >= w.answers.length) return finish();
      return letBlackRun();
    }

    if (answerNow()) return finish();

    if (w.line) {
      if (S.lineAt >= w.line.length) return finish();
      say('Next: ' + w.line[S.lineAt],
          'つぎは ' + w.line[S.lineAt] + '。', 'good');
      return;
    }

    if (w.capture) {
      var left = w.capture.filter(function (n) {
        var at = C.indexOf(n);
        return S.pos.board[at] && C.colorOf(S.pos.board[at]) !== S.start.turn;
      });
      if (left.length === 0) return finish();
      if (move.captured) {
        say('Taken. ' + left.length + ' to go.', 'とれた。あと ' + left.length + 'つ。', 'good');
      } else {
        clearSay();
      }
      return;
    }

    if (w.reach) {
      var all = w.reach.every(function (n) {
        var at = C.indexOf(n);
        return S.pos.board[at] && C.colorOf(S.pos.board[at]) === S.start.turn;
      });
      if (all) return finish();
      clearSay();
      return;
    }

    if (w.flag) {
      // そのレッスンの主役の側が指した手だけを数える。
      // キャスリングは白の O-O も黒の O-O も castle が 'K' になるため、
      // 色を見ないと「黒でキャスリングしたのに白のレッスンが終わる」。
      if (C.colorOf(move.piece) === S.start.turn && hasFlag(move, w.flag)) return finish();
      if (w.flag === 'promo') {
        say('Get the pawn to the last rank.', 'ポーンを いちばん おくの だんまで すすめよう。');
      } else if (w.flag === 'castleK') {
        say('Move the king two squares toward the rook.', 'キングを ルークの ほうへ 2マス うごかしてみて。');
      } else {
        clearSay();
      }
      return;
    }

    if (w.status) {
      var st2 = C.status(S.pos);
      if (st2.kind === w.status) return finish();
      if (st2.kind === 'checkmate') {
        say('That is checkmate, not stalemate.',
            'それは チェックメイト。ステイルメイトは チェックに しない 手。', 'bad');
      } else if (C.inCheck(S.pos, S.pos.turn)) {
        say('That is a check. Try a move that gives no check.',
            'それは チェック。チェックに ならない 手を さがしてみて。', 'bad');
      } else {
        say('Not yet. Press Undo and try another move.',
            'まだ ちがう。「もどす」で 1手 もどして、べつの 手を ためしてみて。', 'bad');
      }
      return;
    }

    if (w.escape) {
      var label = { king: ['moved the king', 'キングが にげた'],
                    block: ['blocked the line', 'あいだに 入った'],
                    capture: ['took the attacker', 'ねらって いる こまを とった'] }[way];
      if (!C.inCheck(S.pos, S.start.turn)) {
        if (label) {
          say('Out of check — you ' + label[0] + '.',
              'チェックから にげられた。つかったのは「' + label[1] + '」。', 'good');
        }
        return finish();
      }
      return;
    }

    clearSay();
  }

  function hasFlag(m, flag) {
    if (flag === 'promo') return !!m.promo;
    if (flag === 'ep') return m.capturedAt >= 0 && m.capturedAt !== m.to;
    if (flag === 'castleK') return m.castle === 'K';
    if (flag === 'castleQ') return m.castle === 'Q';
    return false;
  }


  // ----------------------------------------------------------------
  // 10. なる駒を選ぶ
  // ----------------------------------------------------------------

  function askPromo(list) {
    ui.promo.hidden = false;
    ui.promoBox.innerHTML = '';
    ['Q', 'R', 'B', 'N'].forEach(function (type) {
      var m = pickPromo(list, type);
      if (!m || m.promo !== type) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'promo-btn';
      b.appendChild(pieceSvg(C.colorOf(m.piece) === 'w' ? type : type.toLowerCase()));
      b.setAttribute('aria-label', 'Promote to ' + PIECE_EN[type] + ' (' +
        C.nameOf(m.to) + '=' + type + ')');
      b.addEventListener('click', function () { doMove(m); });
      ui.promoBox.appendChild(b);
    });
    say('Choose what the pawn becomes.', 'ポーンが なる こまを えらんで。');
    paint();
  }


  // ----------------------------------------------------------------
  // 11. 棋譜を1手ずつ送る（7章の読むレッスン）
  // ----------------------------------------------------------------
  //
  // 局面を全部先に作っておき、ボタンで行き来する。
  // 押すたびに指し直す作りにすると、戻るときに
  // 最初から指し直すことになり、長い棋譜で待たされる。

  function buildReplay() {
    var start = C.fromFen(startFen());
    var r = C.playLine(start, goal().line);
    var list = [start];
    var cur = start;
    r.moves.forEach(function (m) {
      cur = C.apply(cur, m);
      list.push(cur);
    });
    S.replay = { list: list, sans: r.sans, moves: r.moves, at: 0 };
    S.pos = list[0];
  }

  function replayGo(step) {
    var rp = S.replay;
    var at = rp.at + step;
    if (at < 0 || at >= rp.list.length) return;
    rp.at = at;
    S.pos = rp.list[at];
    // 送った先の1手に印を付ける。頭に戻したときは印を消す
    S.last = (at > 0 && rp.moves[at - 1])
      ? { from: rp.moves[at - 1].from, to: rp.moves[at - 1].to } : null;
    if (step > 0 && at > 0) sayMoveSound(rp.moves[at - 1], S.pos);

    S.record = [];
    for (var i = 0; i < at; i++) {
      S.record.push({ san: rp.sans[i], color: (i % 2 === 0) ? 'w' : 'b' });
    }
    writeRecord();
    paint();
    updateButtons();

    if (at === 0) {
      say('Start of the game.', 'たいきょくの はじまり。');
    } else {
      var no = Math.floor((at - 1) / 2) + 1;
      var who = (at % 2 === 1) ? '白' : '黒';
      say(no + '. ' + rp.sans[at - 1],
          no + '手め、' + who + 'が ' + rp.sans[at - 1] + '。');
    }
    if (at === rp.list.length - 1) {
      var st = C.status(S.pos);
      if (st.kind === 'checkmate') {
        // 決着の書き方は resultOf にまとめてある。
        // ここで '1-0' と直に書くと、黒が勝つ棋譜を1本入れた日に嘘になる
        var res = resultOf(S.pos);
        say('Checkmate — ' + (st.winner === 'w' ? 'White' : 'Black') + ' wins. ' + res,
            'チェックメイト。' + (st.winner === 'w' ? '白' : '黒') + 'の かち。きふの さいごは ' + res + '。', 'good');
      }
      markSeen(S.index);
    }
  }


  // ----------------------------------------------------------------
  // 12. 棋譜のテキスト
  // ----------------------------------------------------------------
  //
  // 「1. e4 e5 2. Nf3」の形に組む。黒から始まる盤では「1... d5」になる。
  // 相手が動かないレッスン（still）では自分の手だけが続くので、
  // 結果として1手ごとに番号が付く。それで正しい。

  // 棋譜のいちばんうしろに書く結果。決着がついていなければ空。
  // 書き方は PGN と同じ 1-0 / 0-1 / 1/2-1/2（レッスン20で教えるもの）。
  function resultOf(pos) {
    var st = C.status(pos);
    if (st.kind === 'checkmate') return st.winner === 'w' ? '1-0' : '0-1';
    if (st.kind === 'stalemate' || st.kind === 'material' ||
        st.kind === 'repetition5' || st.kind === 'seventyfive') return '1/2-1/2';
    return '';
  }

  function writeRecord() {
    var no = S.start.full;
    var out = '';
    var prev = null;
    S.record.forEach(function (e) {
      if (e.color === 'w') {
        // 白が2回続くのは、相手が動かないレッスン。
        // 1手ごとに番号が上がるのが正しい（黒の手が存在しないため）
        if (prev !== null) no++;
        out += (out ? ' ' : '') + no + '. ' + e.san;
      } else if (prev === null) {
        // 黒から始まる盤。「1... d5」と書くのが決まり
        out += no + '... ' + e.san;
      } else if (prev === 'b') {
        no++;
        out += ' ' + no + '... ' + e.san;
      } else {
        out += ' ' + e.san;
      }
      prev = e.color;
    });

    // 決着がついたら結果を足す。棋譜はここまで書いて1つの形になる
    var result = out ? resultOf(S.pos) : '';
    if (result) out += ' ' + result;
    // 並べた盤から始めた棋譜は、はじめの盤が分からないと読み返せない
    if (out && goal().kind === 'sandbox' && S.arrFen) out = '[FEN "' + S.arrFen + '"] ' + out;

    ui.record.textContent = out;
    ui.recordHint.hidden = out !== '';
    ui.copy.disabled = out === '';
  }

  function copyRecord() {
    var text = ui.record.textContent;
    if (!text) return;
    // navigator.clipboard は使わない。/kids* の CSP とは関係なく、
    // 権限を求める作りになっている環境があるため。
    // 選択してコピーする昔の手順なら、どこでも同じように動く。
    var ok = false;
    try {
      var range = document.createRange();
      range.selectNodeContents(ui.record);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ok = document.execCommand('copy');
      // うまくいったときだけ選択を外す。
      // 失敗したときに外してしまうと、「なぞってコピーしてね」と
      // 言いながら、こちらで選択を消していることになる。
      // 残しておけば、そのまま Ctrl+C / ⌘C を押すだけで済む
      if (ok) sel.removeAllRanges();
    } catch (e) { ok = false; }
    if (ok) say('Notation copied.', 'きふを コピーしたよ。', 'good');
    else say('The notation is selected — press Ctrl+C (or Cmd+C).',
             'きふを えらんで おいたよ。Ctrl+C（Mac は ⌘+C）を おして ね。');
  }


  // ----------------------------------------------------------------
  // 13. もどす・やりなおす
  // ----------------------------------------------------------------

  function undo() {
    if (S.timer) { window.clearTimeout(S.timer); S.timer = 0; S.waitBlack = false; }
    if (goal().kind === 'replay') return replayGo(-1);
    if (!S.past.length) return;
    var back = S.past.pop();
    // 追いかけ回と「コンピュータと さす」は、黒の手と自分の手が1組で1手に見える。
    // 1つだけ戻すと相手の手番で止まり、盤を触れないまま固まる
    if ((goal().kind === 'chase' || cpuOn() || win().answers) && S.past.length && back.pos.turn !== S.start.turn) {
      back = S.past.pop();
    }
    S.pos = back.pos;
    S.record = back.record;
    S.lineAt = back.lineAt;
    if (typeof back.chased === 'number') S.chased = back.chased;
    if (typeof back.ansAt === 'number') S.ansAt = back.ansAt;
    S.last = back.last || null;
    S.pick = -1;
    S.waiting = null;
    S.done = false;
    ui.promo.hidden = true;
    ui.done.hidden = true;
    ui.message.hidden = false;
    writeRecord();
    paint();
    updateButtons();
    clearSay();
  }

  function restart() {
    var les = lesson();
    var kind = les.goal.kind;

    // 待っている手があれば捨てる。残すと、やり直した盤の上で動く
    if (S.timer) { window.clearTimeout(S.timer); S.timer = 0; }

    S.start = C.fromFen(startFen());
    S.pos = C.fromFen(startFen());
    S.past = [];
    S.record = [];
    S.pick = -1;
    S.askAt = 0;
    S.hit = {};
    S.lineAt = 0;
    S.held = '';
    S.hinted = false;
    S.placed = {};
    S.waiting = null;
    S.replay = null;
    S.chased = 0;
    S.ansAt = 0;
    S.waitBlack = false;
    S.last = null;
    S.scored = false;
    S.done = false;

    // 並べて あそぶ：いつも並べる段階から始める。
    // 指している途中の「やりなおす」だけは、並べた盤を残して戻る
    S.phase = 'setup';
    S.vsCpu = false;
    if (kind === 'sandbox' && S.keepFen) S.pos = C.fromFen(S.keepFen);
    S.keepFen = '';

    ui.promo.hidden = true;
    ui.done.hidden = true;
    ui.message.hidden = false;

    if (kind === 'replay') buildReplay();
    paintSets();
    paintPalette();
    paintLevel();

    bi(ui.task, les.task.en, les.task.ja);
    writeRecord();
    paint();
    updateButtons();

    // 最初の一言
    if (kind === 'squares' && les.goal.ordered) {
      say('Find ' + les.goal.ask[0] + '.', les.goal.ask[0] + 'を さがして おしてみて。');
    } else if (win().line) {
      say('Play this move: ' + win().line[0], 'さいしょの 手は ' + win().line[0] + '。');
    } else if (kind === 'replay') {
      say('Start of the game.', 'たいきょくの はじまり。');
    } else if (kind === 'chase') {
      say('You play White. Try to checkmate the black king.',
          '白が きみ。黒の キングを 詰ませられるか ためしてみよう。');
    } else if (kind === 'sandbox') {
      say('Pick a piece, tap a square, then press Play.',
          'こまを えらんで、マスを おす。できたら「あそぶ」を おす。');
    } else if (kind === 'read') {
      var st = C.status(S.pos);
      if (st.kind === 'material') {
        say('Dead position — a draw.', 'この かたちは、もう どちらも 詰ませられない。ひきわけ。');
      } else { clearSay(); }
    } else {
      clearSay();
    }
  }

  function updateButtons() {
    var kind = goal().kind;
    if (kind === 'replay') {
      bi(ui.undo, 'Back', '1手もどす');
      ui.forward.hidden = false;
      ui.undo.disabled = S.replay.at === 0;
      ui.forward.disabled = S.replay.at >= S.replay.list.length - 1;
    } else {
      bi(ui.undo, 'Undo', 'もどす');
      ui.forward.hidden = true;
      ui.undo.disabled = S.past.length === 0;
    }
    ui.reset.disabled = false;
    if (ui.hint) {
      ui.hint.hidden = !answerNow();
      ui.hint.disabled = S.done || S.hinted;
    }
  }

  // ヒント。動かす駒だけを光らせる。行き先は出さない。
  // 答えを見せずに、探す範囲だけ狭める
  function showHint() {
    if (!answerNow()) return;
    S.hinted = true;
    paint();
    say('Move this piece.', 'この こまを うごかすよ。');
  }

  function hintFrom() {
    if (!S.hinted || !answerNow()) return -1;
    var m = C.parseSan(S.pos, answerNow());
    return m ? m.from : -1;
  }

  function shake(i) {
    var b = squares[i];
    if (!b) return;
    b.classList.remove('wrong');
    // 一度 reflow させないと、同じマスを続けて押したときに動かない
    void b.offsetWidth;
    b.classList.add('wrong');
    window.setTimeout(function () { b.classList.remove('wrong'); }, 320);
  }


  // ----------------------------------------------------------------
  // 14. できたときの知らせ
  // ----------------------------------------------------------------

  function finish() {
    S.done = true;
    S.pick = -1;
    ui.promo.hidden = true;
    paint();
    updateButtons();
    markSeen(S.index);

    // 「巻のおしまい」は、最後に終われる回のこと。
    // 1巻の最後は「ふたりで さす」で、あれは終わりの知らせが出ない。
    // 番号でいちばん後ろを おしまい にすると、巻をまたぐ案内が
    // 一度も出ないまま終わる（実際そうなっていた）
    var last = true;
    for (var n = S.index + 1; n < DATA.lessons.length; n++) {
      var k = DATA.lessons[n].goal.kind;
      if (k !== 'free' && k !== 'read' && k !== 'replay') { last = false; break; }
    }
    // 巻の番号は lessons.js から取る。書き込みにすると、
    // 巻を足したときに「3巻なのに 1かんは おわり」と出る
    var volNo = (DATA.volume && DATA.volume.no) || 1;
    bi(ui.doneTitle,
       last ? 'Volume ' + volNo + ' complete!' : 'Done!',
       last ? 'これで ' + volNo + 'かんは おわり！' : 'できた！');

    var chase = goal().kind === 'chase';

    // この巻の次の巻。あれば、おしまいのボタンがそこへ繋がる
    var next = null;
    if (DATA.volumes && DATA.volume) {
      for (var v = 0; v < DATA.volumes.length; v++) {
        if (DATA.volumes[v].no === DATA.volume.no + 1) next = DATA.volumes[v];
      }
    }

    bi(ui.doneNote,
       lesson().en + ' — ' + (chase
         ? 'Keep playing as long as you like.'
         : (last ? (next ? 'Volume ' + next.no + ' is next: ' + next.en + '.'
                         : 'That is the whole volume.')
                 : 'On to the next lesson.')),
       lesson().ja + ' — ' + (chase
         ? '気が すむまで つづけて いいよ。べつの くみあわせも ためしてみて。'
         : (last ? (next ? 'つぎは ' + next.no + '巻（' + next.ja + '）。'
                         : 'この 巻は ここまで。')
                 : 'つぎの レッスンへ すすもう。')));

    // おしまいまで来たら、ボタンを「つぎの巻へ」に変える。
    // 巻のボタンは上にもあるが、読み終えた流れのまま進める方が自然
    if (last && next) {
      ui.advance.hidden = false;
      bi(ui.advance, 'Volume ' + next.no + ': ' + next.en, 'つぎの かんへ');
      ui.advance.dataset.go = next.url;
    } else {
      ui.advance.hidden = last;
      bi(ui.advance, 'Next lesson', 'つぎの レッスン');
      delete ui.advance.dataset.go;
    }
    ui.done.hidden = false;

    // 知らせを盤の下に出すようになったので、空の一言の行が
    // 盤と知らせのあいだに空きを作る。終わったときだけ畳む。
    // 遊んでいる最中は畳まない（高さが変わるとボタンが動き、
    // 押そうとした指が外れる。それがこの行の min-height の理由）
    ui.message.hidden = ui.message.textContent.trim() === '';

    // キーボードだけで進めるように、知らせが出たらボタンへ移す。
    // preventScroll を付けているのは、focus がボタンを画面に入れようとして
    // 盤を上へ押し出してしまうため。盤を見せるために下へ移したのに、
    // その盤が流れていっては元も子もない
    // 追いかけ回だけは焦点を移さない。まだ盤を触っている最中であり、
    // ボタンへ飛ばすと「もう終わり」という合図になってしまう
    if (!chase) {
      var go = last ? ui.retry : ui.advance;
      try { go.focus({ preventScroll: true }); } catch (e) { go.focus(); }
    }
    // 盤の上端を画面の上に寄せる。盤と、その下の知らせが一度に入る
    var wrap = document.querySelector('.board-wrap');
    if (wrap && wrap.scrollIntoView) wrap.scrollIntoView({ block: 'start' });
  }


  // ----------------------------------------------------------------
  // 15. 起動
  // ----------------------------------------------------------------

  function startAt() {
    // #3 のように番号を付けて開ける。レッスンを人に教えるときのため。
    // 外へ出るリンクではないので、こども向け領域の約束は破らない
    var m = /^#l?(\d+)$/.exec(window.location.hash || '');
    if (!m) return 0;
    var n = parseInt(m[1], 10) - 1;
    return (n >= 0 && n < DATA.lessons.length) ? n : 0;
  }

  function boot() {
    buildBoard();
    paintVolumes();
    buildToc();

    ui.undo.addEventListener('click', undo);
    ui.forward.addEventListener('click', function () { replayGo(1); });
    ui.reset.addEventListener('click', function () {
      // 並べて あそぶ：指している途中なら、並べた盤を残して並べ直しに戻る
      if (goal().kind === 'sandbox' && S.phase === 'play') S.keepFen = S.arrFen;
      restart();
    });
    ui.copy.addEventListener('click', copyRecord);
    paintSound();
    if (ui.sound) ui.sound.addEventListener('click', function () {
      if (!window.ChessSound) return;
      window.ChessSound.set(!window.ChessSound.isOn());
      paintSound();
    });
    if (ui.hint) ui.hint.addEventListener('click', showHint);
    ui.retry.addEventListener('click', function () { ui.done.hidden = true; restart(); });
    ui.advance.addEventListener('click', function () {
      // おしまいの回では、つぎの巻へ出ていく
      if (ui.advance.dataset.go) { window.location.href = ui.advance.dataset.go; return; }
      open(S.index + 1);
    });
    ui.prev.addEventListener('click', function () { open(S.index - 1); });
    ui.next.addEventListener('click', function () { open(S.index + 1); });

    window.addEventListener('hashchange', function () { open(startAt()); });

    open(startAt());
  }

  boot();

})();
