// ================================================================
// klotski.js – 箱入り娘ゆかりのスライドパズル、共通エンジン
// ================================================================
//
// 4×5 の盤から 2×2 の駒を下の出口へ運び出すパズルの、盤面の仕組み。
// 同じ仕組みを3本のゲームが共有している。
//
//   /kids/hakoiri-musume/   箱入り娘   日本語・娘と奉公人
//   /kids/klotski/          KLOTSKI    英語・文字のないブロック
//   /kids/huarongdao/       華容道     繁體中文・三國演義
//
// 3本は駒の構成がまったく同じ（5×4の盤に 2×2が1つ・2×1が5つ・1×1が4つ）で、
// 違うのは駒の名札と色と文言、そして始まりの配置だけである。
// だからここに仕組みを1本だけ置き、
// 各ゲームの game.js には「配置・名札・文言」しか書かない。
//
//   /kids/klotski/          最短32手   いちばんやさしい
//   /kids/huarongdao/       最短81手   橫刀立馬
//   /kids/hakoiri-musume/   81〜120手  むずかしさを4段から選べる
//
// この手数は盤面を総当たりで解いて確かめた値である（数え方は下記）。
// 配置を変えたら必ず解き直し、各ゲームの注記も書き換えること。
//
// ★ なぜ共有しているのか ★
//   同じ450行を3か所に置くと、片方で見つけた不具合を3回直すことになり、
//   1つ直し忘れると「同じパズルなのに1本だけ挙動が違う」という、
//   いちばん気づきにくい壊れ方をする。
//   どうぶつめくり（/kids/memory/）が、めくる仕組みとカードの中身を
//   分けてあるのと同じ考え方である。
//
// ★ ここを直すと3本すべてが変わる ★
//   直したら3本とも開いて確かめること。
//
// ★ 盤面の持ち方 ★
//   マスの二次元配列は持たない。駒を { x, y, w, h } の長方形としてだけ持ち、
//   重なりは長方形どうしの交差（isFree）1本で判定する。
//   駒は10個しかないため、毎回すべてと比べても充分に軽い。
//
//   配列で持つ方式にしないのは、2×2 や 1×2 の駒を置くたびに複数のマスへ
//   同じ駒を書き込むことになり、書き込み漏れが「駒が重なって見える」
//   という形で静かに現れるため。長方形なら駒の位置は常に1か所にしかない。
//
// ★ 手数の数え方 ★
//   同じ駒を続けて動かしている間は1手として数える。
//   これはこのパズルの慣習で、よく知られた「橫刀立馬の最短81手」も
//   この数え方による。1マスごとに数えると同じ解き方でも手数が倍以上になり、
//   「81手」という目標が意味を持たなくなる。
//
// ★ 時間は計らない ★
//   以前は手数の横に経過時間を出していたが、やめた。
//   動いている時計は、こどもにとって「急がなければいけない」という
//   合図になる。このパズルは急いで解くものではないし、
//   じっと盤を眺めて考えている時間こそが中身である。
//   記録に残すのも手数だけにしている。
//
// ★ 保存するもの ★
//   自己最少手数だけ。盤面は保存しない。
//   途中でやめたら盤面は捨てられ、次に入ったときは最初の配置から始まる。
//   盤面を復元すると「解けない形で固まったまま再開する」ことがあり、
//   やり直しのボタンを押すまで抜けられなくなるため、あえて保存しない。
//
//
// ── 使い方 ────────────────────────────────────────────────────
//
//   KLOTSKI.start({
//     bestKey:   'fdl_xxx_best',      // 自己最少手数の保存キー
//     clearsKey: 'fdl_xxx_clears',    // クリア回数の保存キー（省略可）
//     goalId:  'musume',              // 出口へ運ぶ駒の id
//     goal:    { x: 1, y: 3 },        // その駒が収まるべき左上のマス
//     pieces: [
//       { id, type, w, h, x, y, label, face, ruby }
//       //  id    … 駒を見分ける文字列。手数の数え方に使う
//       //  type  … そのまま class 属性に入る。空白で区切れば複数書ける
//       //  w, h  … 横・縦のマス数     x, y … 置く位置（左上が 0, 0）
//       //  label … 読み上げ用の名前（画面には出ない）
//       //  face  … 駒の表に出す文字。省略すると何も出ない
//       //  ruby  … face に振るふりがな。省略すると振らない
//     ],
//     text: {
//       result   (moves)       {},    // 「12手」
//       bestFirst(moves)       {},    // 初めてクリアしたとき
//       bestKept (best)        {},    // 記録を更新しなかったとき
//       bestNew  (prev)        {},    // 更新したとき（prev は更新前の記録）
//       clears   (n)           {}     // クリア回数の読み上げ（省略可）
//     }
//   });
//
// HTML 側に必要な id は8つ。3本とも同じ名前を使っている。
//   grid moves undo reset clear result best again
//
// これに加えて id="clears" があれば、クリア回数の印をそこに出す。
// 無ければ何もしない。箱入り娘は印をむずかしさのボタンに出すので置いていない。
//
// ── クリア回数 ────────────────────────────────────────────────
//
//   clearsKey を渡すと、上がるたびに1つ足して覚えておく。
//     0回 … 何も出さない
//     1回 … 🏆
//     2回以上 … 🏆 2
//
//   回数は見せるだけで、何かを開く条件には使っていない。
//   ブラウザによっては、しばらく訪れないと localStorage を自動で消すため、
//   貯めた回数は黙って 0 に戻ることがある。消えても遊びに支障が出ない
//   ようにしておく必要がある（開放の条件に使ってはいけない理由がこれ）。
//
// ── 難易度を選べるようにするとき ──────────────────────────────
//
//   start() は盤を入れ替える口を返す。
//     const game = KLOTSKI.start(cfg);
//     game.setLayout(pieces, bestKey);   // 盤を入れ替えて最初から
//
//   cfg.onClear を渡しておくと、上がったときに呼ばれる。
//     onClear({ moves, isNew, previous })
//   これを使うと、クリアした瞬間に次の難易度を開くといったことが、
//   エンジンの側を1行も変えずに各ゲームの game.js で書ける。
//   箱入り娘だけがこの2つを使っている。
// ================================================================

window.KLOTSKI = (() => {
  'use strict';

  function start(cfg) {
    const COLS = cfg.cols || 4;
    const ROWS = cfg.rows || 5;
    const GOAL = cfg.goal;

    // 「視差効果を減らす」を選んでいるか。出口から飛び出す演出の有無に使う。
    // matchMedia が無い環境（古いブラウザ）では false 扱いで演出を出す。
    const reduceMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    const grid     = document.getElementById('grid');
    const movesEl  = document.getElementById('moves');
    const undoBtn  = document.getElementById('undo');
    const resetBtn = document.getElementById('reset');
    const clearEl  = document.getElementById('clear');
    const resultEl = document.getElementById('result');
    const bestEl   = document.getElementById('best');
    const againBtn = document.getElementById('again');

    let pieces = [], moves = 0, lastId = null, history = [], won = false;
    let drag = null;


    // ============================================================
    // 記録の読み書き
    // ============================================================
    //
    // 読みと書きで try/catch を分けている。
    // Safari のプライベートブラウズには「読めるが書けない」状態があり、
    // 保存容量が 0 のため setItem だけが例外を投げる。
    // 読み側だけ守っても、クリアした瞬間にここで落ちて
    // 結果が表示されないゲームになる。

    function loadBest() {
      try {
        const n = parseInt(localStorage.getItem(cfg.bestKey), 10);
        // 妥当な手数のときだけ採用する。NaN を返すと比較が常に false になり
        // （moves < NaN は必ず false）、一度壊れると二度と更新できなくなる。
        return Number.isFinite(n) && n > 0 ? n : 0;
      } catch (e) {
        return 0;   // 読めない環境では記録なしとして扱う
      }
    }

    function saveBest(value) {
      try {
        localStorage.setItem(cfg.bestKey, String(value));
      } catch (e) {
        /* 保存できなくても続行する（記録は今回だけのものになる） */
      }
    }

    /**
     * クリア回数を読む。手数と同じく、壊れた値は 0 として扱う。
     * @param {string} key - 省略すると今の盤のキー
     * @returns {number} 0 以上。0 は「まだクリアしていない」
     */
    function loadClears(key) {
      const k = key || cfg.clearsKey;
      if (!k) return 0;
      try {
        const n = parseInt(localStorage.getItem(k), 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
      } catch (e) {
        return 0;   // 読めない環境では0回として扱う
      }
    }

    /**
     * クリア回数を1つ足す。
     * 書けない環境（Safari のプライベートブラウズなど）では保存されないが、
     * 足した後の数は返すので、そのときの結果表示だけは正しく出る。
     * @returns {number} 足した後の回数
     */
    function addClear() {
      if (!cfg.clearsKey) return 0;
      const next = loadClears() + 1;
      try {
        localStorage.setItem(cfg.clearsKey, String(next));
      } catch (e) {
        /* 保存できなくても続行する（回数は今回だけのものになる） */
      }
      return next;
    }

    /**
     * クリア回数の印。1回目は数字を出さない。
     * 数字に絵文字（1️⃣ など）を使わないのは、環境ごとに幅が変わって
     * 桁が揃わないため。普通の文字で出す。
     * @param {number} n
     * @returns {string} '' / '🏆' / '🏆 2'
     */
    function clearsBadge(n) {
      if (!n) return '';
      return n === 1 ? '🏆' : '🏆 ' + n;
    }

    /** id="clears" があれば、そこに印を描く。無ければ何もしない。 */
    function renderClears() {
      const el = document.getElementById('clears');
      if (!el) return;
      const n = loadClears();
      el.textContent = clearsBadge(n);
      el.hidden = n === 0;
      // 画面には絵文字しか出ないので、読み上げ用の言葉は各ゲームから受け取る
      if (cfg.text && cfg.text.clears) el.setAttribute('aria-label', cfg.text.clears(n));
    }


    // ============================================================
    // 盤面のロジック
    // ============================================================

    /**
     * 駒 p を (x, y) に置けるか。盤の外に出る場合と、
     * 他の駒と1マスでも重なる場合に false を返す。
     */
    function isFree(p, x, y) {
      if (x < 0 || y < 0 || x + p.w > COLS || y + p.h > ROWS) return false;
      for (const q of pieces) {
        if (q === p) continue;
        // 長方形の交差判定。4辺すべてで重なっていれば重なっている
        if (x < q.x + q.w && x + p.w > q.x && y < q.y + q.h && y + p.h > q.y) return false;
      }
      return true;
    }

    /**
     * 現在地から軸方向へ何マス進めるかを数える。
     * 1マスずつ isFree で試すので、途中に駒があればそこで止まる。
     * 指をどれだけ引いても通れない駒を通り抜けないのは、この範囲のため。
     *
     * @returns {{pos: number, neg: number}} 正方向・負方向に動けるマス数
     */
    function freeRange(p, bx, by, axis) {
      const ax = axis === 'x' ? 1 : 0, ay = 1 - ax;
      let pos = 0, neg = 0;
      while (isFree(p, bx + ax * (pos + 1), by + ay * (pos + 1))) pos++;
      while (isFree(p, bx - ax * (neg + 1), by - ay * (neg + 1))) neg++;
      return { pos, neg };
    }

    // 戻すための控え。全駒の座標と手数を1つのまとまりにして積む
    const snapshot = () => ({ pos: pieces.map(p => [p.x, p.y]), moves, lastId });


    // ============================================================
    // 表示
    // ============================================================

    // 1マスの実寸（px）。駒の文字の大きさと角の丸みに使う
    function cellPx() { return grid.getBoundingClientRect().width / COLS; }

    // 位置は % で入れる。px で入れると、画面の回転や
    // アドレスバーの出入りで盤の大きさが変わったときに駒がずれる。
    function setPos(p, fx, fy) {
      p.el.style.left = (fx / COLS * 100) + '%';
      p.el.style.top  = (fy / ROWS * 100) + '%';
    }

    // CSS 側は --cell を基準に文字の大きさを決めている。
    // 盤の大きさが変わるたびに測り直して渡す。
    function updateCellVar() { grid.style.setProperty('--cell', cellPx() + 'px'); }

    /**
     * 駒の表に出すものを組み立てる。
     * face が無ければ何も入れない（文字を持たない版のため）。
     * ruby があれば <ruby> で読みを振る。
     *
     * 文字は <span class="text"> で1枚包む。縦書きにする版
     * （箱入り娘・華容道）が writing-mode をこの span に掛けるため。
     * .face 自身に掛けてはいけない。.face は height: 100% を持つ
     * flex 容器であり、iOS Safari ではこの組み合わせに縦書きを足すと
     * 高さがボタンではなく画面いっぱいまで伸び、駒が盤の外へ
     * 細長くはみ出して下の文字やボタンを覆ってしまう。
     * 中身だけを包んだ span なら内容ぶんの大きさしか持たない。
     *
     * innerHTML を使わず DOM を組んでいるのは、文字列から要素を作る道を
     * 1本も残さないため。ここに来る値は game.js に書いた固定の文字だけだが、
     * 「ここは文字列を解釈しない」と決めておけば、後から何を足しても安全側に倒れる。
     */
    function buildFace(p) {
      const face = document.createElement('span');
      face.className = 'face';
      if (!p.face) return face;

      const text = document.createElement('span');
      text.className = 'text';
      if (p.ruby) {
        const ruby = document.createElement('ruby');
        ruby.appendChild(document.createTextNode(p.face));
        const rt = document.createElement('rt');
        rt.textContent = p.ruby;
        ruby.appendChild(rt);
        text.appendChild(ruby);
      } else {
        text.textContent = p.face;
      }
      face.appendChild(text);
      return face;
    }

    function build() {
      grid.textContent = '';
      for (const p of pieces) {
        // <button> にしているのは、キーボードで選べるようにするため。
        // <div> だとフォーカスが当たらず、矢印キーでの操作ができない。
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'piece ' + p.type;
        el.style.width  = (p.w / COLS * 100) + '%';
        el.style.height = (p.h / ROWS * 100) + '%';
        el.setAttribute('aria-label', p.label);
        el.appendChild(buildFace(p));

        el.addEventListener('pointerdown', e => onDown(e, p));
        el.addEventListener('keydown', e => onKey(e, p));
        p.el = el;
        setPos(p, p.x, p.y);
        grid.appendChild(el);
      }
      updateCellVar();
    }

    function refreshHud() {
      movesEl.textContent = moves;
      undoBtn.disabled = history.length === 0 || won;
    }


    // ============================================================
    // 手の確定
    // ============================================================

    function commit(p, before) {
      // 別の駒に触ったときだけ新しい1手として数える。
      // 同じ駒を続けて動かしている間は、何マス動かしても1手。
      if (p.id !== lastId) {
        history.push(before);
        moves++;
        lastId = p.id;
      }
      refreshHud();
      checkWin();
    }

    function checkWin() {
      const m = pieces.find(p => p.id === cfg.goalId);
      if (!m || m.x !== GOAL.x || m.y !== GOAL.y) return;

      won = true;
      refreshHud();

      const prev = loadBest();
      const isNew = prev === 0 || moves < prev;
      if (isNew) saveBest(moves);

      const clears = addClear();
      renderClears();

      resultEl.textContent = cfg.text.result(moves);
      if (prev === 0)      bestEl.textContent = cfg.text.bestFirst(moves);
      else if (isNew)      bestEl.textContent = cfg.text.bestNew(prev);
      else                 bestEl.textContent = cfg.text.bestKept(prev);

      // クリアを game.js に知らせる。クリア表示を出す前に呼ぶので、
      // 受け取った側は、表示の中身（開放の知らせなど）をここで足せる。
      if (cfg.onClear) {
        cfg.onClear({ moves: moves, isNew: isNew, previous: prev, clears: clears });
      }

      if (reduceMotion) {
        // 動きを減らす設定のときは駒を飛び出させず、その場に置いたまま結果を出す
        clearEl.hidden = false;
        againBtn.focus();
        return;
      }

      // 1フレーム待ってからクラスを付ける。同じフレームで位置とクラスを
      // 変えると、ブラウザが両方まとめて適用して transition が始まらない。
      requestAnimationFrame(() => {
        m.el.classList.add('escape');
        setPos(m, GOAL.x, ROWS + 0.4);   // 盤の下へ抜けていく
      });
      // 抜けきってから結果を出す（各 style.css の .escape と合わせた長さ）
      setTimeout(() => { clearEl.hidden = false; againBtn.focus(); }, 1100);
    }


    // ============================================================
    // ドラッグ
    // ============================================================
    //
    // 指やマウスで駒をなぞって動かす。要点は3つ。
    //   ・動かせる範囲（freeRange）の外へは出さない。壁や駒をすり抜けない
    //   ・縦か横かは、最初に少し動いた方向で決める
    //   ・マスに揃ったところで直角に引けば、指を離さずに曲がれる
    //
    // setPointerCapture を使っているので、指が駒の外に出ても
    // 同じ駒を動かし続けられる。これが無いと、速く動かしたときに
    // ポインタが駒から外れて操作が途切れる。

    function onDown(e, p) {
      // e.button > 0 … 右クリックと中クリックでは始めない
      if (won || drag || (e.button !== undefined && e.button > 0)) return;
      e.preventDefault();
      p.el.setPointerCapture(e.pointerId);
      p.el.classList.add('lift');
      drag = {
        p, id: e.pointerId,
        sx: e.clientX, sy: e.clientY,   // つかんだ位置
        bx: p.x, by: p.y,               // 今の軸の始点（曲がると更新される）
        ox: p.x, oy: p.y,               // 最初の位置（動いたかの判定用）
        axis: null, range: null, off: 0,
        before: snapshot()
      };
      p.el.addEventListener('pointermove', onMove);
      p.el.addEventListener('pointerup', onUp);
      p.el.addEventListener('pointercancel', onUp);
    }

    function onMove(e) {
      const d = drag;
      if (!d || e.pointerId !== d.id) return;
      const c = cellPx();
      let dx = (e.clientX - d.sx) / c, dy = (e.clientY - d.sy) / c;

      if (!d.axis) {
        // 0.08マス動くまでは軸を決めない。触れた瞬間の微妙な震えで
        // 動かしたくない方向に決まってしまうのを防ぐ。
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 0.08) return;
        d.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        d.range = freeRange(d.p, d.bx, d.by, d.axis);

        // 選んだ方向には動けず、もう一方なら動ける場合は軸を入れ替える。
        // 斜めに引いたときに「動くはずの駒が動かない」と感じさせないため。
        const along = d.axis === 'x' ? dx : dy;
        if ((along > 0 ? d.range.pos : d.range.neg) === 0) {
          const other = d.axis === 'x' ? 'y' : 'x';
          const r2 = freeRange(d.p, d.bx, d.by, other);
          const perp = other === 'x' ? dx : dy;
          if ((perp > 0 ? r2.pos : r2.neg) > 0) { d.axis = other; d.range = r2; }
        }
      } else {
        // 曲がり角。マスの位置にほぼ揃っていて、直角方向へ充分に引いていて、
        // その引きが進行方向の残りより大きいときだけ曲がる。
        // 条件を緩めると、まっすぐ動かしているだけで勝手に曲がる。
        const k = Math.round(d.off);                     // 今いる一番近いマス
        const along = d.axis === 'x' ? dx : dy;
        const perp  = d.axis === 'x' ? dy : dx;
        if (Math.abs(d.off - k) < 0.25 && Math.abs(perp) > 0.35 && Math.abs(perp) > Math.abs(along - k)) {
          const nbx = d.bx + (d.axis === 'x' ? k : 0);
          const nby = d.by + (d.axis === 'y' ? k : 0);
          const other = d.axis === 'x' ? 'y' : 'x';
          const r2 = freeRange(d.p, nbx, nby, other);
          if ((perp > 0 ? r2.pos : r2.neg) > 0) {
            // 曲がった地点を新しい始点にする。つかんだ位置も同じだけずらすと、
            // 指と駒の相対位置が保たれ、駒が指の下から飛ばない。
            if (d.axis === 'x') d.sx += k * c; else d.sy += k * c;
            d.bx = nbx; d.by = nby; d.axis = other; d.range = r2;
            dx = (e.clientX - d.sx) / c; dy = (e.clientY - d.sy) / c;
          }
        }
      }

      // 動かせる範囲で切り落とす。範囲の端より先は指に追従しない
      const raw = d.axis === 'x' ? dx : dy;
      d.off = Math.max(-d.range.neg, Math.min(d.range.pos, raw));
      if (d.axis === 'x') setPos(d.p, d.bx + d.off, d.by);
      else                setPos(d.p, d.bx, d.by + d.off);
    }

    function onUp(e) {
      const d = drag;
      if (!d || e.pointerId !== d.id) return;
      const p = d.p;
      p.el.removeEventListener('pointermove', onMove);
      p.el.removeEventListener('pointerup', onUp);
      p.el.removeEventListener('pointercancel', onUp);

      // 一番近いマスへ吸着させる。途中で止めても半端な位置には残らない
      const k = d.axis ? Math.round(d.off) : 0;
      p.x = d.bx + (d.axis === 'x' ? k : 0);
      p.y = d.by + (d.axis === 'y' ? k : 0);
      p.el.classList.remove('lift');
      setPos(p, p.x, p.y);
      drag = null;

      // 触っただけ・元の位置に戻った場合は手数に数えない
      if (p.x !== d.ox || p.y !== d.oy) commit(p, d.before);
    }


    // ============================================================
    // キーボード（矢印キーで1マスずつ）
    // ============================================================
    //
    // Tab で駒を選び、矢印キーで動かす。マウスも指も使わずに解ける。
    // preventDefault しているのは、矢印キーでページがスクロールするのを
    // 止めるため。盤に当たっているときだけ止めている。

    function onKey(e, p) {
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!dir || won || drag) return;
      e.preventDefault();
      if (!isFree(p, p.x + dir[0], p.y + dir[1])) return;
      const before = snapshot();
      p.x += dir[0]; p.y += dir[1];
      setPos(p, p.x, p.y);
      commit(p, before);
    }


    // ============================================================
    // 戻す・やり直す
    // ============================================================

    function undo() {
      if (!history.length || won || drag) return;
      const s = history.pop();
      pieces.forEach((p, i) => { p.x = s.pos[i][0]; p.y = s.pos[i][1]; setPos(p, p.x, p.y); });
      moves = s.moves; lastId = s.lastId;
      refreshHud();
    }

    function reset() {
      drag = null;
      // 配置表は複製してから使う。そのまま使うと、1回目の遊びで
      // x と y を書き換えてしまい、2回目が途中の盤面から始まる。
      pieces = cfg.pieces.map(p => ({ ...p }));
      moves = 0; lastId = null; history = []; won = false;
      clearEl.hidden = true;
      build();
      refreshHud();
      // 難易度を変えると回数も変わるので、盤を組み直すたびに描き直す。
      // refreshHud ではなくここで呼ぶのは、1手ごとに localStorage を
      // 読みに行かないようにするため。回数は上がった瞬間にしか増えない。
      renderClears();
    }

    undoBtn.addEventListener('click', undo);
    resetBtn.addEventListener('click', reset);
    againBtn.addEventListener('click', reset);

    // 盤の大きさが変わったら --cell を測り直す。
    // ResizeObserver は画面の回転だけでなく、アドレスバーの出入りや
    // 文字サイズの変更でも効く。無い環境では resize だけで補う。
    window.addEventListener('resize', updateCellVar);
    if (window.ResizeObserver) new ResizeObserver(updateCellVar).observe(grid);

    reset();

    // 盤を入れ替える口。難易度を選べるゲーム（箱入り娘）が使う。
    // 他の2本は戻り値を使わないので、何も変わらない。
    return {
      setLayout: function (pieces, bestKey, clearsKey) {
        cfg.pieces = pieces;
        if (bestKey)   cfg.bestKey   = bestKey;
        if (clearsKey) cfg.clearsKey = clearsKey;
        reset();
      },

      // 印の読み書きを外からも使えるようにする。箱入り娘が、まだ選んでいない
      // むずかしさの回数まで含めて、ボタン4つぶんを描くのに使う。
      getClears:   loadClears,
      clearsBadge: clearsBadge
    };
  }

  return { start };
})();
