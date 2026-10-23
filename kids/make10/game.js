// ================================================================
// game.js – MAKE10 ゲームロジック
// ================================================================


// ── 設定定数 ────────────────────────────────────────────────────
// App Store への導線は持たない。
// /kids/ 配下はこども向け領域として外部リンクを一切置かない方針のため、
// 以前あった APP_STORE_URL 定数とボタンへの href 設定を削除した。
/*
 * ── ゲームモード ────────────────────────────────────────────────
 * iOS アプリ（FDL-TenBlitz）と同じ2モードを用意する。
 *   normal … 30秒。じっくり解く定番
 *   blitz  … 10秒。短期決戦
 *
 * アプリでは「30秒で100問正解すると Blitz が解放」という仕組みだが、
 * ここでは最初から両方選べるようにしている。
 * アプリは繰り返し遊ぶ前提だが、Web は一度きりの訪問が多い。
 * 遊べるものを隠すと、解放されないまま終わってしまう。
 *
 * ハイスコアはモードごとに分けて保存する。
 * normal のキーを make10_hi のままにしているのは、
 * このモードしか無かった頃の記録を引き継ぐため。
 */
const MODES = {
  normal: { time: 30, warn: 6, hiKey: 'make10_hi',       tagline: '30-SECOND CHALLENGE', label: '⏱️ 30 SEC'       },
  blitz:  { time: 10, warn: 3, hiKey: 'make10_hi_blitz', tagline: '10-SECOND BLITZ',    label: '⚡ 10 SEC BLITZ' },
};

/** 現在のモード名（'normal' | 'blitz'）。リトライ時も同じモードを保つ */
let mode = 'normal';

/** 現在のモードの設定を返す短縮形 */
const conf = () => MODES[mode];

const WRONG_PENALTY   = 1;    // 不正解ペナルティ（秒）
const TILE_COUNT      = 4;    // 選択肢タイル数
const COMBO_THRESHOLD = 5;    // タイムボーナス発動コンボ数
const COMBO_EMOJIS    = ['🔥','⚡','💥','🌟','✨','🎯','💫','🚀','🎉','👏'];

/*
 * 1フレームで減らせる時間の上限（秒）。
 *
 * requestAnimationFrame は、タブが非表示になると呼ばれなくなる。
 * そして表示に戻った最初のフレームには、離れていた時間をまるごと含んだ
 * timestamp が渡ってくる。上限を設けないと、その差分がそのまま
 * 残り時間から引かれ、30秒離れて戻った瞬間にゲームオーバーになる。
 *
 * 0.1秒は、60fps（約0.017秒）に対して十分な余裕がありつつ、
 * 数フレーム落ちた程度なら正しく追従できる値。
 */
const MAX_DELTA = 0.1;


// ── ハイスコアの保存・読み込み ───────────────────────────────────
/*
 * 変更: localStorage への読み書きを、この2つの関数に集約しました。
 *
 * 【なぜ直接呼んではいけないのか】
 * 以前はこう書いていました。
 *
 *   let highScore = parseInt(localStorage.getItem('make10_hi') || '0', 10);
 *
 * 一見すると問題なさそうですが、これはファイルの先頭近く、
 * つまり「トップレベル」で実行されます。
 * そして環境によっては、localStorage に触れた瞬間に例外が投げられます。
 *   ・Cookie を完全にブロックする設定のブラウザ
 *   ・サードパーティ Cookie が禁止された iframe の中
 *   ・アプリ内ブラウザ（WebView）の一部
 *
 * トップレベルで例外が起きると、そこから下のコードは
 * 「一行も実行されません」。関数の定義すら行われないため、
 * ボタンを押しても何も起こらず、画面は真っ白なまま止まります。
 * ハイスコアという“おまけ”の機能のために、ゲーム全体が死にます。
 *
 * try/catch で包めば、例外はその場で受け止められ、
 * 後続の処理はそのまま続きます。
 * 失敗したときは 0 を返し、ハイスコアなしの状態で普通に遊べます。
 * これを「グレースフルデグラデーション（優雅な劣化）」と呼びます。
 * 壊れて止まるのではなく、機能を減らして動き続ける設計です。
 */

/**
 * 保存されているハイスコアを読み込む。読めない環境では 0 を返す。
 * @returns {number}
 */
function loadHighScore(key) {
  try {
    /*
     * 変更: parseInt の結果をそのまま返していたが、保存値が数値でない場合に
     * NaN が返っていた。NaN は比較が常に false になるため
     * （score > NaN は必ず false）、endGame の新記録判定が通らなくなり、
     * 一度壊れると二度とハイスコアを更新できない状態に陥る。
     * しかも表示は空のままなので、プレイヤーは不具合に気づけない。
     * 数値として妥当なときだけ採用する。
     */
    const n = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch (e) {
    return 0;  // 読めない環境ではハイスコアなしとして扱う
  }
}

/**
 * ハイスコアを保存する。保存できない環境では何もせず、そのまま続行する。
 *
 * 読み込みと分けて try/catch を書いている理由：
 * Safari のプライベートブラウズなど、「読めるが書けない」環境があります。
 * 保存容量が 0 に設定されているため、setItem だけが例外を投げます。
 * 読み込み側だけ対策しても、ゲーム終了時にここで落ちてしまい、
 * リザルト画面が表示されないゲームになります。
 *
 * @param {number} value - 保存するスコア
 */
function saveHighScore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* 保存できなくても続行する（記録は今回のセッション限りになる） */
  }
}


// ── ゲーム状態変数 ───────────────────────────────────────────────
let score         = 0;        // 現在のスコア（正解数）
let combo         = 0;        // 現在の連続正解数
let maxCombo      = 0;        // このセッションの最大コンボ数
let highScore     = 0;        // 現在のモードのハイスコア（ゲーム開始時に読み込む）
let isNewRecord   = false;    // 今回のゲームで新記録を出したか
let timeLeft      = MODES.normal.time;
let currentNum    = 0;        // 現在の問題の数字
let nextNum       = 0;        // 次の問題の数字（プレビュー表示用）
let correctAnswer = 0;        // 現在の正解（= 10 - currentNum）
let rafId         = null;     // requestAnimationFrame の ID（キャンセル用）
let nextStepTimer = null;     // タップ後の遅延処理の ID（ゲーム終了時に取り消す）
let gaugeIsWarn   = null;     // 直前のゲージ警告状態（色の書き換えを減らすため）
let gaugeLastSec  = null;     // 直前に通知した残り秒数（aria の更新を減らすため）
let isPlaying     = false;    // ゲーム進行中フラグ
let isTapping     = false;    // 連打防止フラグ（タップ処理中は true）
let lastTimestamp = 0;        // 前フレームのタイムスタンプ（delta 計算用）


// ── DOM ユーティリティ ───────────────────────────────────────────
/** document.getElementById の短縮エイリアス */
const $ = id => document.getElementById(id);

/** 画面要素をまとめたオブジェクト。showScreen() で active クラスを付け外しする */
const screens = {
  top:    $('screen-top'),
  game:   $('screen-game'),
  result: $('screen-result'),
};


// ================================================================
// 画面管理
// ================================================================

/**
 * 指定した画面のみを表示し、他の画面を非表示にする。
 * トップ画面に戻る場合はハイスコア表示も更新する。
 */
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('active', key === name);
  }
  if (name === 'top') updateTitleHi();
}

/**
 * トップ画面のハイスコア表示を更新する。
 * 記録のあるモードだけを並べて表示する。両方 0 のときは空にする
 * （min-height で高さは確保済み）。
 *
 * モードごとに分けて出すのは、10秒と30秒のスコアを並べて比べても
 * 意味がないため。どちらで出した記録かが分かる必要がある。
 */
function updateTitleHi() {
  const el = $('titleHi');
  if (!el) return;
  const n = loadHighScore(MODES.normal.hiKey);
  const b = loadHighScore(MODES.blitz.hiKey);
  const parts = [];
  if (n > 0) parts.push(`⏱️ 30s: ${n}`);
  if (b > 0) parts.push(`⚡ 10s: ${b}`);
  el.textContent = parts.length ? `🏆 ${parts.join('\u3000')}` : '';
}


// ================================================================
// ゲームロジック
// ================================================================

/**
 * 全状態をリセットして新しいゲームを開始する。
 * スコア・コンボ・残り時間を初期値に戻し、問題を生成してタイマーを起動する。
 */
function startGame(name) {
  // 引数が無いときは今のモードを維持する（リザルト画面の「もう一度」用）
  if (name && MODES[name]) mode = name;

  // このモードのハイスコアを読み込む。モードごとに別のキーで保存している
  highScore = loadHighScore(conf().hiKey);

  // Blitz のときだけ配色を変えるためのフラグ。CSS 側が body.mode-blitz を見る
  document.body.classList.toggle('mode-blitz', mode === 'blitz');

  // ゲージの最大値をモードに合わせる（支援技術に正しい残り時間を伝えるため）
  const gw = $('gaugeWrapper');
  if (gw) gw.setAttribute('aria-valuemax', conf().time);

  // ヘッダーの副題もモードに合わせる。
  // 10秒で遊んでいるのに「30-SECOND CHALLENGE」と出ていては食い違う。
  const tag = $('siteTagline');
  if (tag) tag.textContent = conf().tagline;

  score     = 0;
  combo     = 0;
  maxCombo  = 0;
  timeLeft  = conf().time;
  isPlaying = true;
  isTapping = false;

  // 前回のゲームの遅延処理が残っていれば取り消す。
  // 残したままだと、新しいゲームの最中に発火して問題が差し替わる。
  if (nextStepTimer) { clearTimeout(nextStepTimer); nextStepTimer = null; }

  // ゲージの記憶をリセットし、色と aria を確実に初期状態から書き直させる
  gaugeIsWarn  = null;
  gaugeLastSec = null;

  $('scoreValue').textContent   = '0';
  $('comboDisplay').textContent = '';
  updateGauge();
  showScreen('game');

  currentNum = randomNum(1, 9);
  // 次の問題が現在と同じ数字にならないよう除外して生成する
  nextNum = randomNumExcluding(1, 9, currentNum);
  generateQuestion();
  startTimer();
}

/** min〜max の整数乱数を返す（両端含む） */
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** exclude と同じ値が出ないようリトライしながら乱数を返す */
function randomNumExcluding(min, max, exclude) {
  let n;
  do { n = randomNum(min, max); } while (n === exclude);
  return n;
}

/**
 * 現在の問題を UI に反映する。
 * 正解・選択肢の生成・タイル描画・アニメーションを一括で行う。
 */
function generateQuestion() {
  correctAnswer = 10 - currentNum;

  // 問題数字のアニメーションを再トリガーする
  const qNum = $('questionNumber');
  qNum.textContent = currentNum;
  qNum.classList.remove('animate-in');
  void qNum.offsetWidth; // リフローを強制して CSS アニメーションをリセット・再発火させる
  qNum.classList.add('animate-in');

  $('questionPlus').textContent = currentNum;
  $('nextNumber').textContent   = nextNum;

  // 正解 1 つ＋ランダムなダミーで TILE_COUNT 枚の選択肢を作る
  const answers = [correctAnswer];
  while (answers.length < TILE_COUNT) {
    const d = randomNum(1, 9);
    if (!answers.includes(d)) answers.push(d);
  }
  shuffle(answers); // 正解が常に同じ位置に出ないようシャッフルする

  // タイルを DOM に追加する。出現アニメーションの delay をずらして波状に表示する
  const grid = $('tilesGrid');
  grid.innerHTML = '';
  /*
   * 変更: div + role="button" から、本物の <button> 要素にした。
   *
   * 以前は role="button" だけが付いていて tabindex が無く、
   * キーボードで focus できなかった。keydown も拾っていないため
   * Enter / Space でも反応しない。ゲーム画面には他に focus できる要素が
   * 無いので、キーボードだけの利用者はこのゲームを一切遊べなかった。
   * 支援技術には「ボタン」と案内されるのに押せない、という状態だった。
   *
   * <button> にすれば、focus も Enter / Space も標準で付いてくる。
   * role と aria-label も不要になる（要素の意味と中の数字で伝わる）。
   * 自前で tabindex と keydown を足すより、壊れにくい。
   */
  answers.forEach((val, i) => {
    const tile = document.createElement('button');
    tile.type = 'button';   // フォーム内に置かれても submit しないようにする
    tile.className = 'tile appear';
    tile.style.animationDelay = `${i * 0.05}s`;
    tile.textContent = val;
    tile.addEventListener('click', () => handleTap(val, tile));
    grid.appendChild(tile);
  });
}

/**
 * タイルがタップされたときの処理。
 * 正解なら得点・コンボ・ボーナス時間を処理し、不正解ならペナルティ時間を差し引く。
 * isTapping フラグで連打を防止する（pointerEvents 操作は使わない）。
 */
function handleTap(value, tileEl) {
  if (!isPlaying || isTapping) return;
  isTapping = true;

  if (value === correctAnswer) {
    // ── 正解 ──────────────────────────────────────────
    score++;
    combo++;
    if (combo > maxCombo) maxCombo = combo;

    $('scoreValue').textContent = score;
    tileEl.classList.add('correct');
    showFeedback('⭕');
    playSound('correct');
    // [FIX] navigator.vibrate は Safari 非対応のため存在チェックを行う
    if (navigator.vibrate) navigator.vibrate(60);
    updateComboDisplay();

    // COMBO_THRESHOLD 以上の連続正解でタイムボーナスを付与する。
    // 残り時間が少ないほど多く、多いほど少なく設定してバランスをとる。
    if (combo >= COMBO_THRESHOLD) {
      let bonus;
      if      (timeLeft <= 5)  bonus = 1.2;
      else if (timeLeft >= 20) bonus = 0.8;
      else                     bonus = 1.0;
      timeLeft = Math.min(conf().time, timeLeft + bonus);
      updateGauge();
      spawnComboEmoji();
    }

    // 正解アニメーションを見せてから次の問題を表示し、タップロックを解除する。
    // ID を保持しておき、途中でゲームが終わった場合は endGame 側で取り消す。
    nextStepTimer = setTimeout(() => {
      nextStepTimer = null;
      currentNum = nextNum;
      nextNum = randomNumExcluding(1, 9, currentNum);
      generateQuestion();
      isTapping = false;
    }, 250);

  } else {
    // ── 不正解 ────────────────────────────────────────
    combo = 0;
    updateComboDisplay();
    tileEl.classList.add('wrong');
    showFeedback('❌');
    playSound('wrong');
    // [FIX] navigator.vibrate は Safari 非対応のため存在チェックを行う
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);

    timeLeft = Math.max(0, timeLeft - WRONG_PENALTY);
    updateGauge();
    if (timeLeft <= 0) { endGame(); return; }

    // 誤答アニメーションが落ち着いてからタップロックを解除する
    nextStepTimer = setTimeout(() => {
      nextStepTimer = null;
      isTapping = false;
    }, 300);
  }
}

/**
 * 正解・不正解のフィードバック絵文字を問題エリア中央に表示する。
 * アニメーション終了後に DOM 要素を削除してメモリリークを防ぐ。
 */
function showFeedback(emoji) {
  const fb = document.createElement('div');
  fb.className   = 'feedback';
  fb.textContent = emoji;
  $('questionArea').appendChild(fb);
  setTimeout(() => fb.remove(), 500);
}

/**
 * コンボ数を UI に反映する。
 * 2 コンボ以上で表示、1 以下で非表示にする。
 * void offsetWidth でアニメーションを毎回リセット・再発火させる。
 */
function updateComboDisplay() {
  const el = $('comboDisplay');
  if (combo >= 2) {
    el.textContent = `🔥 ${combo} COMBO`;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  } else {
    el.textContent = '';
  }
}

/**
 * コンボボーナス達成時に画面上のランダムな位置へ絵文字を浮遊させる。
 * アニメーション終了後に DOM 要素を削除する。
 */
function spawnComboEmoji() {
  const emoji    = COMBO_EMOJIS[Math.floor(Math.random() * COMBO_EMOJIS.length)];
  const el       = document.createElement('div');
  el.className   = 'combo-emoji';
  el.textContent = emoji;
  el.style.left  = `${randomNum(20, 80)}%`;
  el.style.top   = `${randomNum(40, 70)}%`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}


// ================================================================
// タイマー
// ================================================================

/**
 * requestAnimationFrame ベースのタイマーを開始する。
 * setInterval より正確で、バックグラウンドタブでの暴走も防げる。
 */
function startTimer() {
  lastTimestamp = performance.now();
  rafId = requestAnimationFrame(timerTick);
}

/**
 * タイマーの毎フレーム処理。
 * 前フレームとの差分（delta 秒）を timeLeft から引いて経過時間を正確に計測する。
 */
function timerTick(timestamp) {
  if (!isPlaying) return;

  // 変更: 差分に上限を設けた。
  // 非表示だったタブに戻ると、離れていた時間がまるごと差分として渡ってくる。
  // 上限が無いと、35秒離れて戻った瞬間に残り0秒・スコア0でゲームオーバーになる。
  const delta   = Math.min((timestamp - lastTimestamp) / 1000, MAX_DELTA);
  lastTimestamp = timestamp;
  timeLeft      = Math.max(0, timeLeft - delta);
  updateGauge();

  if (timeLeft <= 0) { endGame(); return; }

  rafId = requestAnimationFrame(timerTick);
}

/**
 * 残り時間をゲージバーの幅（%）と色に反映する。
 * 残り 8 秒以下になると --gauge-warn 色に遷移する。
 */
function updateGauge() {
  const bar = $('gaugeBar');

  /*
   * 変更: width の書き換えから transform: scaleX() に変えた。
   *
   * width を変えるとブラウザはレイアウトを計算し直す。
   * この関数は requestAnimationFrame から毎フレーム（約60回/秒）呼ばれるため、
   * そのたびにレイアウトが走っていた。
   * transform は合成だけで済むので、レイアウトを発生させない。
   *
   * あわせて CSS 側の transition も外した。
   * 16msごとに値が変わるのに 0.08秒の遷移を掛けていたため、
   * 遷移が終わる前に次の値が来て、滑らかにするつもりが引っかかっていた。
   * 毎フレーム更新しているのだから、遷移は不要である。
   *
   * なお 404 ページの進捗バーは元から scaleX を使っている。
   * サイト内で実装を揃えた形になる。
   */
  bar.style.transform = `scaleX(${Math.max(0, timeLeft / conf().time)})`;

  /*
   * 色と aria は「変わったときだけ」書き換える。
   * 毎フレーム同じ値を代入しても結果は同じだが、無駄な処理になる。
   * aria-valuenow は毎フレーム書き換えると支援技術に過剰な通知が飛ぶ。
   */
  const warn = timeLeft <= conf().warn;
  if (warn !== gaugeIsWarn) {
    gaugeIsWarn = warn;
    bar.style.backgroundColor = warn ? 'var(--gauge-warn)' : 'var(--gauge-full)';
  }

  const sec = Math.round(timeLeft);
  if (sec !== gaugeLastSec) {
    gaugeLastSec = sec;
    const wrapper = $('gaugeWrapper');
    if (wrapper) wrapper.setAttribute('aria-valuenow', sec);
  }
}


// ================================================================
// ゲーム終了処理
// ================================================================

/**
 * ゲーム終了処理。
 * タイマーを止め、ハイスコアを更新し、300ms 後にリザルト画面を表示する。
 */
function endGame() {
  isPlaying = false;
  isTapping = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

  // 変更: タップ後の遅延処理が残っていると、ゲーム終了後に発火して
  // generateQuestion() が走り、見えていない画面を書き換えてしまう。取り消す。
  if (nextStepTimer) { clearTimeout(nextStepTimer); nextStepTimer = null; }

  // 新記録の場合のみ localStorage に保存する
  isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    saveHighScore(conf().hiKey, highScore);  // モードごとに別のキーへ保存する
  }

  // わずかな間を置いてリザルト画面に切り替え、遷移を自然に見せる
  setTimeout(() => {
    showScreen('result');
    $('resultScore').textContent   = score;
    $('resultMessage').textContent = getResultMessage(score);
    $('resultCombo').textContent   = maxCombo >= 2 ? `MAX COMBO: ${maxCombo} 🔥` : '';

    // どちらのモードの結果かを示す。10秒と30秒のスコアは比べられないため
    const modeEl = $('resultMode');
    if (modeEl) modeEl.textContent = conf().label;

    // 新記録時は緑色でアニメーション付きのスタイルを適用する
    const hiEl = $('resultHi');
    if (isNewRecord) {
      hiEl.textContent = '🏆 New Record!';
      hiEl.className   = 'result-hi new-record';
    } else {
      hiEl.textContent = `BEST: ${highScore}`;
      hiEl.className   = 'result-hi';
    }

  }, 300);
}

/**
 * スコアに応じた日英メッセージを返す。
 * スコアが高いほど大げさな表現でプレイヤーを称える。
 */
function getResultMessage(s) {
  if (s >= 100) return '神！ / Godlike!';
  if (s >= 50)  return '伝説！ / Legendary!';
  if (s >= 20)  return '天才！ / Genius!';
  if (s >= 10)  return 'すごすぎ！ / Amazing!';
  if (s >= 5)   return 'すごい！ / Great!';
  if (s >= 3)   return 'いいね！ / Nice!';
  if (s >= 1)   return "次はいける！ / You'll get it!";
  return 'もう一回！ / Try again!';
}


// ================================================================
// ユーティリティ
// ================================================================

/**
 * Fisher-Yates アルゴリズムで配列をインプレースでシャッフルする。
 * 数学的に均等な分布が保証されるシャッフル手法。
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// ================================================================
// 効果音
// ================================================================

/**
 * Web Audio API で効果音を再生する。
 * AudioContext はひとつだけ生成して使い回す（毎回生成するとブラウザに制限される）。
 * suspended 状態のときは resume() の完了を待ってから音を鳴らす。
 * エラーが起きても catch してゲームを止めない。
 */
let audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();

    const run = () => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'correct') {
        // 高めの明るいサイン波（ド・523Hz）を短く鳴らす
        osc.frequency.value = 523;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'wrong') {
        // 低めの矩形波を音程を下げながら鳴らしてブザー感を出す
        osc.frequency.value = 200;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.frequency.setTargetAtTime(100, audioCtx.currentTime, 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    };

    // コンテキストが停止中なら resume() を待ってから実行する
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(run);
    } else {
      run();
    }

  } catch (e) {
    console.warn('playSound error:', e);
  }
}


// ================================================================
// ボタンイベントのバインド
// ================================================================

/*
 * 変更: addEventListener('click', startGame) と書くと、
 * クリックイベントのオブジェクトが第1引数として渡ってしまう。
 * startGame がモード名を受け取るようになったので、明示的に呼び分ける。
 */

/** 30秒モードで開始 */
$('btn-start').addEventListener('click', () => startGame('normal'));

/** 10秒（Blitz）モードで開始 */
$('btn-blitz').addEventListener('click', () => startGame('blitz'));

/** もう一度ボタン：同じモードのまま再開する（引数なしで現在のモードを維持） */
$('btn-retry').addEventListener('click', () => startGame());

/** タイトルへ戻るボタン：タイマーを止めてトップ画面を表示 */
$('btn-top').addEventListener('click', () => {
  isPlaying = false;
  document.body.classList.remove('mode-blitz');  // タイトルへ戻るので配色を戻す
  const tag = $('siteTagline');
  if (tag) tag.textContent = MODES.normal.tagline;  // 副題も既定に戻す
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (nextStepTimer) { clearTimeout(nextStepTimer); nextStepTimer = null; }
  showScreen('top');
});


// ================================================================
// タブの表示・非表示への対応
// ================================================================

/*
 * タブが表示に戻ったとき、基準時刻を今に引き直す。
 *
 * timerTick の delta には MAX_DELTA で上限を掛けてあるので、
 * これが無くてもゲームオーバーにはならない。
 * ただし上限ぶん（0.1秒）は引かれてしまうため、ここで基準を合わせ直して
 * 「離れていた時間は一切減らない」状態にしている。
 *
 * 上限と合わせて二重の守りにしているのは、役割が違うからである。
 *   MAX_DELTA         … 原因を問わず、1フレームの減りを抑える安全弁
 *   visibilitychange  … 離席という既知の原因に対する、意図の明示
 */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isPlaying) {
    lastTimestamp = performance.now();
  }
});


// ================================================================
// 初期化
// ================================================================

// ページ読み込み時にタイトル画面のハイスコアを即座に反映する
updateTitleHi();


// 最初はトップ画面を表示する（HTML 側でも active が付いているが明示的に呼ぶ）
showScreen('top');
