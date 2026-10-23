// ================================================================
// game.js – ANIMAL MATCH（どうぶつめくり）
// ================================================================
//
// iOS アプリ（FDL-TenBlitz）の Memory から移植したもの。
//
// ★ 設計の方針：カード面とロジックを分ける ★
//   このロジックはカードを pairId という「ただの文字列」でしか
//   区別していない。ゾウなのか星座なのか、絵文字なのか文字なのかは
//   一切知らない。カードの中身は DECK が供給する。
//
//   そのため、くだもの・せいざ・つき などを後から足すときは
//   DECK を差し替えるだけで済み、めくる・そろえる・クリアするという
//   ルールには一行も手を入れずに済む。
//   （iOS 版が星座と月を足したときも、エンジンは変えていない）
//
// ★ 保存しないもの ★
//   盤面もスコアも保存しない。途中でやめたら盤面は捨てられ、
//   次に入ったときは新しくシャッフルし直す。
//
// ★ 「十二支」と書かない理由 ★
//   12種の動物を使っているが、特定の暦の名前は出さない。
//   国によって入る動物が違うため、「12組のどうぶつ」としてだけ扱う。


// ── カードの中身 ─────────────────────────────────────────────
/*
 * 1組ぶんの定義。
 *   id    … 一致の判定に使う文字列。ロジックが見るのはこれだけ
 *   face  … カードの表に出すもの
 *   label … 読み上げ用の名前
 */
const DECK = [
  { id: 'mouse',   face: '🐁', label: 'Mouse / ねずみ'   },
  { id: 'rabbit',  face: '🐇', label: 'Rabbit / うさぎ'  },
  { id: 'tiger',   face: '🐅', label: 'Tiger / とら'     },
  { id: 'ox',      face: '🐂', label: 'Ox / うし'        },
  { id: 'dragon',  face: '🐉', label: 'Dragon / りゅう'  },
  { id: 'snake',   face: '🐍', label: 'Snake / へび'     },
  { id: 'donkey',  face: '🫏', label: 'Donkey / ろば'    },
  { id: 'sheep',   face: '🐏', label: 'Sheep / ひつじ'   },
  { id: 'monkey',  face: '🐒', label: 'Monkey / さる'    },
  { id: 'rooster', face: '🐓', label: 'Rooster / にわとり' },
  { id: 'dog',     face: '🐕', label: 'Dog / いぬ'       },
  { id: 'pig',     face: '🐖', label: 'Pig / ぶた'       },
];

const COLUMNS   = 5;   // 5列。12組＝24枚なので、中央の1マスだけ飾りになる
const CENTER_AT = 12;  // 5×5 の中央（0から数えて12番目）


// ── 時間の調整値（秒）─────────────────────────────────────────
// iOS の MemoryTuning から移した値。
const FLIP_MS        = 250;   // めくるアニメーションの長さ
const MATCH_HOLD_MS  = 350;   // そろったときの演出
const MISMATCH_MS    = 800;   // そろわなかった2枚を見せておく長さ
const MIN_REVEAL_MS  = 350;   // 2枚目が表になってから、伏せられるまでの最短時間
const CLEAR_HOLD_MS  = 1200;  // 全部そろった盤面を見せておく長さ


// ── 状態 ──────────────────────────────────────────────────────
let cards      = [];     // { pairId, face, label, el, faceUp, matched }
let firstIdx   = -1;     // 1枚目に選んだカードの位置（-1 = まだ無い）
let secondIdx  = -1;     // 2枚目
let matched    = 0;      // そろった組の数
let flips      = 0;      // めくった回数
let lockUntil  = 0;      // この時刻まではタップを保留する（performance.now）
let bufferedId = -1;     // 保留中に来たタップを1件だけ覚えておく
let busy       = false;  // 2枚めくって判定中か

/*
 * ★ 世代番号 ★
 *
 * 不一致のとき「0.8秒後に2枚を伏せる」という処理を予約する。
 * ところがこのゲームは連打できるようにしてあるので、
 * その予約が実行される頃には、先行入力で盤面が次の手番に進んでいる
 * ことがある。何も対策しないと、めくったばかりのカードや
 * そろったばかりの組を、古い予約が伏せてしまう。
 *
 * そこで手番が切り替わるたびに generation を1つ進め、
 * 予約にはそのときの番号を持たせておく。実行の瞬間に現在の値と
 * 照らし合わせ、違っていれば「自分は古い予約だ」と判断して何もしない。
 */
let generation = 0;


// ── DOM の短縮 ───────────────────────────────────────────────
const $ = id => document.getElementById(id);

const screens = {
  top:    $('screen-top'),
  game:   $('screen-game'),
  result: $('screen-result'),
};

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('active', key === name);
  }
}


// ================================================================
// 盤面づくり
// ================================================================

/** Fisher-Yates で配列を混ぜる（数学的に均等な分布が保証される方法） */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startGame() {
  // 状態をすべて初期に戻す
  firstIdx = secondIdx = -1;
  matched = flips = 0;
  lockUntil = 0;
  bufferedId = -1;
  busy = false;
  generation++;   // 前の盤面に残っている予約を、ここで全部無効にする

  // 1組につき2枚ずつ作って混ぜる
  const deck = [];
  for (const item of DECK) {
    deck.push({ pairId: item.id, face: item.face, label: item.label });
    deck.push({ pairId: item.id, face: item.face, label: item.label });
  }
  shuffle(deck);

  const board = $('memoryBoard');
  board.innerHTML = '';
  cards = [];

  /*
   * 5×5 の 25マスに、24枚のカードと中央の飾りを置く。
   * 中央を飾りにしているのは、12組だと1マス余るため。
   * 空白にすると穴が開いて見えるので、ここだけ別のものを置く。
   */
  let deckIdx = 0;
  for (let cell = 0; cell < COLUMNS * 5; cell++) {
    if (cell === CENTER_AT) {
      const deco = document.createElement('div');
      deco.className = 'memory-center';
      deco.setAttribute('aria-hidden', 'true');
      deco.textContent = '🐾';
      board.appendChild(deco);
      continue;
    }

    const data = deck[deckIdx++];
    const idx  = cards.length;

    /*
     * カードは <button> にする。role と tabindex を自分で足すより、
     * 本物のボタンにした方が focus も Enter / Space も標準で付いてくる。
     * キーボードだけで遊ぶ人も、そのまま遊べる。
     */
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'memory-card';
    el.setAttribute('aria-label', 'Hidden card / ふせてあるカード');
    el.innerHTML =
      '<span class="memory-card-inner">' +
        '<span class="memory-face memory-face--back" aria-hidden="true">🐾</span>' +
        '<span class="memory-face memory-face--front" aria-hidden="true">' + data.face + '</span>' +
      '</span>';
    el.addEventListener('click', () => onTap(idx));
    board.appendChild(el);

    cards.push({ ...data, el, faceUp: false, matched: false });
  }

  updateHud();
  showScreen('game');
}


// ================================================================
// タップの受付
// ================================================================

/**
 * カードが押されたときの処理。
 *
 * ★ 連打を止めない ★
 *   一般的な神経衰弱は、2枚めくったあと伏せるまで入力を止める。
 *   このゲームは勢いよく進められることを大事にしているので止めない。
 *   待っている2枚が伏せられる前に別のカードを叩いたら、待機を打ち切って
 *   すぐ次の手番に進む。
 *
 * ★ ただし最短表示時間だけは待つ ★
 *   2枚目が表になった直後のタップまで受け付けると、
 *   連打している子は何がめくれたのかを一度も見られず、覚えようがない。
 *   めくってから MIN_REVEAL_MS の間は伏せない。
 *   その間に来たタップは捨てずに1件だけ覚えておき、あとで実行する。
 */
function onTap(idx) {
  const card = cards[idx];
  if (!card || card.matched || card.faceUp) return;

  // 最短表示時間の途中なら、1件だけ覚えておいてあとで処理する
  const now = performance.now();
  if (busy && now < lockUntil) {
    bufferedId = idx;
    return;
  }

  // 2枚見えている状態で3枚目が来た → 待機を打ち切って先へ進む
  if (busy) resolvePending();

  flipUp(idx);

  if (firstIdx < 0) {
    firstIdx = idx;
    updateHud();
    return;
  }

  secondIdx = idx;
  busy = true;
  lockUntil = now + MIN_REVEAL_MS;
  updateHud();

  const a = cards[firstIdx], b = cards[secondIdx];
  const gen = generation;

  if (a.pairId === b.pairId) {
    // ── そろった ──
    setTimeout(() => {
      if (gen !== generation) return;   // 古い予約なら何もしない
      a.matched = b.matched = true;
      a.el.classList.add('is-matched');
      b.el.classList.add('is-matched');
      a.el.disabled = b.el.disabled = true;
      matched++;
      clearPending();
      updateHud();
      if (matched === DECK.length) finish();
      else runBuffered();
    }, MATCH_HOLD_MS);

  } else {
    // ── そろわなかった ──
    setTimeout(() => {
      if (gen !== generation) return;
      resolvePending();
      runBuffered();
    }, MISMATCH_MS);
  }
}

/** 保留していたタップがあれば、1件だけ実行する */
function runBuffered() {
  if (bufferedId < 0) return;
  const next = bufferedId;
  bufferedId = -1;
  onTap(next);
}

/** 見えている2枚を伏せて、手番を終わらせる */
function resolvePending() {
  if (firstIdx >= 0 && !cards[firstIdx].matched) flipDown(firstIdx);
  if (secondIdx >= 0 && !cards[secondIdx].matched) flipDown(secondIdx);
  clearPending();
}

/** 手番を終わらせる。世代番号を進めて、古い予約を無効にする */
function clearPending() {
  firstIdx = secondIdx = -1;
  busy = false;
  lockUntil = 0;
  generation++;
}

function flipUp(idx) {
  const c = cards[idx];
  c.faceUp = true;
  c.el.classList.add('is-up');
  c.el.setAttribute('aria-label', c.label);
  flips++;
}

function flipDown(idx) {
  const c = cards[idx];
  c.faceUp = false;
  c.el.classList.remove('is-up');
  c.el.setAttribute('aria-label', 'Hidden card / ふせてあるカード');
}


// ================================================================
// 表示とクリア
// ================================================================

function updateHud() {
  $('memoryPairs').textContent = `🐾 ${matched} / ${DECK.length}`;
  $('memoryFlips').textContent = flips;
}

/**
 * 全部そろったときの処理。
 * 薄くなっていたカードを元の濃さに戻し、しばらく盤面を見せてから結果へ。
 * すぐ結果画面に飛ばすと、そろえた盤面を眺める間がない。
 */
function finish() {
  const gen = generation;
  document.getElementById('memoryBoard').classList.add('is-clear');
  setTimeout(() => {
    if (gen !== generation) return;
    $('resultDetail').textContent = `${flips} flips / ${flips}かい めくりました`;
    showScreen('result');
  }, CLEAR_HOLD_MS);
}


// ================================================================
// ボタン
// ================================================================

$('btn-start').addEventListener('click', startGame);
$('btn-retry').addEventListener('click', () => {
  document.getElementById('memoryBoard').classList.remove('is-clear');
  startGame();
});
$('btn-top').addEventListener('click', () => {
  generation++;   // 進行中の予約をすべて無効にしてから戻る
  document.getElementById('memoryBoard').classList.remove('is-clear');
  showScreen('top');
});

showScreen('top');
