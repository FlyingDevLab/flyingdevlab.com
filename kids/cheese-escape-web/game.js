// ================================================================
// game.js – Cheese Quest / チーズクエスト
// ================================================================

// ────────────────────────────────────────────────────────────────
// ■ 固定定数
// ────────────────────────────────────────────────────────────────
const BASE       = 570;
const MC         = 6;
const GW         = MC * 3 + 1;
const T          = BASE / GW;
const PLAYER_R   = T * 0.44;   // プレイヤー（白ネズミ）の当たり判定
const CHEESE_R   = T * 0.38;   // 集めるチーズ1個の大きさ
const MOUSE_R    = T * 0.33;
const MOUSE_SPD  = 1.05;
const SW_EXPAND  = 7;
const SW_COOL    = 180;
const DMG_COOL   = 60;
const MOVE_STEPS = 4;

/*
 * ── 壁に沿って巡回するネズミ ──────────────────────────────────
 *
 * iOS アプリ（FDL-TenBlitz）の MazeGame から移植した。
 * この Web 版が原型で、アプリはそれを Swift に移植したものだが、
 * 敵の種類はアプリ側だけで3種類に増えていた。こちらへ戻している。
 *
 *   chaser    … 灰色。プレイヤーを追いかける（従来からいる敵）
 *   rightHand … 赤。右手を壁につけて巡回する
 *   leftHand  … 青。左手を壁につけて巡回する
 *
 * ★ 壁に手をつけて歩く（右手法・左手法）とは ★
 *   迷路で片方の手をずっと壁につけたまま歩くと、いつかは迷路じゅうを回れる、
 *   という昔からの歩き方。この迷路は一本道で全部つながる作りなので、
 *   手をつけて歩けば全体をぐるっと一周し、また同じ道をくり返す。
 *   赤は右手、青は左手。同じ道でも、まわる向きが逆になる。
 *
 * ★ なぜ追いかける敵と別に用意するのか ★
 *   追ってくる敵は「逃げる」で対処できるが、巡回する敵は追ってこない。
 *   そのぶん油断しやすく、曲がり角で鉢合わせる。
 *   質の違う緊張感が生まれる。
 */
const WALL_FOLLOWER_FROM = 11;   // 各ステージで、この匹数目から巡回型が出る
const LATE_SPAWN_ORDER   = ['rightHand', 'leftHand', 'chaser'];  // 11匹目からの順番

/* 向き（0=右 1=下 2=左 3=上）ごとの、1マス進んだときのずれ */
const STEP_X = [1, 0, -1, 0];
const STEP_Y = [0, 1, 0, -1];

const SW_RANGE_BY_HP = [
  T * 8,
  T * 6.5,
  T * 5
];

// ────────────────────────────────────────────────────────────────
// ■ 難易度計算
// ────────────────────────────────────────────────────────────────
function getDifficulty(score) {
  const maxMice  = Math.max(2, score * 2);
  const spawnInt = score >= 6 ? 120
                 : score >= 4 ? 150
                 : score >= 2 ? 180
                 : 210;
  return { maxMice, spawnInt };
}

function getSwMaxR(hp) {
  return SW_RANGE_BY_HP[Math.max(0, Math.min(2, hp - 1))];
}

// ────────────────────────────────────────────────────────────────
// ■ 画面管理
// ────────────────────────────────────────────────────────────────
const screens = {
  top:    document.getElementById('screen-top'),
  game:   document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('screen--active', key === name);
  }
}

// ────────────────────────────────────────────────────────────────
// ■ DOM 要素
// ────────────────────────────────────────────────────────────────
const canvas            = document.getElementById('gameCanvas');
const ctx               = canvas.getContext('2d');
const topHighscoreEl    = document.getElementById('top-highscore');
const resultScoreEl     = document.getElementById('result-score');
const resultHighscoreEl = document.getElementById('result-highscore');
const btnStart          = document.getElementById('btn-start');
const btnRetry          = document.getElementById('btn-retry');
const btnTop            = document.getElementById('btn-top');

// ────────────────────────────────────────────────────────────────
// ■ ハイスコアの保存・読み込み
// ────────────────────────────────────────────────────────────────
/*
 * 変更: localStorage への読み書きを、この2つの関数に集約しました。
 *
 * 【なぜ直接呼んではいけないのか】
 * 以前はこう書いていました。
 *
 *   let highScore = parseInt(localStorage.getItem('cheeseEscape_hi') || '0', 10);
 *
 * 一見すると問題なさそうですが、これはファイルの上のほう、
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
function loadHighScore() {
  try {
    return parseInt(localStorage.getItem('cheeseEscape_hi') || '0', 10);
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
 * 読み込み側だけ対策しても、ゲームオーバー時にここで落ちてしまい、
 * リザルト画面が表示されないゲームになります。
 *
 * @param {number} value - 保存するスコア
 */
function saveHighScore(value) {
  try {
    localStorage.setItem('cheeseEscape_hi', value);
  } catch (e) {
    /* 保存できなくても続行する（記録は今回のセッション限りになる） */
  }
}

// ────────────────────────────────────────────────────────────────
// ■ ゲーム状態変数
// ────────────────────────────────────────────────────────────────
let state          = 'playing';
let score          = 0;
let highScore      = loadHighScore();  // 変更: 直接呼び出しをやめ、try/catch 付きヘルパー経由に
let isNewRecord    = false;
let deliveredTimer = 0;
let grid           = [];
let player         = { x: 0, y: 0, hp: 3, flash: 0, dmgCool: 0, angle: 0 };
let mice           = [];
let particles      = [];
let shockwave      = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
/*
 * 集める対象のチーズ3個。{ x, y, collected } の配列。
 *
 * 変更: 以前は goal（ゴール地点1つ）へ到達すればクリアだった。
 * それだと左上から右下へ斜めに1回横切るだけで終わり、
 * せっかく作った迷路のほとんどを通らずにステージが終わっていた。
 *
 * iOS アプリと同じく、プレイヤーを左上の隅に置き、
 * 残りの3隅にチーズを配置する方式にした。
 * 4隅すべてを回らないとクリアできないので、
 * 必然的に迷路を端から端まで歩くことになる。
 */
let cheeses        = [];
let spawnTimer     = 0;
/* このステージで出した敵の数。WALL_FOLLOWER_FROM 匹目から巡回型に切り替わる */
let spawnedThisStage = 0;
let drag = false, lastMX = 0, lastMY = 0, dragDist = 0;
let downPos        = { x: 0, y: 0 };
let rafId          = null;
let loopRunning    = false;

// ────────────────────────────────────────────────────────────────
// ■ ハイスコア UI
// ────────────────────────────────────────────────────────────────
function updateTopHighscoreUI() {
  if (highScore > 0) {
    topHighscoreEl.innerHTML =
      `<div class="highscore-block">
         <span class="trophy" aria-hidden="true">🏆</span>
         <span>Best Score: <strong>🧀×${highScore}</strong></span>
       </div>`;
  } else {
    topHighscoreEl.innerHTML =
      `<p class="no-record">No record yet&ensp;/&ensp;まだ記録がありません</p>`;
  }
}

function updateResultUI() {
  resultScoreEl.innerHTML = `🧀 ×${score}`;
  resultHighscoreEl.classList.toggle('new-record', isNewRecord);
  if (isNewRecord) {
    resultHighscoreEl.innerHTML = `🏆 New Record!&ensp;/&ensp;新記録！&ensp;&nbsp;HI ×${highScore}`;
  } else {
    resultHighscoreEl.innerHTML = `🏆 Best: 🧀×${highScore}`;
  }
}

// ────────────────────────────────────────────────────────────────
// ■ 迷路生成 (Recursive Backtracker)
// ────────────────────────────────────────────────────────────────
function buildMaze() {
  grid = Array.from({ length: GW }, () => new Array(GW).fill(0));
  const visited = Array.from({ length: MC }, () => new Array(MC).fill(false));

  function openCell(cx, cy) {
    const tx = cx * 3 + 1, ty = cy * 3 + 1;
    grid[ty][tx] = grid[ty][tx + 1] = grid[ty + 1][tx] = grid[ty + 1][tx + 1] = 1;
  }

  function openWall(cx, cy, nx, ny) {
    const tx = cx * 3 + 1, ty = cy * 3 + 1;
    const dx = nx - cx, dy = ny - cy;
    if      (dx ===  1) { grid[ty][cx * 3 + 3] = grid[ty + 1][cx * 3 + 3] = 1; }
    else if (dx === -1) { grid[ty][cx * 3]     = grid[ty + 1][cx * 3]     = 1; }
    else if (dy ===  1) { grid[cy * 3 + 3][tx] = grid[cy * 3 + 3][tx + 1] = 1; }
    else if (dy === -1) { grid[cy * 3][tx]     = grid[cy * 3][tx + 1]     = 1; }
  }

  function dfs(cx, cy) {
    visited[cy][cx] = true;
    openCell(cx, cy);
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .map(d => ({ d, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(o => o.d);
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < MC && ny >= 0 && ny < MC && !visited[ny][nx]) {
        openWall(cx, cy, nx, ny);
        dfs(nx, ny);
      }
    }
  }
  dfs(0, 0);
}

// ────────────────────────────────────────────────────────────────
// ■ 壁衝突判定 / 押し出し / スライド移動
// ────────────────────────────────────────────────────────────────
function hitsWall(px, py, r) {
  const x0 = Math.max(0, Math.floor((px - r) / T));
  const x1 = Math.min(GW - 1, Math.floor((px + r) / T));
  const y0 = Math.max(0, Math.floor((py - r) / T));
  const y1 = Math.min(GW - 1, Math.floor((py + r) / T));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (grid[ty][tx] === 1) continue;
      const nearX = Math.max(tx * T, Math.min(px, (tx + 1) * T));
      const nearY = Math.max(ty * T, Math.min(py, (ty + 1) * T));
      if ((px - nearX) ** 2 + (py - nearY) ** 2 < r * r) return true;
    }
  }
  return false;
}

function pushOut(px, py, r) {
  const x0 = Math.max(0, Math.floor((px - r) / T));
  const x1 = Math.min(GW - 1, Math.floor((px + r) / T));
  const y0 = Math.max(0, Math.floor((py - r) / T));
  const y1 = Math.min(GW - 1, Math.floor((py + r) / T));
  let outX = 0, outY = 0;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (grid[ty][tx] === 1) continue;
      const nearX = Math.max(tx * T, Math.min(px, (tx + 1) * T));
      const nearY = Math.max(ty * T, Math.min(py, (ty + 1) * T));
      const dSq = (px - nearX) ** 2 + (py - nearY) ** 2;
      if (dSq < r * r && dSq > 0) {
        const d = Math.sqrt(dSq);
        outX += (px - nearX) / d * (r - d);
        outY += (py - nearY) / d * (r - d);
      } else if (dSq === 0) { outX += r; }
    }
  }
  return { x: px + outX, y: py + outY };
}

function slideMove(ox, oy, totalDx, totalDy, r) {
  let cx = ox, cy = oy;
  const sx = totalDx / MOVE_STEPS, sy = totalDy / MOVE_STEPS;
  for (let i = 0; i < MOVE_STEPS; i++) {
    const nx = cx + sx, ny = cy + sy;
    if      (!hitsWall(nx, ny, r)) { cx = nx; cy = ny; }
    else if (!hitsWall(nx, cy, r)) { cx = nx; }
    else if (!hitsWall(cx, ny, r)) { cy = ny; }
    const po = pushOut(cx, cy, r);
    cx = po.x; cy = po.y;
  }
  return { x: cx, y: cy };
}

// ────────────────────────────────────────────────────────────────
// ■ ゲーム開始 / ステージ開始
// ────────────────────────────────────────────────────────────────
function startGame() {
  score = 0;
  player.hp = 3;
  startStage();
  showScreen('game');
  if (!loopRunning) { loopRunning = true; loop(); }
}

function startStage() {
  buildMaze();
  const prevHp = player.hp > 0 ? player.hp : 3;

  /*
   * プレイヤーは左上の隅、チーズは残りの3隅。
   *
   * この迷路は 6×6 のセルでできており、1セルは 3×3 タイル。
   * セル(cx, cy) の中心タイルは (cx*3 + 1, cy*3 + 1) なので、
   * その中心座標は (cx*3 + 1.5) * T になる。
   *   セル(0,0) → T * 1.5     セル(5,0) → T * 16.5
   *   セル(0,5) → T * 1.5     セル(5,5) → T * 16.5
   */
  player  = { x: T * 1.5, y: T * 1.5, hp: prevHp, flash: 0, dmgCool: 0, angle: 0 };
  cheeses = [
    { x: T * 16.5, y: T * 1.5,  collected: false },   // 右上
    { x: T * 1.5,  y: T * 16.5, collected: false },   // 左下
    { x: T * 16.5, y: T * 16.5, collected: false },   // 右下
  ];
  mice      = [];
  particles = [];
  shockwave = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
  const { spawnInt } = getDifficulty(score);
  spawnTimer = spawnInt;
  spawnedThisStage = 0;   // ステージが変わったら敵の種類も最初から数え直す
  drag       = false;
  state      = 'playing';
}

// ────────────────────────────────────────────────────────────────
// ■ ゲームオーバー
// ────────────────────────────────────────────────────────────────
function triggerGameOver() {
  isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    saveHighScore(highScore);  // 変更: 直接呼び出しをやめ、try/catch 付きヘルパー経由に
  }
  // ゲームオーバー：重く沈む低音 ＋ 3回振動でショックを表現
  playSound('gameover');
  vibrate([120, 60, 120, 60, 200]);
  updateResultUI();
  updateTopHighscoreUI();
  showScreen('result');
}

// ────────────────────────────────────────────────────────────────
// ■ ネズミ
// ────────────────────────────────────────────────────────────────
function spawnMouse() {
  const { maxMice } = getDifficulty(score);
  if (mice.length >= maxMice) return;
  for (let attempts = 0; attempts < 200; attempts++) {
    const tx = Math.floor(Math.random() * GW);
    const ty = Math.floor(Math.random() * GW);
    if (grid[ty][tx] !== 1) continue;
    const mx = (tx + 0.5) * T, my = (ty + 0.5) * T;
    if (Math.hypot(mx - player.x, my - player.y) < T * 5) continue;
    spawnedThisStage++;
    mice.push({
      x: mx, y: my, vx: 0, vy: 0, kb: 0,
      kind: nextMouseKind(),
      // 巡回型が使う情報。targetX が -1 のあいだは「行き先が未定」を表す
      targetX: -1, targetY: -1,
      dir: 0,            // 0=右 1=下 2=左 3=上
      touchesWall: false // まだ手を壁につけていない
    });
    break;
  }
}

/**
 * 次に出す敵の種類を決める。
 * WALL_FOLLOWER_FROM 匹目からは赤 → 青 → 通常 の順でくり返す。
 * （spawnedThisStage を数えたあとに呼ぶ）
 */
function nextMouseKind() {
  if (spawnedThisStage < WALL_FOLLOWER_FROM) return 'chaser';
  const i = (spawnedThisStage - WALL_FOLLOWER_FROM) % LATE_SPAWN_ORDER.length;
  return LATE_SPAWN_ORDER[i];
}

/** タイル(x,y)が通路かどうか。盤の外は壁として扱う */
function isPath(x, y) {
  return x >= 0 && y >= 0 && x < GW && y < GW && grid[y][x] === 1;
}

/**
 * タイル(x,y)の中心で、次に進む向きを決める。
 *
 * @param {number} hand - 壁につける手の向き。右手なら 1（右へ1つ）、左手なら 3（＝左）
 * @param {boolean} touchesWall - もう手を壁につけているか
 */
function wallFollowStep(x, y, dir, hand, touchesWall) {
  const away = (4 - hand) % 4;              // 手と反対へ曲がるときの回り方
  const open = d => isPath(x + STEP_X[d], y + STEP_Y[d]);

  // ① まだ手が壁についていない：手の側に壁が来るまで、まっすぐ進む
  if (!touchesWall) {
    if (open((dir + hand) % 4)) {
      if (open(dir)) return { dir, touchesWall: false };
      // 正面が壁 → 手と反対へ曲がると、正面の壁が手の側に来る
      let d = (dir + away) % 4;
      for (let i = 0; i < 4 && !open(d); i++) d = (d + away) % 4;
      return { dir: d, touchesWall: true };
    }
    // 手の側に壁がある → ここから手をつける（下の ② へ）
  }

  // ② 手を壁につけて歩く。
  //    手の側が空いたら（壁の角）その向きへ曲がる。
  //    空いていなければまっすぐ。それも壁なら手と反対へ回る（行き止まりなら引き返す）
  const handSide = (dir + hand) % 4;
  if (open(handSide)) return { dir: handSide, touchesWall: true };
  let d = dir;
  for (let i = 0; i < 4; i++) {
    if (open(d)) return { dir: d, touchesWall: true };
    d = (d + away) % 4;
  }
  return { dir, touchesWall: true };   // 四方が壁（通路の上では起きない）
}

/**
 * 巡回型（赤・青）を1フレームぶん動かす。
 *
 * 追いかける敵のように壁へぶつかりながら進むのではなく、
 * 通路タイルの中心を1マスずつ渡り歩く。
 * 中心に着いたら、次にどのタイルへ進むかを wallFollowStep で決める。
 */
function updateWallFollower(m) {
  // 行き先が未定なら（出現直後・吹き飛ばされた後）、いまいるタイルの中心へ向かう
  if (m.targetX < 0) {
    m.targetX = Math.min(GW - 1, Math.max(0, Math.floor(m.x / T)));
    m.targetY = Math.min(GW - 1, Math.max(0, Math.floor(m.y / T)));
  }

  const goalX = (m.targetX + 0.5) * T;
  const goalY = (m.targetY + 0.5) * T;
  const dx = goalX - m.x, dy = goalY - m.y;
  const dist = Math.hypot(dx, dy);

  if (dist > MOUSE_SPD) {
    m.vx = dx / dist * MOUSE_SPD;
    m.vy = dy / dist * MOUSE_SPD;
    m.x += m.vx; m.y += m.vy;
  } else {
    // タイルの中心に着いた。次に進むタイルを決める
    m.x = goalX; m.y = goalY;
    const hand = m.kind === 'rightHand' ? 1 : 3;
    const next = wallFollowStep(m.targetX, m.targetY, m.dir, hand, m.touchesWall);
    m.dir = next.dir;
    m.touchesWall = next.touchesWall;
    m.targetX += STEP_X[m.dir];
    m.targetY += STEP_Y[m.dir];
  }
}

function updateMice() {
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    if (m.kb > 0) {
      // ノックバック中：与えられた速度で滑り、徐々に減速する
      const moved = slideMove(m.x, m.y, m.vx, m.vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx *= 0.82; m.vy *= 0.82;
      m.kb--;
      // 吹き飛ばされて道すじから外れたので、止まったところから壁を探し直す
      m.targetX = -1;
      m.touchesWall = false;
    } else if (m.kind !== 'chaser') {
      // 赤・青：壁に沿って巡回する。プレイヤーは追わない
      updateWallFollower(m);
    } else {
      const dx = player.x - m.x, dy = player.y - m.y;
      const jitter = (Math.random() - 0.5) * 1.0;
      const angle  = Math.atan2(dy, dx) + jitter;
      const vx = Math.cos(angle) * MOUSE_SPD;
      const vy = Math.sin(angle) * MOUSE_SPD;
      const moved = slideMove(m.x, m.y, vx, vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx = vx; m.vy = vy;
    }
    if (Math.hypot(m.x - player.x, m.y - player.y) < PLAYER_R + MOUSE_R && player.dmgCool === 0) {
      player.hp--;
      player.flash   = 30;
      player.dmgCool = DMG_COOL;
      // ダメージ：鈍い衝撃音 ＋ 短く2回振動
      playSound('damage');
      vibrate([80, 40, 80]);
      if (player.hp <= 0) { state = 'gameover'; triggerGameOver(); }
    }
  }
}

// ────────────────────────────────────────────────────────────────
// ■ 衝撃波
// ────────────────────────────────────────────────────────────────
function fireShockwave(x, y) {
  if (shockwave.cool > 0) return;
  const swMaxR = getSwMaxR(player.hp);
  const killR  = swMaxR * 0.55;
  shockwave = { active: true, r: 5, cool: SW_COOL, cx: x, cy: y };
  // 衝撃波発射：ドン！という爆発音 ＋ 短い振動
  playSound('shockwave');
  vibrate(60);
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    const d = Math.hypot(m.x - x, m.y - y);
    if (d > swMaxR) continue;
    if (d < killR) {
      spawnParticles(m.x, m.y);
      // ネズミ撃破：軽いポップ音（連発するため振動なし）
      playSound('kill');
      mice.splice(i, 1);
    } else {
      const angle = Math.atan2(m.y - y, m.x - x);
      const force = (1 - d / swMaxR) * 14;
      m.vx = Math.cos(angle) * force;
      m.vy = Math.sin(angle) * force;
      m.kb = 22;
    }
  }
}

function updateShockwave() {
  if (shockwave.cool > 0) shockwave.cool--;
  if (!shockwave.active) return;
  shockwave.r += SW_EXPAND;
  if (shockwave.r >= getSwMaxR(player.hp)) shockwave.active = false;
}

// ────────────────────────────────────────────────────────────────
// ■ パーティクル
// ────────────────────────────────────────────────────────────────
function spawnParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 28, maxLife: 28
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.88; p.vy *= 0.88;
    if (--p.life <= 0) particles.splice(i, 1);
  }
}

// ────────────────────────────────────────────────────────────────
// ■ 座標変換
// ────────────────────────────────────────────────────────────────
function toLogical(clientX, clientY) {
  const rect  = canvas.getBoundingClientRect();
  const scale = BASE / rect.width;
  return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
}

// ────────────────────────────────────────────────────────────────
// ■ 入力イベント
// ────────────────────────────────────────────────────────────────
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  const p = toLogical(e.clientX, e.clientY);
  drag = true; dragDist = 0; lastMX = p.x; lastMY = p.y; downPos = { x: p.x, y: p.y };
});

canvas.addEventListener('mousemove', e => {
  e.preventDefault();
  if (!drag || state !== 'playing') return;
  const p = toLogical(e.clientX, e.clientY);
  const dx = p.x - lastMX, dy = p.y - lastMY;
  dragDist += Math.hypot(dx, dy);
  const moved = slideMove(player.x, player.y, dx, dy, PLAYER_R);
  // 向きを覚えておく。止まっている間も最後に進んだ方を向かせるため
  if (dx || dy) player.angle = Math.atan2(dy, dx);
  player.x = moved.x; player.y = moved.y;
  lastMX = p.x; lastMY = p.y;
});

canvas.addEventListener('mouseup', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  if (drag && dragDist < 10) fireShockwave(downPos.x, downPos.y);
  drag = false;
});

canvas.addEventListener('mouseleave', () => { drag = false; });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  const t = e.touches[0], p = toLogical(t.clientX, t.clientY);
  drag = true; dragDist = 0; lastMX = p.x; lastMY = p.y; downPos = { x: p.x, y: p.y };
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!drag || state !== 'playing') return;
  const t = e.touches[0], p = toLogical(t.clientX, t.clientY);
  const dx = p.x - lastMX, dy = p.y - lastMY;
  dragDist += Math.hypot(dx, dy);
  const moved = slideMove(player.x, player.y, dx, dy, PLAYER_R);
  // 向きを覚えておく。止まっている間も最後に進んだ方を向かせるため
  if (dx || dy) player.angle = Math.atan2(dy, dx);
  player.x = moved.x; player.y = moved.y;
  lastMX = p.x; lastMY = p.y;
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  if (drag && dragDist < 10) fireShockwave(downPos.x, downPos.y);
  drag = false;
}, { passive: false });

// ────────────────────────────────────────────────────────────────
// ■ Canvas 描画
// ────────────────────────────────────────────────────────────────
function drawMaze() {
  ctx.fillStyle = '#5D4037';
  for (let ty = 0; ty < GW; ty++)
    for (let tx = 0; tx < GW; tx++)
      if (grid[ty][tx] === 0) ctx.fillRect(tx * T, ty * T, T, T);
}

/*
 * 集める対象のチーズ3個を描く。回収済みのものは描かない。
 *
 * 形は以前プレイヤーだったチーズと同じ三角形。
 * 役割が「操作する対象」から「集める対象」に変わっただけで、
 * 見た目を変えてしまうとプレイヤーが戸惑うため、そのまま使う。
 */
function drawCheeses() {
  for (const c of cheeses) {
    if (c.collected) continue;
    const { x, y } = c;

    // ふわっと上下に浮かせて、置いてあるものだと分かるようにする
    const bob = Math.sin(Date.now() / 300 + x) * T * 0.08;
    const cy = y + bob;

    ctx.beginPath();
    ctx.moveTo(x, cy - CHEESE_R * 1.2);
    ctx.lineTo(x + CHEESE_R * 1.2, cy + CHEESE_R * 0.8);
    ctx.lineTo(x - CHEESE_R * 1.2, cy + CHEESE_R * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#FFD600'; ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();

    // チーズの穴
    ctx.fillStyle = '#795548';
    for (const [ox, oy] of [[-3, 4], [6, -2], [1, 10]]) {
      ctx.beginPath(); ctx.arc(x + ox, cy + oy, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/*
 * プレイヤー（白ネズミ）を描く。
 *
 * 変更: 以前はプレイヤーがチーズそのものだった。
 * ルールを「チーズを集める」に変えたため、集める対象と操作する対象が
 * 同じ見た目だと区別がつかない。iOS アプリと同じく白ネズミにした。
 *
 * 形は敵ネズミと同じものを使い、色だけ変えている。
 * 同じ世界の生き物なので、形まで変えると別の何かに見えてしまう。
 *
 * ■ HP を体の色で示す
 *   以前のチーズは、色と「ひび割れ」で残り HP を表していた。
 *   HUD にも HP は出ているが、操作している手元から目を離さずに
 *   分かることには意味がある。白 → 薄桃 → 桃 と濃くしていく。
 */
const PLAYER_COLORS = [
  { body: '#FFCDD2', line: '#C62828', head: '#FFE5E5' },  // HP1：桃
  { body: '#FFEBEE', line: '#AD5555', head: '#FFF5F5' },  // HP2：薄桃
  { body: '#FFFFFF', line: '#8D6E63', head: '#FAFAFA' },  // HP3：白
];

function drawPlayer() {
  const { x, y, hp, flash, angle } = player;
  const col = PLAYER_COLORS[Math.max(0, Math.min(2, hp - 1))];
  const r = PLAYER_R;

  ctx.save();
  // 被弾直後は点滅させて、無敵時間であることを伝える
  if (flash > 0) ctx.globalAlpha = Math.abs(Math.sin(flash * 0.35)) * 0.8 + 0.2;
  ctx.translate(x, y); ctx.rotate(angle || 0);

  // 胴
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.3, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = col.body; ctx.strokeStyle = col.line; ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();
  // 頭
  ctx.beginPath(); ctx.arc(r * 1.1, 0, r * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = col.head; ctx.fill(); ctx.stroke();
  // 耳
  ctx.beginPath(); ctx.arc(r * 0.95, -r * 0.75, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#F8BBD0'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.95,  r * 0.75, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#F8BBD0'; ctx.fill();
  // 目
  ctx.beginPath(); ctx.arc(r * 1.55, -r * 0.28, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#333'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 1.55,  r * 0.28, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#333'; ctx.fill();
  // 鼻
  ctx.beginPath(); ctx.arc(r * 1.78, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#E91E63'; ctx.fill();
  // しっぽ
  ctx.beginPath();
  ctx.moveTo(-r * 1.25, 0);
  ctx.quadraticCurveTo(-r * 2.1, -r * 0.5, -r * 2.4, r * 0.3);
  ctx.strokeStyle = col.line; ctx.lineWidth = 2; ctx.stroke();

  ctx.restore();
}

/*
 * 敵の種類ごとの配色。
 * 色が違えば「追ってくる敵か、巡回しているだけの敵か」が一目で分かる。
 * 動きを見て判断させるのではなく、見た目で伝える。
 */
const MOUSE_COLORS = {
  chaser:    { body: '#9E9E9E', line: '#616161', head: '#BDBDBD' },  // 灰：追ってくる
  rightHand: { body: '#E57373', line: '#C62828', head: '#EF9A9A' },  // 赤：右手で巡回
  leftHand:  { body: '#64B5F6', line: '#1565C0', head: '#90CAF9' },  // 青：左手で巡回
};

function drawMice() {
  for (const m of mice) {
    const { x, y } = m, r = MOUSE_R;
    const col = MOUSE_COLORS[m.kind] || MOUSE_COLORS.chaser;
    /*
     * 向き。追ってくる敵はプレイヤーの方を向くが、巡回型は進んでいる方を向く。
     * 追っていないのに睨んでいると、挙動と見た目が食い違う。
     * ノックバック中は飛ばされている向きを使う。
     */
    const angle = (m.kind !== 'chaser' && m.kb === 0 && (m.vx || m.vy))
      ? Math.atan2(m.vy, m.vx)
      : Math.atan2(player.y - y, player.x - x);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.4, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = col.body; ctx.strokeStyle = col.line; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.2, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = col.head; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.0, -r * 0.8, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#EF9A9A'; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 1.0,  r * 0.8, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#EF9A9A'; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 1.7, -r * 0.3, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#212121'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * 1.4, 0);
    ctx.quadraticCurveTo(-r * 2.0, r * 1.2, -r * 2.5, r * 0.4);
    ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
}

function drawShockwave() {
  if (!shockwave.active) return;
  const { r, cx, cy } = shockwave;
  const swMaxR   = getSwMaxR(player.hp);
  const progress = r / swMaxR;
  const alpha    = (1 - progress) * 0.6;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,235,59,${alpha})`;
  ctx.lineWidth   = (1 - progress) * 10 + 1;
  ctx.stroke();
  const grd = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grd.addColorStop(0, `rgba(255,255,255,${alpha * 0.35})`);
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grd; ctx.fill();
}

function drawParticles() {
  for (const p of particles) {
    const a = p.life / p.maxLife;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4 * a, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,50,${a})`; ctx.fill();
  }
}

// ─── HUD ─────────────────────────────────────────────────────
function drawHUD() {
  // 左上：HP ▲ × 3
  const iconSize = 12, iconY = 20;
  for (let i = 0; i < 3; i++) {
    const cx = 18 + i * (iconSize * 2 + 5);
    ctx.beginPath();
    ctx.moveTo(cx, iconY - iconSize);
    ctx.lineTo(cx + iconSize, iconY + iconSize * 0.65);
    ctx.lineTo(cx - iconSize, iconY + iconSize * 0.65);
    ctx.closePath();
    ctx.fillStyle   = i < player.hp ? '#FFD600' : '#444';
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 1.2;
    ctx.fill(); ctx.stroke();
  }

  /*
   * 左上：このステージのチーズ回収状況と、いま何ステージ目か。
   *
   * 変更: 以前は「🧀 ×スコア」で、ゴールへ運んだチーズの数を表していた。
   * 集める方式に変わったので、同じ表記のままだと
   * 「いま何個持っているのか」と読み違える。
   * 残りが一目で分かる 2/3 の形にした。
   */
  const got = cheeses.filter(c => c.collected).length;
  ctx.font = `bold ${T * 0.62}px sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const hudText = `🧀 ${got}/${cheeses.length}`;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(hudText, 89, iconY + 1);
  ctx.fillStyle = '#FFD600';
  ctx.fillText(hudText, 88, iconY);

  // その右に、いま何ステージ目か
  const stageText = `STAGE ${score + 1}`;
  ctx.font = `bold ${T * 0.5}px sans-serif`;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(stageText, 186, iconY + 1);
  ctx.fillStyle = '#B0BEC5';
  ctx.fillText(stageText, 185, iconY);

  // 右上：衝撃波チャージバー
  const barW = 90, barH = 9;
  const bx = BASE - barW - 14, by = 15;
  const ready = shockwave.cool === 0;
  const fill  = ready ? 1 : 1 - shockwave.cool / SW_COOL;
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 4); ctx.fill();
  ctx.fillStyle = ready ? '#FFEB3B' : '#FFA726';
  if (fill > 0) { ctx.beginPath(); ctx.roundRect(bx, by, barW * fill, barH, 4); ctx.fill(); }

  // バーラベル（英語のみ。スペースの都合上）
  const swMaxR  = getSwMaxR(player.hp);
  const swLabel = swMaxR === T * 8 ? '💥💥💥' : swMaxR === T * 6.5 ? '💥💥' : '💥';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = ready ? '#FFF' : '#AAA';
  ctx.fillText(ready ? `BLAST ${swLabel}` : 'Charging…', bx - 4, by + barH + 1);

  // 右下：ハイスコア
  ctx.font = `bold ${T * 0.52}px sans-serif`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(`HI 🧀×${highScore}`, BASE - 13, BASE - 11);
  ctx.fillStyle = '#FFD600';
  ctx.fillText(`HI 🧀×${highScore}`, BASE - 14, BASE - 12);
}

// ─── ゴール到達演出 ───────────────────────────────────────────
function drawDelivered() {
  const alpha = deliveredTimer > 20 ? 0.65 : (deliveredTimer / 20) * 0.65;
  ctx.fillStyle = `rgba(0,60,0,${alpha})`; ctx.fillRect(0, 0, BASE, BASE);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = BASE / 2;

  ctx.font = `bold ${T * 1.6}px sans-serif`;
  ctx.fillStyle = '#FFEB3B'; ctx.shadowColor = '#00E676'; ctx.shadowBlur = 18;
  ctx.fillText('🎉 Congratulations!', cx, 210);
  ctx.shadowBlur = 0;

  ctx.font = `bold ${T * 1.0}px sans-serif`;
  ctx.fillStyle = '#A5D6A7';
  ctx.fillText('おめでとう！', cx, 310);
}

// ────────────────────────────────────────────────────────────────
// ■ メインループ
// ────────────────────────────────────────────────────────────────
function loop() {
  rafId = requestAnimationFrame(loop);
  ctx.fillStyle = '#FFF8E1'; ctx.fillRect(0, 0, BASE, BASE);
  if (state === 'gameover') return;

  drawMaze();

  if (state === 'playing') {
    if (player.flash   > 0) player.flash--;
    if (player.dmgCool > 0) player.dmgCool--;
    const { spawnInt } = getDifficulty(score);
    if (--spawnTimer <= 0) { spawnMouse(); spawnTimer = spawnInt; }
    updateMice();
    updateShockwave();
    updateParticles();
    // チーズの回収判定。触れたものから順に消えていく
    for (const c of cheeses) {
      if (c.collected) continue;
      if (Math.hypot(player.x - c.x, player.y - c.y) < PLAYER_R + CHEESE_R) {
        c.collected = true;
        playSound('pickup');
        vibrate(40);
      }
    }

    // 3個すべて集めたらステージクリア
    if (cheeses.every(c => c.collected)) {
      score++;
      deliveredTimer = 110;
      state = 'delivered';
      // ゴール到達：明るく上昇する3音 ＋ 長め1回の振動でクリア感を演出
      playSound('stageclear');
      vibrate(150);
    }
  }

  if (state === 'delivered') {
    updateParticles();
    if (--deliveredTimer <= 0) startStage();
  }

  drawCheeses();
  drawShockwave();
  drawParticles();
  drawMice();
  drawPlayer();

  if (state === 'playing')   drawHUD();
  if (state === 'delivered') { drawHUD(); drawDelivered(); }
}

// ────────────────────────────────────────────────────────────────
// ■ 効果音・バイブレーション
// ────────────────────────────────────────────────────────────────
/**
 * Web Audio API で効果音を再生する
 * AudioContext はひとつだけ生成して使い回す（毎回生成するとブラウザに制限される）
 * suspended 状態のときは resume() の完了を待ってから音を鳴らす
 * エラーが起きても catch してゲームを止めない
 *
 * type:
 *   'stageclear' ステージクリア：ド→ミ→ソと上昇する明るい3音
 *   'damage'    ダメージ：鈍い低周波の矩形波でぶつかった衝撃を表現
 *   'gameover'  ゲームオーバー：重く沈んでいくノコギリ波
 *   'shockwave' 衝撃波発射：ドン！というバスドラムに近い低音
 *   'kill'      ネズミ撃破：軽いポップ音（連発しても耳障りにならない音量）
 */
// navigator.vibrate は PC・iOS では未対応のため安全に呼び出すラッパー
function vibrate(pattern) {
  try { navigator.vibrate?.(pattern); } catch (e) { /* 無視 */ }
}

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

      if (type === 'stageclear') {
        // ド→ミ→ソと音程を上げてクリア感を出す
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.10);
        osc.frequency.setValueAtTime(784, now + 0.20);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);

      } else if (type === 'damage') {
        // 低い矩形波でぶつかった衝撃を表現
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);

      } else if (type === 'gameover') {
        // ノコギリ波で重く沈む低音を作りゲームオーバー感を演出
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);

      } else if (type === 'shockwave') {
        // バスドラムに近いイメージの低い爆発音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

      } else if (type === 'pickup') {
        /* チーズ回収：短く高い2音。拾えたことが一瞬で分かる軽さにする */
        const o = ctx2.createOscillator(), g = ctx2.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, t0);
        o.frequency.setValueAtTime(1320, t0 + 0.07);
        g.gain.setValueAtTime(0.18, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        o.connect(g); g.connect(ctx2.destination);
        o.start(t0); o.stop(t0 + 0.17);

      } else if (type === 'kill') {
        // 高めの短いポップ音（連発しても耳障りにならない音量・長さ）
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    };

    // コンテキストが停止中なら resume() の完了を待ってから実行する
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(run);
    } else {
      run();
    }

  } catch (e) {
    // 音が出なくてもゲームは止めない
    console.warn('playSound error:', e);
  }
}

// ────────────────────────────────────────────────────────────────
// ■ ボタンイベント
// ────────────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => startGame());
btnRetry.addEventListener('click', () => startGame());
btnTop.addEventListener('click',   () => showScreen('top'));

// ────────────────────────────────────────────────────────────────
// ■ 初期化
// ────────────────────────────────────────────────────────────────
updateTopHighscoreUI();
showScreen('top');
