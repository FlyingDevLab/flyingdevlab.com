// ================================================================
// game.js – MAKE10 ゲームロジック
// ================================================================


// ── 設定定数 ────────────────────────────────────────────────────
const APP_STORE_URL   = 'https://apps.apple.com/app/id0000000000'; // App Store URL（確定後に更新）
const TOTAL_TIME      = 30;   // 制限時間（秒）
const WRONG_PENALTY   = 1;    // 不正解ペナルティ（秒）
const TILE_COUNT      = 4;    // 選択肢タイル数
const COMBO_THRESHOLD = 5;    // タイムボーナス発動コンボ数
const COMBO_EMOJIS    = ['🔥','⚡','💥','🌟','✨','🎯','💫','🚀','🎉','👏'];
const HOME_URL        = 'https://flyingdevlab.com/';


// ── ゲーム状態変数 ───────────────────────────────────────────────
let score         = 0;        // 現在のスコア（正解数）
let combo         = 0;        // 現在の連続正解数
let maxCombo      = 0;        // このセッションの最大コンボ数
let highScore     = parseInt(localStorage.getItem('make10_hi') || '0', 10);
let isNewRecord   = false;    // 今回のゲームで新記録を出したか
let timeLeft      = TOTAL_TIME;
let currentNum    = 0;        // 現在の問題の数字
let nextNum       = 0;        // 次の問題の数字（プレビュー表示用）
let correctAnswer = 0;        // 現在の正解（= 10 - currentNum）
let timerInterval = null;     // requestAnimationFrame の戻り値（キャンセル用）
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
 * ハイスコアが 0 のときは空にする（min-height で高さは確保済み）。
 */
function updateTitleHi() {
  const el = $('titleHi');
  if (!el) return;
  el.textContent = highScore > 0 ? `🏆 BEST: ${highScore}` : '';
}


// ================================================================
// ゲームロジック
// ================================================================

/**
 * 全状態をリセットして新しいゲームを開始する。
 * スコア・コンボ・残り時間を初期値に戻し、問題を生成してタイマーを起動する。
 */
function startGame() {
  score     = 0;
  combo     = 0;
  maxCombo  = 0;
  timeLeft  = TOTAL_TIME;
  isPlaying = true;
  isTapping = false;

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
  answers.forEach((val, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile appear';
    tile.style.animationDelay = `${i * 0.05}s`;
    tile.textContent = val;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `${val}`);
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
      timeLeft = Math.min(TOTAL_TIME, timeLeft + bonus);
      updateGauge();
      spawnComboEmoji();
    }

    // 正解アニメーションを見せてから次の問題を表示し、タップロックを解除する
    setTimeout(() => {
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
    setTimeout(() => {
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
  timerInterval = requestAnimationFrame(timerTick);
}

/**
 * タイマーの毎フレーム処理。
 * 前フレームとの差分（delta 秒）を timeLeft から引いて経過時間を正確に計測する。
 */
function timerTick(timestamp) {
  if (!isPlaying) return;

  const delta   = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  timeLeft      = Math.max(0, timeLeft - delta);
  updateGauge();

  if (timeLeft <= 0) { endGame(); return; }

  timerInterval = requestAnimationFrame(timerTick);
}

/**
 * 残り時間をゲージバーの幅（%）と色に反映する。
 * 残り 8 秒以下になると --gauge-warn 色に遷移する。
 */
function updateGauge() {
  const bar = $('gaugeBar');
  const pct = (timeLeft / TOTAL_TIME) * 100;
  bar.style.width           = `${pct}%`;
  bar.style.backgroundColor = timeLeft <= 8 ? 'var(--gauge-warn)' : 'var(--gauge-full)';

  // aria-valuenow を更新してスクリーンリーダーに残り時間を通知する
  const wrapper = $('gaugeWrapper');
  if (wrapper) wrapper.setAttribute('aria-valuenow', Math.round(timeLeft));
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
  if (timerInterval) cancelAnimationFrame(timerInterval);

  // 新記録の場合のみ localStorage に保存する
  isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    localStorage.setItem('make10_hi', highScore);
  }

  // わずかな間を置いてリザルト画面に切り替え、遷移を自然に見せる
  setTimeout(() => {
    showScreen('result');
    $('resultScore').textContent   = score;
    $('resultMessage').textContent = getResultMessage(score);
    $('resultCombo').textContent   = maxCombo >= 2 ? `MAX COMBO: ${maxCombo} 🔥` : '';

    // 新記録時は緑色でアニメーション付きのスタイルを適用する
    const hiEl = $('resultHi');
    if (isNewRecord) {
      hiEl.textContent = '🏆 New Record!';
      hiEl.className   = 'result-hi new-record';
    } else {
      hiEl.textContent = `BEST: ${highScore}`;
      hiEl.className   = 'result-hi';
    }

    const appStoreBtn = $('appStoreBtn');
    if (appStoreBtn) appStoreBtn.href = APP_STORE_URL;
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
// ナビゲーション
// ================================================================

/**
 * タイマーを止めて Flying Dev Lab のサイトへ移動する。
 * ゲーム中に呼ばれた場合でもタイマーを確実にキャンセルする。
 */
function goHome() {
  isPlaying = false;
  if (timerInterval) cancelAnimationFrame(timerInterval);
  window.location.href = HOME_URL;
}


// ================================================================
// ボタンイベントのバインド
// ================================================================

/** スタートボタン：ゲームを最初から開始してゲーム画面へ遷移 */
document.getElementById('btn-start').addEventListener('click', startGame);

/** もう一度ボタン：スコアをリセットしてゲームを再開 */
document.getElementById('btn-retry').addEventListener('click', startGame);

/** タイトルへ戻るボタン：タイマーを止めてトップ画面を表示 */
document.getElementById('btn-top').addEventListener('click', () => {
  isPlaying = false;
  if (timerInterval) cancelAnimationFrame(timerInterval);
  showScreen('top');
});

/** ホームボタン（ゲーム画面左上）：Flying Dev Lab へ移動 */
document.getElementById('btn-home').addEventListener('click', goHome);


// ================================================================
// 初期化
// ================================================================

// ページ読み込み時にタイトル画面のハイスコアを即座に反映する
updateTitleHi();

// App Store ボタンがある場合は href を設定しておく
const appStoreBtnInit = document.getElementById('appStoreBtn');
if (appStoreBtnInit) appStoreBtnInit.href = APP_STORE_URL;

// 最初はトップ画面を表示する（HTML 側でも active が付いているが明示的に呼ぶ）
showScreen('top');
