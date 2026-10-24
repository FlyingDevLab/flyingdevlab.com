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
const SW_CHARGE  = 180;   // 1発たまるまでのフレーム数（60fps なので3秒）

/*
 * ためておける衝撃波の数は、残りライフで変わる。
 *
 * ★ なぜ追い詰められるほど強くするのか ★
 *   ライフが減るほど不利になるだけだと、一度崩れたら立て直せない。
 *   「追い詰められているときほど強く撃てる」という逆転の目を残すと、
 *   最後まであきらめずに済む。
 *   衝撃波の届く距離（SW_RANGE_BY_HP）が HP で変わるのも同じ考え方で、
 *   こちらは iOS 版の swMaxStockByHp を移植したもの。
 */
function swMaxStockByHp(hp) {
  if (hp >= 3) return 1;
  if (hp === 2) return 2;
  return 3;
}
const DMG_COOL   = 60;

/*
 * ── レーザー ────────────────────────────────────────────────
 * iOS アプリから移植。
 *
 * 以前はタップした場所にいきなり衝撃波が出ていた。撃った本人と
 * 爆発のあいだに何の関係もなく、「自分が撃った」感じが薄かった。
 * プレイヤーからタップ地点へ光線が伸び、その通り道にいる敵を倒し、
 * 届いた先で衝撃波がはじける形にする。
 *
 * 射線を意識する遊びが増える。並んでいる敵はまとめて倒せるし、
 * 壁ぎわに隠れている敵には当たらない。
 */
const LASER_TRAVEL = 6;          // タップ地点まで届くフレーム数（60fps なので 0.1秒）
const LASER_FADE   = 12;         // 届いてから消えるまでのフレーム数（0.2秒）
const LASER_HALF_W = T * 0.15;   // 光線の太さの半分。当たり判定にも使う
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
/*
 * 難易度は「クリアしたステージ数」で決める。得点（チーズの数）ではない。
 * 得点はチーズ1個ごとに増えるので、そちらを目盛りにすると
 * 3倍の速さで難しくなってしまう。
 */
function getDifficulty(stage) {
  const maxMice  = Math.max(2, stage * 2);
  const spawnInt = stage >= 6 ? 120
                 : stage >= 4 ? 150
                 : stage >= 2 ? 180
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
/* 得点。チーズを1個とるごとに 1 増える */
let score          = 0;
/*
 * クリアしたステージ数。難易度の目盛りとして使う。
 *
 * ★ なぜ score と分けているのか ★
 *   以前は score がステージ数そのもので、得点と難易度を1つの数で
 *   兼ねていた。チーズ1個ごとに得点する形へ変えたので、そのままだと
 *   難易度が3倍の速さで上がり、6ステージ目の難しさが2ステージ目で
 *   来てしまう。難易度はステージ数で測り続ける。
 */
let stage          = 0;
let highScore      = loadHighScore();  // 変更: 直接呼び出しをやめ、try/catch 付きヘルパー経由に
let isNewRecord    = false;
let deliveredTimer = 0;
let grid           = [];
let player         = { x: 0, y: 0, hp: 3, flash: 0, dmgCool: 0, angle: 0 };
let mice           = [];
let particles      = [];
/*
 * 広がっている最中の衝撃波。続けて撃つと複数が同時に広がりうるので配列。
 * （以前は1つしか持てず、2発目を撃つと1発目が消えていた）
 */
let shockwaves     = [];
let swStock        = 0;   // いま撃てる数
let swCharge       = 0;   // 次の1発がたまるまでの進み具合（0〜SW_CHARGE）
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
let lasers         = [];   // 飛んでいる最中のレーザー
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
  stage = 0;
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
  lasers    = [];
  /* ステージが始まったらすぐ撃てるよう、ためられるだけためた状態にする */
  shockwaves = [];
  swStock    = swMaxStockByHp(prevHp);
  swCharge   = 0;
  const { spawnInt } = getDifficulty(stage);
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
  const { maxMice } = getDifficulty(stage);
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
      spotted: 0,        // 変身した直後の閃光（フレーム数）
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
/**
 * (ax,ay) から (bx,by) まで、壁にさえぎられずに見通せるか。
 *
 * 線の上を細かく刻んで、どこか1点でも壁の上に乗ったら「見えない」と判定する。
 * 刻み幅はタイルの 1/4。これより粗いと、斜めに走る線が壁の角をすり抜けて、
 * 見えないはずの相手が見えたことになってしまう。
 */
function hasLineOfSight(ax, ay, bx, by) {
  const dist  = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / (T * 0.25)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (!isPath(Math.floor(x / T), Math.floor(y / T))) return false;
  }
  return true;
}

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
      /*
       * 赤・青：壁に沿って巡回する。プレイヤーは追わない。
       *
       * ただし、壁にさえぎられない一直線でプレイヤーを捉えたら、
       * その場で灰色（追跡型）に変身する。一度見つかったら元には戻らない。
       *
       * ★ なぜ変身させるのか ★
       *   巡回型は追ってこないぶん、プレイヤーは油断できてしまう。
       *   「見通しの利く通路に不用意に出ると追われる」という規則を足すと、
       *   どの道を通るかそのものが駆け引きになる。
       *   曲がり角から様子をうかがう、という遊び方が生まれる。
       */
      if (hasLineOfSight(m.x, m.y, player.x, player.y)) {
        m.kind    = 'chaser';
        m.spotted = 14;        // 変身の閃光を出すフレーム数
        playSound('spot');
      } else {
        updateWallFollower(m);
      }
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

    if (m.spotted > 0) m.spotted--;   // 変身の閃光

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
/**
 * タップされた場所へレーザーを撃つ。
 *
 * 変更: 以前はここで直接ドカンと衝撃波を起こしていたが、
 * プレイヤーからレーザーを飛ばし、届いた先で衝撃波を起こす形にした。
 * 爆発そのものは explodeShockwave に分けてある。
 */
function fireShockwave(x, y) {
  if (swStock <= 0) return;   // たまっていなければ撃てない
  lasers.push({
    fromX: player.x, fromY: player.y,   // 撃った瞬間の位置で固定する
    toX: x, toY: y,
    tip: 0,        // 先っぽの進み具合（0=根元 → 1=到達）
    fade: 0,       // 届いたあと、消えるまでの残りフレーム
    didKill: false // このレーザーで1匹でも倒したか（撃破音を1回だけ鳴らすため）
  });
  swStock--;   // 1発消費する
  playSound('shot');
  vibrate(40);
}

/**
 * 指定した場所で衝撃波をはじけさせる。近い敵は倒し、外側は吹き飛ばす。
 * @returns {boolean} 1匹でも倒したか
 */
function explodeShockwave(x, y) {
  const swMaxR = getSwMaxR(player.hp);
  const killR  = swMaxR * 0.55;
  shockwaves.push({ r: 5, cx: x, cy: y });
  // 衝撃波：ドン！という爆発音 ＋ 短い振動
  playSound('shockwave');
  vibrate(60);
  let didKill = false;
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    const d = Math.hypot(m.x - x, m.y - y);
    if (d > swMaxR) continue;
    if (d < killR) {
      spawnParticles(m.x, m.y);
      mice.splice(i, 1);
      didKill = true;
    } else {
      const angle = Math.atan2(m.y - y, m.x - x);
      const force = (1 - d / swMaxR) * 14;
      m.vx = Math.cos(angle) * force;
      m.vy = Math.sin(angle) * force;
      m.kb = 22;
    }
  }
  return didKill;
}

/**
 * 点(px,py) から線分(ax,ay)-(bx,by) までの、いちばん近い距離。
 *
 * ★ 考え方 ★
 *   線分の上を 0.0（a側）〜1.0（b側）の割合 t で表し、
 *   点にいちばん近い t を求める。t が 0 未満や 1 超のときは
 *   線分の外なので、端（a か b）までの距離になる。
 */
function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);   // 長さ0なら点との距離
  const t = Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / len2));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

/**
 * 飛んでいるレーザーを1フレームぶん進める。
 * 通り道にいる敵を倒し、届いたらそこで衝撃波をはじけさせる。
 */
function updateLasers() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const L = lasers[i];

    if (L.tip < 1) {
      // ── 飛んでいる途中 ──
      const before = L.tip;
      L.tip = Math.min(1, before + 1 / LASER_TRAVEL);

      if (state === 'playing') {
        /*
         * このフレームで先っぽが通った区間（before → tip）だけを調べる。
         * 根元から先っぽまで全部を毎フレーム調べると、
         * まだ届いていない先の敵まで倒してしまう。
         */
        const dx = L.toX - L.fromX, dy = L.toY - L.fromY;
        const ax = L.fromX + dx * before, ay = L.fromY + dy * before;
        const bx = L.fromX + dx * L.tip,  by = L.fromY + dy * L.tip;
        const hitR = LASER_HALF_W + MOUSE_R;

        for (let k = mice.length - 1; k >= 0; k--) {
          const m = mice[k];
          if (distToSegment(m.x, m.y, ax, ay, bx, by) < hitR) {
            spawnParticles(m.x, m.y);
            mice.splice(k, 1);
            L.didKill = true;
          }
        }

        // 届いた：その場で衝撃波
        if (L.tip >= 1 && explodeShockwave(L.toX, L.toY)) L.didKill = true;
      }

      if (L.tip >= 1) {
        L.fade = LASER_FADE;
        /*
         * 撃破音は、このレーザーで1匹でも倒したときに1回だけ鳴らす。
         * 倒すたびに鳴らすと、連続した音が互いを打ち消して
         * 結局1回ぶんしか聞こえない（iOS 版と同じ理由）。
         */
        if (L.didKill) playSound('kill');
      }

    } else {
      // ── 届いたあと、だんだん消える ──
      L.fade--;
      if (L.fade <= 0) lasers.splice(i, 1);
    }
  }
}

function updateShockwave() {
  // ためる：ためられる数に届いていなければ、ためていく
  const maxStock = swMaxStockByHp(player.hp);
  if (swStock < maxStock) {
    swCharge++;
    if (swCharge >= SW_CHARGE) { swStock++; swCharge = 0; }
  } else {
    swCharge = 0;
  }

  // 広がっている衝撃波を進める。最大まで広がったものから消す
  const maxR = getSwMaxR(player.hp);
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].r += SW_EXPAND;
    if (shockwaves[i].r >= maxR) shockwaves.splice(i, 1);
  }
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
/*
 * 変更: HP に応じて体の色を変えるのをやめた。
 * 残りライフは画面上部の ❤️ / 💔 で示している。
 * 同じことを2か所で表すと、どちらを見ればよいか迷う。
 * プレイヤーは常に白ネズミとして描く。
 */
const PLAYER_COLOR = { body: '#FFFFFF', line: '#8D6E63', head: '#FAFAFA' };

function drawPlayer() {
  const { x, y, flash, angle } = player;
  const col = PLAYER_COLOR;
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

    // 変身した直後は白い輪を広げて「見つかった」ことを伝える
    if (m.spotted > 0) {
      const t = 1 - m.spotted / 14;
      ctx.beginPath();
      ctx.arc(x, y, r * (1.2 + t * 2.2), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${(1 - t) * 0.9})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

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

/*
 * 飛んでいるレーザーを描く。
 *
 * 先っぽ（tip）までの線を引くだけだが、2本重ねている。
 *   太く半透明の線 … 光のにじみ
 *   細く明るい線   … 芯
 * canvas には発光の機能がないので、重ね方で「光っている」ように見せる。
 */
function drawLasers() {
  for (const L of lasers) {
    // 届いたあとは fade に合わせて薄くする
    const alpha = L.tip < 1 ? 1 : Math.max(0, L.fade / LASER_FADE);
    if (alpha <= 0) continue;

    const ex = L.fromX + (L.toX - L.fromX) * L.tip;
    const ey = L.fromY + (L.toY - L.fromY) * L.tip;

    ctx.save();
    ctx.lineCap = 'round';

    // にじみ
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = LASER_HALF_W * 2.6;
    ctx.beginPath(); ctx.moveTo(L.fromX, L.fromY); ctx.lineTo(ex, ey); ctx.stroke();

    // 芯
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#FFF9C4';
    ctx.lineWidth = LASER_HALF_W;
    ctx.beginPath(); ctx.moveTo(L.fromX, L.fromY); ctx.lineTo(ex, ey); ctx.stroke();

    ctx.restore();
  }
}

/* 広がっている衝撃波をすべて描く（同時に複数ありうる） */
function drawShockwave() {
  const swMaxR = getSwMaxR(player.hp);
  for (const { r, cx, cy } of shockwaves) {
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
}

function drawParticles() {
  for (const p of particles) {
    const a = p.life / p.maxLife;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4 * a, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,50,${a})`; ctx.fill();
  }
}

// ─── HUD ─────────────────────────────────────────────────────
/*
 * 画面上下の帯を更新する。
 *
 * 変更: 以前は canvas の中に ctx.fillText で描いていた（drawHUD）。
 * iOS アプリと同じく盤面の外の HTML に移した。理由は style.css 側に書いた。
 *
 * ここは毎フレーム呼ばれるので、値が変わったときだけ DOM を書き換える。
 * 同じ文字列を毎フレーム代入しても結果は同じだが、無駄な処理になる。
 */
let hudCache = { lives: null, score: null, stock: null, ready: null, gauge: null };

function updateHud() {
  // ライフ：残りは ❤️、失ったぶんは 💔
  const lives = '❤️'.repeat(Math.max(0, player.hp)) + '💔'.repeat(Math.max(0, 3 - player.hp));
  if (lives !== hudCache.lives) {
    hudCache.lives = lives;
    const el = document.getElementById('mazeLives');
    if (el) {
      el.textContent = lives;
      el.setAttribute('aria-label', `${Math.max(0, player.hp)} / 3`);
    }
  }

  // スコア（集めたチーズの数 ＝ クリアしたステージ数）
  const sc = `🧀 × ${score}`;
  if (sc !== hudCache.score) {
    hudCache.score = sc;
    const el = document.getElementById('mazeScore');
    if (el) el.textContent = sc;
  }

  // 下の帯：撃てる数と、次の1発のチャージ具合
  const maxStock = swMaxStockByHp(player.hp);
  const ready    = swStock > 0;
  const stock    = '💥'.repeat(Math.max(1, swStock));   // 0発のときも薄く1つ出す
  const progress = swStock >= maxStock ? 1 : swCharge / SW_CHARGE;

  if (stock !== hudCache.stock) {
    hudCache.stock = stock;
    const el = document.getElementById('mazeBlastStock');
    if (el) el.textContent = stock;
  }
  if (ready !== hudCache.ready) {
    hudCache.ready = ready;
    const bar = document.querySelector('.maze-bar--bottom');
    if (bar) bar.classList.toggle('is-ready', ready);
    const label = document.getElementById('mazeBlastLabel');
    if (label) label.textContent = ready ? 'TAP TO BLAST!' : 'Charging…';
  }

  // ゲージは 1% 刻みでだけ書き換える（毎フレームの微差は目に見えない）
  const pct = Math.round(progress * 100);
  if (pct !== hudCache.gauge) {
    hudCache.gauge = pct;
    const fill = document.getElementById('mazeGaugeFill');
    if (fill) fill.style.transform = `scaleX(${progress})`;
    const g = document.getElementById('mazeGauge');
    if (g) g.setAttribute('aria-valuenow', pct);
  }
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
    const { spawnInt } = getDifficulty(stage);
    if (--spawnTimer <= 0) { spawnMouse(); spawnTimer = spawnInt; }
    updateMice();
    updateLasers();     // 敵を倒しうるので、敵の更新のあとに置く
    updateShockwave();
    updateParticles();
    // チーズの回収判定。触れたものから順に消えていく
    for (const c of cheeses) {
      if (c.collected) continue;
      if (Math.hypot(player.x - c.x, player.y - c.y) < PLAYER_R + CHEESE_R) {
        c.collected = true;
        // 1個とるごとに得点する。
        // 以前はステージを全部そろえたときにまとめて 1 点だったが、
        // 3個目に届く前にやられると、それまで歩いた分が何も残らなかった。
        score++;
        playSound('pickup');
        vibrate(40);
      }
    }

    // 3個すべて集めたらステージクリア
    if (cheeses.every(c => c.collected)) {
      // 得点はチーズを取ったときに入っているので、ここでは加点しない。
      // 増やすのは難易度の目盛りだけ。
      stage++;
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
  drawLasers();
  drawShockwave();
  drawParticles();
  drawMice();
  drawPlayer();

  if (state === 'playing')   updateHud();
  if (state === 'delivered') { updateHud(); drawDelivered(); }
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

      } else if (type === 'spot') {
        /* 見つかった：短く鋭い2音を上げる。「気づかれた」緊張を伝える */
        const o = ctx2.createOscillator(), g = ctx2.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(520, t0);
        o.frequency.setValueAtTime(780, t0 + 0.06);
        g.gain.setValueAtTime(0.16, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
        o.connect(g); g.connect(ctx2.destination);
        o.start(t0); o.stop(t0 + 0.19);

      } else if (type === 'shot') {
        /* レーザー発射：高いところから一瞬で落ちる短い音。
           爆発音より軽くして、発射と着弾を聞き分けられるようにする */
        const o = ctx2.createOscillator(), g = ctx2.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1400, t0);
        o.frequency.exponentialRampToValueAtTime(420, t0 + 0.09);
        g.gain.setValueAtTime(0.12, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
        o.connect(g); g.connect(ctx2.destination);
        o.start(t0); o.stop(t0 + 0.11);

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
