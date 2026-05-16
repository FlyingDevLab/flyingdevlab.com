/* ===== CONFIG ===== */
const APP_STORE_URL    = "https://apps.apple.com/app/id0000000000"; // TODO: App Store公開後に差し替える
const TOTAL_TIME       = 30;  // ゲームの制限時間（秒）
const WRONG_PENALTY    = 1;   // 不正解時に減るペナルティ時間（秒）
const TILE_COUNT       = 4;   // 選択肢のタイル数
const COMBO_THRESHOLD  = 5;   // タイムボーナスが発動する連続正解数の閾値
const COMBO_EMOJIS     = ["🔥","⚡","💥","🌟","✨","🎯","💫","🚀","🎉","👏"]; // コンボ演出で使うランダム絵文字一覧

/* ===== STATE ===== */
let score        = 0;               // 現在のスコア（正解数）
let combo        = 0;               // 現在の連続正解数
let maxCombo     = 0;               // このゲームセッションでの最大コンボ数
let highScore    = parseInt(localStorage.getItem("make10_hi") || "0", 10); // ローカルストレージから読み込んだハイスコア
let isNewRecord  = false;           // 今回のゲームで新記録を出したかどうか
let timeLeft     = TOTAL_TIME;      // 残り時間（秒単位の実数）
let currentNum   = 0;               // 現在の問題の数字
let nextNum      = 0;               // 次の問題の数字（プレビュー表示用）
let correctAnswer = 0;              // 現在の正解（= 10 - currentNum）
let timerInterval = null;           // requestAnimationFrame のID。endGame時にキャンセルする
let isPlaying    = false;           // ゲーム進行中フラグ。false の場合はタップを無視する
let lastTimestamp = 0;              // 前フレームのタイムスタンプ（差分で正確な経過時間を計算する）

/* ===== DOM ===== */
/* document.getElementById の短縮エイリアス */
const $ = id => document.getElementById(id);

/* 各画面要素をまとめたオブジェクト。showScreen()で切り替える */
const screens = {
  title:  $("titleScreen"),
  play:   $("playScreen"),
  result: $("resultScreen"),
};

/**
 * 指定した画面のみを表示し、他の画面を非表示にする
 * タイトル画面に戻る場合はハイスコア表示も更新する
 */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  if (name === "title") updateTitleHi();
}

/* ハイスコアが0より大きい場合のみタイトル画面にBESTスコアを表示する */
function updateTitleHi() {
  const el = $("titleHi");
  if (!el) return;
  el.textContent = highScore > 0 ? `🏆 BEST: ${highScore}` : "";
}

/* ===== GAME LOGIC ===== */
/**
 * 全ての状態をリセットして新しいゲームを開始する
 * スコア・コンボ・残り時間を初期値に戻し、問題を生成してタイマーを起動する
 */
function startGame() {
  score    = 0;
  combo    = 0;
  maxCombo = 0;
  timeLeft = TOTAL_TIME;
  isPlaying = true;

  $("scoreValue").textContent  = "0";
  $("comboDisplay").textContent = "";
  updateGauge();
  showScreen("play");

  currentNum = randomNum(1, 9);
  nextNum    = randomNumExcluding(1, 9, currentNum); // 直後の問題が現在の問題と同じにならないよう除外する
  generateQuestion();
  startTimer();
}

/* min〜max の整数乱数を返す（両端を含む） */
function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* exclude と同じ値が出ないようにリトライしながら乱数を返す */
function randomNumExcluding(min, max, exclude) {
  let n;
  do { n = randomNum(min, max); } while (n === exclude);
  return n;
}

/**
 * 現在の問題をUIに反映する
 * 正解・選択肢の生成・タイルの描画・アニメーションを一括で行う
 */
function generateQuestion() {
  correctAnswer = 10 - currentNum; // この問題の唯一の正解

  // 問題数字のアニメーションを再トリガーする
  const qNum = $("questionNumber");
  qNum.textContent = currentNum;
  qNum.classList.remove("animate-in");
  void qNum.offsetWidth; // リフローを強制してCSSアニメーションをリセット・再発火させる
  qNum.classList.add("animate-in");

  $("questionPlus").textContent = currentNum;

  // 次の問題の数字をプレビュー表示する
  $("nextNumber").textContent = nextNum;

  // 正解1つ＋ランダムなダミー回答でTILE_COUNT枚分の選択肢を作る
  const answers = [correctAnswer];
  while (answers.length < TILE_COUNT) {
    const d = randomNum(1, 9);
    if (!answers.includes(d)) answers.push(d); // 重複排除
  }
  shuffle(answers); // 正解が常に同じ位置に出ないようシャッフルする

  // タイルをDOMに追加する。各タイルに出現アニメーションのdelayをずらして与える
  const grid = $("tilesGrid");
  grid.innerHTML = "";
  answers.forEach((val, i) => {
    const tile = document.createElement("div");
    tile.className = "tile appear";
    tile.style.animationDelay = `${i * 0.05}s`;
    tile.textContent = val;
    tile.addEventListener("click", () => handleTap(val, tile));
    grid.appendChild(tile);
  });
}

/**
 * タイルがタップされたときの処理
 * 正解なら得点・コンボ・ボーナス時間を処理し、不正解ならペナルティ時間を差し引く
 * @param {number} value  - タップされたタイルの数値
 * @param {Element} tileEl - タップされたタイルのDOM要素
 */
function handleTap(value, tileEl) {
  if (!isPlaying) return;

  // 連打防止：全タイルを一時的に無効化する（正解後はsetTimeout、不正解後はsetTimeoutで再有効化）
  const allTiles = document.querySelectorAll(".tile");
  allTiles.forEach(t => t.style.pointerEvents = "none");

  if (value === correctAnswer) {
    // 正解
    score++;
    combo++;
    if (combo > maxCombo) maxCombo = combo;

    $("scoreValue").textContent = score;
    tileEl.classList.add("correct");
    showFeedback("⭕");
    updateComboDisplay();

    // COMBO_THRESHOLD 以上の連続正解でタイムボーナスを付与する
    // 残り時間が少ないほど多く、多いほど少なくすることでゲームバランスをとる
    if (combo >= COMBO_THRESHOLD) {
      let bonus;
      if (timeLeft <= 5)       bonus = 1.2; // ピンチ時は多めのボーナス
      else if (timeLeft >= 20) bonus = 0.8; // 余裕がある場合は少なめのボーナス
      else                     bonus = 1.0;
      timeLeft = Math.min(TOTAL_TIME, timeLeft + bonus); // 上限を超えないよう制限する
      updateGauge();
      spawnComboEmoji();
    }

    // 次の問題を少し遅らせて表示し、正解アニメーションを見せる時間を確保する
    setTimeout(() => {
      currentNum = nextNum;
      nextNum = randomNumExcluding(1, 9, currentNum);
      generateQuestion();
    }, 250);

  } else {
    // 不正解
    combo = 0; // コンボリセット
    updateComboDisplay();
    tileEl.classList.add("wrong");
    showFeedback("❌");

    timeLeft = Math.max(0, timeLeft - WRONG_PENALTY); // ペナルティ時間を引く（0未満にはならない）
    updateGauge();
    if (timeLeft <= 0) {
      endGame();
      return;
    }

    // 不正解後はアニメーション終了を待ってからタイルを再有効化する
    setTimeout(() => {
      allTiles.forEach(t => t.style.pointerEvents = "");
    }, 300);
  }
}

/**
 * 正解・不正解のフィードバック絵文字を問題エリア中央に表示する
 * アニメーション終了後にDOM要素を削除してメモリリークを防ぐ
 */
function showFeedback(emoji) {
  const fb = document.createElement("div");
  fb.className = "feedback";
  fb.textContent = emoji;
  $("questionArea").appendChild(fb);
  setTimeout(() => fb.remove(), 500);
}

/**
 * コンボ数をUIに反映する
 * 2コンボ以上で表示、1以下で非表示にする
 * void offsetWidth でアニメーションを毎回リセット・再発火させる
 */
function updateComboDisplay() {
  const el = $("comboDisplay");
  if (combo >= 2) {
    el.textContent = `🔥 ${combo} COMBO`;
    el.classList.remove("pop");
    void el.offsetWidth; // アニメーションをリセットして再発火
    el.classList.add("pop");
  } else {
    el.textContent = "";
  }
}

/**
 * コンボボーナス達成時に画面上のランダムな位置へ絵文字を浮遊させる
 * アニメーション終了後にDOM要素を削除する
 */
function spawnComboEmoji() {
  const emoji = COMBO_EMOJIS[Math.floor(Math.random() * COMBO_EMOJIS.length)];
  const el = document.createElement("div");
  el.className = "combo-emoji";
  el.textContent = emoji;
  el.style.left = `${randomNum(20, 80)}%`;
  el.style.top  = `${randomNum(40, 70)}%`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

/* ===== TIMER ===== */
/**
 * requestAnimationFrameベースのタイマーを開始する
 * setIntervalより正確で、バックグラウンドタブでの暴走も防げる
 */
function startTimer() {
  lastTimestamp = performance.now();
  timerInterval = requestAnimationFrame(timerTick);
}

/**
 * タイマーの毎フレーム処理
 * 前フレームとの差分（delta秒）を timeLeft から引いて経過時間を正確に計測する
 * @param {number} timestamp - requestAnimationFrameが渡すミリ秒単位のタイムスタンプ
 */
function timerTick(timestamp) {
  if (!isPlaying) return;

  const delta = (timestamp - lastTimestamp) / 1000; // ミリ秒→秒に変換
  lastTimestamp = timestamp;
  timeLeft = Math.max(0, timeLeft - delta);
  updateGauge();

  if (timeLeft <= 0) {
    endGame();
    return;
  }

  timerInterval = requestAnimationFrame(timerTick);
}

/* 残り時間をゲージバーの幅（%）に反映する */
function updateGauge() {
  const bar = $("gaugeBar");
  const pct = (timeLeft / TOTAL_TIME) * 100;
  bar.style.width = `${pct}%`;
}

/* ===== END GAME ===== */
/**
 * ゲーム終了処理
 * タイマーを止め、ハイスコアを更新し、300ms後にリザルト画面を表示する
 */
function endGame() {
  isPlaying = false;
  if (timerInterval) cancelAnimationFrame(timerInterval);

  // ハイスコア更新（新記録の場合のみlocalStorageに保存）
  isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    localStorage.setItem("make10_hi", highScore);
  }

  // わずかな間を置いてからリザルト画面に切り替える（遷移を自然に見せる）
  setTimeout(() => {
    showScreen("result");
    $("resultScore").textContent   = score;
    $("resultMessage").textContent = getResultMessage(score);
    $("resultCombo").textContent   = maxCombo >= 2
      ? `MAX COMBO: ${maxCombo} 🔥`
      : "";

    // ハイスコア表示：新記録時は緑色でアニメーション付き
    const hiEl = $("resultHi");
    if (isNewRecord) {
      hiEl.textContent = "🏆 New Record!";
      hiEl.className   = "result-hi new-record";
    } else {
      hiEl.textContent = `BEST: ${highScore}`;
      hiEl.className   = "result-hi";
    }

    const appStoreBtn = $("appStoreBtn");
    if (appStoreBtn) appStoreBtn.href = APP_STORE_URL;
  }, 300);
}

/**
 * スコアに応じた日英メッセージを返す
 * スコアが高いほど大げさな表現を使い、プレイヤーを称える
 */
function getResultMessage(s) {
  if (s >= 100) return "神！ / Godlike!";
  if (s >= 50)  return "伝説！ / Legendary!";
  if (s >= 20)  return "天才！ / Genius!";
  if (s >= 10)  return "すごすぎ！ / Amazing!";
  if (s >= 5)   return "すごい！ / Great!";
  if (s >= 3)   return "いいね！ / Nice!";
  if (s >= 1)   return "次はいける！ / You'll get it!";
  return "もう一回！ / Try again!";
}

/* ===== UTILS ===== */
/**
 * Fisher-Yatesアルゴリズムで配列をインプレースでシャッフルする
 * 数学的に均等な分布が保証されるシャッフル手法
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ===== NAVIGATION ===== */
const HOME_URL = "https://flyingdevlab.com/";

/**
 * タイマーを止めてサイトのトップページへ移動する
 * ゲーム中に呼ばれた場合でもタイマーを確実にキャンセルする
 */
function goHome() {
  isPlaying = false;
  if (timerInterval) cancelAnimationFrame(timerInterval);
  window.location.href = HOME_URL;
}

/* ===== INIT ===== */
/* App StoreボタンのhrefをTODOプレースホルダーから設定する（HTMLでコメントアウト中は不要） */
const appStoreBtn = $("appStoreBtn");
if (appStoreBtn) appStoreBtn.href = APP_STORE_URL;

/* ページ読み込み時にタイトル画面のハイスコアを即座に反映する */
updateTitleHi();
