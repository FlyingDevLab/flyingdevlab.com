/**
 * game.js - モグラ叩きゲームロジック
 * Whack-a-Mole Game Logic
 *
 * 構成 / Structure:
 *  1. 定数・設定値
 *  2. 状態管理変数
 *  3. DOM要素の取得
 *  4. 初期化処理
 *  5. 画面切り替え
 *  6. グリッド生成
 *  7. ゲーム開始・終了
 *  8. タイマー処理
 *  9. モグラ出現・消滅ロジック
 * 10. スコア処理
 * 11. ハイスコア管理
 * 12. ポップアップ演出
 * 13. ユーティリティ
 */

'use strict';

/* ========================================
   1. 定数・設定値 / Constants & Config
======================================== */

/** localStorageに使用するキー名 / Key name used in localStorage */
const HIGHSCORE_KEY = 'flyingdevlab_mogura_highscore';

/** ゲームの制限時間（秒） / Game time limit in seconds */
const GAME_DURATION = 30;

/** グリッドの穴の数（3×3） / Number of holes in the 3x3 grid */
const HOLE_COUNT = 9;

/** モグラが穴に出ている時間の設定（ミリ秒） / Time moles stay up (ms) */
const MOLE_UP_MIN = 1000;   // 最短滞在時間 / Minimum time up
const MOLE_UP_MAX = 2000;   // 最長滞在時間 / Maximum time up

/** モグラのスポーン間隔（ミリ秒） / Interval between mole spawns (ms) */
const SPAWN_INTERVAL_MIN = 400;
const SPAWN_INTERVAL_MAX = 900;

/** 同時に出現できるモグラの最大数 / Max moles visible at the same time */
const MAX_SIMULTANEOUS_MOLES = 3;

/** 残り時間の警告しきい値（秒） / Timer warning threshold in seconds */
const TIMER_WARNING_THRESHOLD = 10;

/* ========================================
   2. 状態管理変数 / State Variables
======================================== */

/** 現在のスコア / Current score */
let score = 0;

/** 残り時間（秒） / Time remaining in seconds */
let timeLeft = GAME_DURATION;

/** ゲームが進行中かどうか / Whether game is currently running */
let isPlaying = false;

/** タイムカウントダウン用のインターバルID / Interval ID for countdown timer */
let countdownInterval = null;

/** モグラスポーン用のタイムアウトID / Timeout ID for mole spawning */
let spawnTimeout = null;

/** 各穴にいるモグラのタイムアウトIDを管理する配列
 *  Index = 穴のインデックス, 値 = タイムアウトID or null
 *  Array managing timeout IDs for moles in each hole */
let moleTimers = new Array(HOLE_COUNT).fill(null);

/** 現在モグラが出ている穴のインデックスセット
 *  Set of hole indices where moles are currently visible */
let activeMoles = new Set();

/* ========================================
   3. DOM要素の取得 / DOM Element References
======================================== */

/** 各画面要素 / Screen elements */
const screenTop    = document.getElementById('screen-top');
const screenGame   = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');

/** スコア・タイマー表示要素 / Score & timer display elements */
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer-display');

/** ハイスコア表示要素（トップ・リザルト） / High score display elements */
const topHighscore    = document.getElementById('top-highscore');
const resultScore     = document.getElementById('result-score');
const resultHighscore = document.getElementById('result-highscore');

/** 新記録演出エリア / New record area element */
const newRecordArea = document.getElementById('new-record-area');

/** モグラグリッドコンテナ / Mole grid container */
const moleGrid = document.getElementById('mole-grid');

/** ポップアップコンテナ / Popup container */
const popupContainer = document.getElementById('popup-container');

/* ========================================
   4. 初期化処理 / Initialization
======================================== */

/**
 * ページ読み込み時の初期化
 * Runs on page load to initialize the game
 */
function init() {
  // フッターの年を設定 / Set footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // グリッドを生成 / Build the mole grid
  buildGrid();

  // ハイスコアを読み込んでトップ画面に反映 / Load and display high score
  topHighscore.textContent = loadHighScore();

  // トップ画面を表示 / Show top screen
  showScreen('top');
}

/* ========================================
   5. 画面切り替え / Screen Switching
======================================== */

/**
 * 指定した画面のみを表示し、他を非表示にする
 * Show only the specified screen, hide others
 * @param {'top'|'game'|'result'} screenName - 表示する画面名 / Screen to show
 */
function showScreen(screenName) {
  const screens = [
    { el: screenTop,    name: 'top' },
    { el: screenGame,   name: 'game' },
    { el: screenResult, name: 'result' },
  ];

  screens.forEach(({ el, name }) => {
    if (name === screenName) {
      el.classList.add('active');
      el.removeAttribute('aria-hidden');
    } else {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * トップ画面へ戻る処理（ボタン押下時）
 * Go back to top screen (called on button press)
 */
function goToTop() {
  // ゲームが進行中なら停止してから戻る / Stop game if running
  if (isPlaying) stopGame();

  // ハイスコアを更新してトップ画面を表示 / Update high score display
  topHighscore.textContent = loadHighScore();
  showScreen('top');
}

/* ========================================
   6. グリッド生成 / Grid Builder
======================================== */

/**
 * 3×3 のモグラ穴グリッドをDOMに生成する
 * Build the 3x3 mole hole grid in the DOM
 */
function buildGrid() {
  moleGrid.innerHTML = '';

  for (let i = 0; i < HOLE_COUNT; i++) {
    // 穴のコンテナ要素 / Hole container
    const hole = document.createElement('div');
    hole.classList.add('hole');
    hole.setAttribute('role', 'gridcell');
    hole.setAttribute('aria-label', `穴 ${i + 1} / Hole ${i + 1}`);
    hole.dataset.index = i;

    // モグラのクリッピングコンテナ（overflow:hidden でモグラを穴の中に隠す）
    // Clipping container – overflow:hidden keeps mole hidden inside the hole
    const clip = document.createElement('div');
    clip.classList.add('hole-clip');

    // モグラ要素 / Mole element
    const mole = document.createElement('div');
    mole.classList.add('mole');
    mole.setAttribute('role', 'button');
    mole.setAttribute('aria-label', `モグラ ${i + 1} / Mole ${i + 1}`);
    mole.setAttribute('tabindex', '0');
    mole.dataset.index = i;

    // モグラのボディパーツをCSSで構成 / Mole body parts via CSS
    mole.innerHTML = `
      <div class="mole-body" aria-hidden="true">
        <div class="mole-head">
          <div class="mole-nose"></div>
        </div>
        <div class="mole-torso"></div>
        <div class="mole-star">⭐</div>
      </div>
    `;

    // クリック・タップでモグラを叩く / Click/tap to whack the mole
    mole.addEventListener('click', onMoleClick);
    // キーボードアクセシビリティ / Keyboard accessibility (Enter/Space)
    mole.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onMoleClick.call(mole, e);
      }
    });

    clip.appendChild(mole);
    hole.appendChild(clip);
    moleGrid.appendChild(hole);
  }
}

/* ========================================
   7. ゲーム開始・終了 / Game Start & End
======================================== */

/**
 * ゲームを開始する
 * Start the game
 */
function startGame() {
  // 前回のゲーム状態をリセット / Reset previous game state
  resetState();

  // スコア・タイマー表示を初期化 / Initialize score and timer display
  updateScoreDisplay();
  updateTimerDisplay();

  // ゲーム画面へ切り替え / Switch to game screen
  showScreen('game');

  // カウントダウン開始 / Start countdown
  startCountdown();

  // モグラスポーン開始 / Start mole spawning
  scheduleNextSpawn();
}

/**
 * ゲーム状態を初期値にリセットする
 * Reset game state to initial values
 */
function resetState() {
  score = 0;
  timeLeft = GAME_DURATION;
  isPlaying = true;

  // 全モグラを非表示にする / Hide all moles
  hideAllMoles();

  // アクティブモグラセットをクリア / Clear active moles set
  activeMoles.clear();

  // 全モグラタイマーをクリア / Clear all mole timers
  moleTimers.fill(null);

  // タイマー要素の警告クラスを削除 / Remove warning class from timer
  timerDisplay.classList.remove('warning');

  // 新記録エリアを隠す / Hide new record area
  newRecordArea.hidden = true;
}

/**
 * ゲームを終了してリザルト画面へ遷移する
 * End the game and show the result screen
 */
function endGame() {
  isPlaying = false;

  // 全タイマーを停止 / Stop all timers
  clearInterval(countdownInterval);
  clearTimeout(spawnTimeout);
  clearAllMoleTimers();

  // 全モグラを隠す / Hide all moles
  hideAllMoles();

  // ハイスコアの更新を確認 / Check and update high score
  const isNewRecord = checkAndSaveHighScore(score);

  // リザルト画面の表示内容を更新 / Update result screen values
  resultScore.textContent = score;
  resultHighscore.textContent = loadHighScore();

  // 新記録なら演出を表示 / Show new record animation if applicable
  if (isNewRecord) {
    newRecordArea.hidden = false;
  }

  // リザルト画面へ切り替え / Switch to result screen
  showScreen('result');
}

/**
 * 現在進行中のゲームを強制停止する
 * Force-stop the currently running game
 */
function stopGame() {
  isPlaying = false;
  clearInterval(countdownInterval);
  clearTimeout(spawnTimeout);
  clearAllMoleTimers();
  hideAllMoles();
}

/* ========================================
   8. タイマー処理 / Timer Logic
======================================== */

/**
 * カウントダウンタイマーを開始する（1秒ごとに更新）
 * Start the 1-second countdown timer
 */
function startCountdown() {
  countdownInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    // 残り10秒以下で警告スタイルを適用 / Apply warning style when ≤10 seconds
    if (timeLeft <= TIMER_WARNING_THRESHOLD) {
      timerDisplay.classList.add('warning');
    }

    // 時間切れでゲーム終了 / End game when time runs out
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      endGame();
    }
  }, 1000);
}

/**
 * タイマー表示を更新する
 * Update the timer display element
 */
function updateTimerDisplay() {
  timerDisplay.textContent = timeLeft;
}

/* ========================================
   9. モグラ出現・消滅ロジック / Mole Spawn & Hide
======================================== */

/**
 * 次のモグラスポーンをランダムな間隔でスケジュールする
 * Schedule the next mole spawn at a random interval
 */
function scheduleNextSpawn() {
  if (!isPlaying) return;

  const delay = randInt(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX);
  spawnTimeout = setTimeout(() => {
    if (isPlaying) {
      trySpawnMole();
      scheduleNextSpawn(); // 再帰的に次のスポーンをスケジュール / Recursively schedule next
    }
  }, delay);
}

/**
 * ランダムな穴にモグラを出現させる（最大数チェックあり）
 * Try to spawn a mole in a random empty hole (respects max limit)
 */
function trySpawnMole() {
  // 最大同時出現数に達している場合はスキップ / Skip if max reached
  if (activeMoles.size >= MAX_SIMULTANEOUS_MOLES) return;

  // 空いている穴のインデックス一覧を取得 / Get list of empty hole indices
  const emptyHoles = [];
  for (let i = 0; i < HOLE_COUNT; i++) {
    if (!activeMoles.has(i)) emptyHoles.push(i);
  }

  if (emptyHoles.length === 0) return;

  // ランダムな空き穴を選ぶ / Pick a random empty hole
  const holeIndex = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
  showMole(holeIndex);
}

/**
 * 指定した穴からモグラを出現させる
 * Show mole in the specified hole
 * @param {number} holeIndex - 穴のインデックス / Hole index
 */
function showMole(holeIndex) {
  const mole = getMoleElement(holeIndex);
  if (!mole) return;

  activeMoles.add(holeIndex);
  mole.classList.add('visible');
  mole.classList.remove('hit');
  playSound("appear"); // もぐらが出現した時に音を出す

  // 一定時間後に自動で引っ込む / Auto-hide after random duration
  const upDuration = randInt(MOLE_UP_MIN, MOLE_UP_MAX);
  moleTimers[holeIndex] = setTimeout(() => {
    hideMole(holeIndex);
  }, upDuration);
}

/**
 * 指定した穴のモグラを引っ込める
 * Hide the mole in the specified hole
 * @param {number} holeIndex - 穴のインデックス / Hole index
 */
function hideMole(holeIndex) {
  const mole = getMoleElement(holeIndex);
  if (!mole) return;

  if (mole.classList.contains('visible') && isPlaying) {
    playSound("miss"); // 
    }

  mole.classList.remove('visible', 'hit');
  activeMoles.delete(holeIndex);

  if (moleTimers[holeIndex]) {
    clearTimeout(moleTimers[holeIndex]);
    moleTimers[holeIndex] = null;
  }
}

/**
 * 全穴のモグラを非表示にする
 * Hide all moles in all holes
 */
function hideAllMoles() {
  for (let i = 0; i < HOLE_COUNT; i++) {
    hideMole(i);
  }
}

/**
 * 全モグラの自動消滅タイマーをクリアする
 * Clear all auto-hide timers for moles
 */
function clearAllMoleTimers() {
  for (let i = 0; i < HOLE_COUNT; i++) {
    if (moleTimers[i]) {
      clearTimeout(moleTimers[i]);
      moleTimers[i] = null;
    }
  }
}

/**
 * 穴のインデックスからモグラDOM要素を取得する
 * Get the mole DOM element by hole index
 * @param {number} index - 穴のインデックス / Hole index
 * @returns {HTMLElement|null}
 */
function getMoleElement(index) {
  return moleGrid.querySelector(`.hole-clip .mole[data-index="${index}"]`);
}

/* ========================================
   10. スコア処理 / Score Handling
======================================== */

/**
 * モグラをクリック・タップしたときの処理
 * Handler called when a mole is clicked/tapped
 * @param {Event} event - クリックイベント / Click event
 */
function onMoleClick(event) {
  // ゲーム中でない場合は無効 / Ignore if game is not running
  if (!isPlaying) return;

  const mole = event.currentTarget;
  const holeIndex = parseInt(mole.dataset.index, 10);

  // 出現中のモグラのみ叩ける / Only whackable if currently visible
  if (!activeMoles.has(holeIndex)) return;

  // モグラを叩いた状態にする / Mark mole as hit
  mole.classList.remove('visible');
  mole.classList.add('hit');

  // 自動消滅タイマーをキャンセル / Cancel the auto-hide timer
  if (moleTimers[holeIndex]) {
    clearTimeout(moleTimers[holeIndex]);
    moleTimers[holeIndex] = null;
  }

  // アクティブセットから削除 / Remove from active set
  activeMoles.delete(holeIndex);

  // アニメーション後に完全にリセット / Fully reset after animation
  setTimeout(() => {
    mole.classList.remove('hit');
  }, 350);

  // スコアを加算 / Add score
  addScore();

  // スコアポップアップを表示 / Show score popup
  showScorePopup(event);

  // 叩いた！→ 短く振動と音
  playSound("hit") // 叩いた時に音を出す
  navigator.vibrate(80); // 命中した時に振動する
}

/**
 * スコアを1加算して表示を更新する
 * Add 1 to score and update the display
 */
function addScore() {
  score++;
  updateScoreDisplay();
}

/**
 * スコア表示を現在値に更新する
 * Update the score display element with current value
 */
function updateScoreDisplay() {
  scoreDisplay.textContent = score;
}

/* ========================================
   11. ハイスコア管理 / High Score Management
======================================== */

/**
 * localStorageからハイスコアを読み込む
 * Load high score from localStorage
 * @returns {number} 保存されているハイスコア / Saved high score
 */
function loadHighScore() {
  const saved = localStorage.getItem(HIGHSCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

/**
 * スコアがハイスコアを超えていれば保存し、新記録かどうかを返す
 * Save score if it beats the high score; return whether it's a new record
 * @param {number} currentScore - 今回のスコア / Current game score
 * @returns {boolean} 新記録ならtrue / True if new high score
 */
function checkAndSaveHighScore(currentScore) {
  const prev = loadHighScore();
  if (currentScore > prev) {
    localStorage.setItem(HIGHSCORE_KEY, String(currentScore));
    return true; // 新記録 / New high score
  }
  return false;
}

/* ========================================
   12. ポップアップ演出 / Score Popup Effect
======================================== */

/**
 * モグラを叩いた位置に +1 ポイントのポップアップを表示する
 * Show a "+1 Point" popup at the position where the mole was whacked
 * @param {Event} event - クリックイベント / Click event
 */
function showScorePopup(event) {
  const popup = document.createElement('div');
  popup.classList.add('score-popup');

  // 日英併記テキスト / Bilingual text
  popup.innerHTML = '<span class="ja">+1 ポイント</span><span class="sep">/</span><span class="en">+1 Point</span>';

  // クリック位置に表示する / Position near the click point
  let x, y;
  if (event.touches && event.touches.length > 0) {
    // タッチイベント対応 / Touch event position
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else if (event.clientX !== undefined) {
    x = event.clientX;
    y = event.clientY;
  } else {
    // フォールバック（中央表示） / Fallback position
    const rect = event.currentTarget.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top;
  }

  popup.style.left = `${x - 50}px`;
  popup.style.top  = `${y - 20}px`;

  popupContainer.appendChild(popup);

  // アニメーション完了後に削除 / Remove after animation ends
  popup.addEventListener('animationend', () => {
    popup.remove();
  });
}

/* ========================================
   13. ユーティリティ / Utility Functions
======================================== */

/**
 * 指定範囲のランダム整数を返す（両端を含む）
 * Return a random integer between min and max (inclusive)
 * @param {number} min - 最小値 / Minimum value
 * @param {number} max - 最大値 / Maximum value
 * @returns {number}
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ========================================
   14. 効果音制御 / Sound Effect
======================================== */

let audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();

    const run = () => {
      const now  = audioCtx.currentTime;
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'hit') {
        // ピンポン音：高めの音が短く上がる
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.06);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        navigator.vibrate?.(80);

      } else if (type === 'appear') {
        // ポコッ：低めの短い音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);

      } else if (type === 'miss') {
        // ピロロ：音程が下がってがっかり感
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    };

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(run);
    } else {
      run();
    }

  } catch (e) {
    console.warn('playSound error:', e);
  }
}

/* ========================================
   ページ読み込み完了時に初期化を実行
   Run initialization when DOM is ready
======================================== */
document.addEventListener('DOMContentLoaded', init);
