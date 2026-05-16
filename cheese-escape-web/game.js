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
const CHEESE_R   = T * 0.44;
const MOUSE_R    = T * 0.33;
const MOUSE_SPD  = 1.05;
const SW_EXPAND  = 7;
const SW_COOL    = 180;
const DMG_COOL   = 60;
const MOVE_STEPS = 4;

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
// ■ ゲーム状態変数
// ────────────────────────────────────────────────────────────────
let state          = 'playing';
let score          = 0;
let highScore      = parseInt(localStorage.getItem('cheeseEscape_hi') || '0', 10);
let isNewRecord    = false;
let deliveredTimer = 0;
let grid           = [];
let cheese         = { x: 0, y: 0, hp: 3, flash: 0, dmgCool: 0 };
let mice           = [];
let particles      = [];
let shockwave      = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
let goal           = { x: 0, y: 0 };
let spawnTimer     = 0;
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
  cheese.hp = 3;
  startStage();
  showScreen('game');
  if (!loopRunning) { loopRunning = true; loop(); }
}

function startStage() {
  buildMaze();
  const prevHp = cheese.hp > 0 ? cheese.hp : 3;
  cheese    = { x: T * 2, y: T * 2, hp: prevHp, flash: 0, dmgCool: 0 };
  goal      = { x: (5 * 3 + 2) * T, y: (5 * 3 + 2) * T };
  mice      = [];
  particles = [];
  shockwave = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
  const { spawnInt } = getDifficulty(score);
  spawnTimer = spawnInt;
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
    localStorage.setItem('cheeseEscape_hi', highScore);
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
    if (Math.hypot(mx - cheese.x, my - cheese.y) < T * 5) continue;
    mice.push({ x: mx, y: my, vx: 0, vy: 0, kb: 0 });
    break;
  }
}

function updateMice() {
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    if (m.kb > 0) {
      const moved = slideMove(m.x, m.y, m.vx, m.vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx *= 0.82; m.vy *= 0.82;
      m.kb--;
    } else {
      const dx = cheese.x - m.x, dy = cheese.y - m.y;
      const jitter = (Math.random() - 0.5) * 1.0;
      const angle  = Math.atan2(dy, dx) + jitter;
      const vx = Math.cos(angle) * MOUSE_SPD;
      const vy = Math.sin(angle) * MOUSE_SPD;
      const moved = slideMove(m.x, m.y, vx, vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx = vx; m.vy = vy;
    }
    if (Math.hypot(m.x - cheese.x, m.y - cheese.y) < CHEESE_R + MOUSE_R && cheese.dmgCool === 0) {
      cheese.hp--;
      cheese.flash   = 30;
      cheese.dmgCool = DMG_COOL;
      // ダメージ：鈍い衝撃音 ＋ 短く2回振動
      playSound('damage');
      vibrate([80, 40, 80]);
      if (cheese.hp <= 0) { state = 'gameover'; triggerGameOver(); }
    }
  }
}

// ────────────────────────────────────────────────────────────────
// ■ 衝撃波
// ────────────────────────────────────────────────────────────────
function fireShockwave(x, y) {
  if (shockwave.cool > 0) return;
  const swMaxR = getSwMaxR(cheese.hp);
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
  if (shockwave.r >= getSwMaxR(cheese.hp)) shockwave.active = false;
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
  const moved = slideMove(cheese.x, cheese.y, dx, dy, CHEESE_R);
  cheese.x = moved.x; cheese.y = moved.y;
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
  const moved = slideMove(cheese.x, cheese.y, dx, dy, CHEESE_R);
  cheese.x = moved.x; cheese.y = moved.y;
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

function drawGoal() {
  const { x, y } = goal, r = T * 1.0;
  ctx.beginPath(); ctx.ellipse(x, y + T * 0.15, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8D6E63'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.72, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3E2723'; ctx.fill();
  ctx.font = `bold ${T * 0.6}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🏁', x, y - T * 0.55);
}

function drawCheese() {
  const { x, y, hp, flash } = cheese;
  ctx.save();
  if (flash > 0) ctx.globalAlpha = Math.abs(Math.sin(flash * 0.35)) * 0.8 + 0.2;
  const colors = ['#FF5722', '#FFA726', '#FFD600'];
  const col = colors[Math.max(0, hp - 1)];
  ctx.beginPath();
  ctx.moveTo(x, y - CHEESE_R * 1.2);
  ctx.lineTo(x + CHEESE_R * 1.2, y + CHEESE_R * 0.8);
  ctx.lineTo(x - CHEESE_R * 1.2, y + CHEESE_R * 0.8);
  ctx.closePath();
  ctx.fillStyle = col; ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#795548';
  const holes = [[x - 3, y + 4], [x + 6, y - 2], [x + 1, y + 10]];
  for (let i = 0; i < hp; i++) {
    ctx.beginPath(); ctx.arc(holes[i][0], holes[i][1], 3, 0, Math.PI * 2); ctx.fill();
  }
  if (hp <= 2) {
    ctx.beginPath();
    ctx.moveTo(x - CHEESE_R * 0.5, y + CHEESE_R * 0.8);
    ctx.lineTo(x - CHEESE_R * 0.1, y + CHEESE_R * 0.3);
    ctx.lineTo(x + CHEESE_R * 0.3, y + CHEESE_R * 0.8);
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (hp <= 1) {
    ctx.beginPath();
    ctx.moveTo(x + CHEESE_R * 0.1, y + CHEESE_R * 0.8);
    ctx.lineTo(x + CHEESE_R * 0.5, y + CHEESE_R * 0.25);
    ctx.lineTo(x + CHEESE_R * 0.9, y + CHEESE_R * 0.8);
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

function drawMice() {
  for (const m of mice) {
    const { x, y } = m, r = MOUSE_R;
    const angle = Math.atan2(cheese.y - y, cheese.x - x);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.4, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#9E9E9E'; ctx.strokeStyle = '#616161'; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.2, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = '#BDBDBD'; ctx.fill(); ctx.stroke();
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
  const swMaxR   = getSwMaxR(cheese.hp);
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
    ctx.fillStyle   = i < cheese.hp ? '#FFD600' : '#444';
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 1.2;
    ctx.fill(); ctx.stroke();
  }

  // 左上：スコア
  ctx.font = `bold ${T * 0.62}px sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(`🧀 ×${score}`, 89, iconY + 1);
  ctx.fillStyle = '#FFD600';
  ctx.fillText(`🧀 ×${score}`, 88, iconY);

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
  const swMaxR  = getSwMaxR(cheese.hp);
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
    if (cheese.flash   > 0) cheese.flash--;
    if (cheese.dmgCool > 0) cheese.dmgCool--;
    const { spawnInt } = getDifficulty(score);
    if (--spawnTimer <= 0) { spawnMouse(); spawnTimer = spawnInt; }
    updateMice();
    updateShockwave();
    updateParticles();
    if (Math.hypot(cheese.x - goal.x, cheese.y - goal.y) < T * 1.3) {
      score++;
      deliveredTimer = 110;
      state = 'delivered';
      // ゴール到達：明るく上昇する3音 ＋ 長め1回の振動でクリア感を演出
      playSound('goal');
      vibrate(150);
    }
  }

  if (state === 'delivered') {
    updateParticles();
    if (--deliveredTimer <= 0) startStage();
  }

  drawGoal();
  drawShockwave();
  drawParticles();
  drawMice();
  drawCheese();

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
 *   'goal'      ゴール到達：ド→ミ→ソと上昇する明るい3音
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

      if (type === 'goal') {
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
