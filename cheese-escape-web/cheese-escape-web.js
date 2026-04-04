// ===== Cheese Escape / チーズエスケープ script.js =====

// ─── 固定定数 ────────────────────────────────────────────
const BASE       = 570;          // キャンバスの論理サイズ（px）。CSS側でスケールして表示サイズを変える
const MC         = 6;            // 迷路のセル数（MC×MC の格子 = 6×6）
const GW         = MC * 3 + 1;  // タイルグリッド幅 = 19（セル2px＋壁1px×6 ＋ 外周1px）
const T          = BASE / GW;   // タイルサイズ ≈ 30px
const CHEESE_R   = T * 0.44;    // チーズの衝突判定半径（タイルの44%）
const MOUSE_R    = T * 0.33;    // ネズミの衝突判定半径（タイルの33%）
const MOUSE_SPD  = 1.05;        // ネズミの移動速度は固定（px/フレーム）
const SW_EXPAND  = 7;           // 衝撃波が1フレームで広がるピクセル数
const SW_COOL    = 180;         // 衝撃波のチャージ時間 ≈ 3s（60fps × 3）
const DMG_COOL   = 60;          // ダメージ後の無敵フレーム数（60f ≈ 1秒）
const MOVE_STEPS = 4;           // 移動をサブステップに分割して壁すり抜けを防ぐ

// HP別 衝撃波最大半径（HPが低いほど広くなり、ピンチを逆転しやすくする設計）
const SW_RANGE_BY_HP = [
  T * 8,    // HP1: 240px（ピンチほど広い）
  T * 6.5,  // HP2: 195px
  T * 5     // HP3: 150px（通常）
];

// 難易度計算
// 最大ネズミ数: スコア×2（最低2匹）
// 出現間隔: スコアに応じて短縮、最速120f
function getDifficulty(score) {
  const maxMice  = Math.max(2, score * 2);
  const spawnInt = score >= 6 ? 120
                 : score >= 4 ? 150
                 : score >= 2 ? 180
                 : 210;
  return { maxMice, spawnInt };
}

/**
 * 現在のHPに対応する衝撃波最大半径を返す
 * HP値を0〜2のインデックスにクランプしてSW_RANGE_BY_HPを参照する
 */
function getSwMaxR(hp) {
  return SW_RANGE_BY_HP[Math.max(0, Math.min(2, hp - 1))];
}

// ─── Flying Dev Lab リンクボタン ─────────────────────────
const FDL_URL = 'https://flyingdevlab.com/';

// タイトル・ゲームオーバー共通のボタン矩形（描画＆判定で共用）
function fdlBtnRect(screenState) {
  const cx = BASE / 2;
  if (screenState === 'title')    return { x: cx - 120, y: 497, w: 240, h: 46 };
  if (screenState === 'gameover') return { x: cx - 120, y: BASE/2 + T * 4.6, w: 240, h: 46 };
  return null;
}

function drawFdlBtn(screenState) {
  const r = fdlBtnRect(screenState);
  if (!r) return;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 19); ctx.fill(); ctx.stroke();
  ctx.font = `bold ${T * 0.52}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('🏠 Flying Dev Lab', BASE / 2, r.y + r.h / 2);
}

function hitFdlBtn(px, py, screenState) {
  const r = fdlBtnRect(screenState);
  if (!r) return false;
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}


const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── ゲーム状態 ─────────────────────────────────────────
// 'title' | 'playing' | 'delivered' | 'gameover'
let state          = 'title';
let score          = 0;
let highScore      = parseInt(localStorage.getItem("cheeseEscape_hi") || "0", 10);
let isNewRecord    = false;
let deliveredTimer = 0; // デリバリー演出の残りフレーム数

let grid      = [];
let cheese    = { x: 0, y: 0, hp: 3, flash: 0, dmgCool: 0 };
let mice      = [];
let particles = [];
let shockwave = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
let goal      = { x: 0, y: 0 };
let spawnTimer = 0; // 次のネズミ出現までのカウントダウン

// 入力：ドラッグ状態・前フレーム座標・移動累積距離
let drag = false, lastMX = 0, lastMY = 0, dragDist = 0;
let downPos = { x: 0, y: 0 }; // mousedown/touchstart の座標（衝撃波の発動点）

// ─── 迷路生成 (Recursive Backtracker) ───────────────────
function buildMaze() {
  grid = Array.from({ length: GW }, () => new Array(GW).fill(0));
  const visited = Array.from({ length: MC }, () => new Array(MC).fill(false));

  /* セル(cx, cy)に対応する2×2タイルを通路として開く */
  function openCell(cx, cy) {
    const tx = cx * 3 + 1, ty = cy * 3 + 1;
    grid[ty][tx] = grid[ty][tx+1] = grid[ty+1][tx] = grid[ty+1][tx+1] = 1;
  }
  /* 隣接セル(nx, ny)との境界にある壁タイルを通路として開く */
  function openWall(cx, cy, nx, ny) {
    const tx = cx * 3 + 1, ty = cy * 3 + 1;
    const dx = nx - cx, dy = ny - cy;
    if      (dx ===  1) { grid[ty][cx*3+3] = grid[ty+1][cx*3+3] = 1; }
    else if (dx === -1) { grid[ty][cx*3]   = grid[ty+1][cx*3]   = 1; }
    else if (dy ===  1) { grid[cy*3+3][tx] = grid[cy*3+3][tx+1] = 1; }
    else if (dy === -1) { grid[cy*3][tx]   = grid[cy*3][tx+1]   = 1; }
  }
  /* 再帰的深さ優先探索（ランダム順）で全セルを接続し、完全迷路を生成する */
  function dfs(cx, cy) {
    visited[cy][cx] = true;
    openCell(cx, cy);
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]]
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

// ─── 壁衝突判定 ─────────────────────────────────────────
// AABBで候補タイルを絞り、各タイルとの最近点距離で円との衝突を判定する
function hitsWall(px, py, r) {
  const x0 = Math.max(0, Math.floor((px - r) / T));
  const x1 = Math.min(GW - 1, Math.floor((px + r) / T));
  const y0 = Math.max(0, Math.floor((py - r) / T));
  const y1 = Math.min(GW - 1, Math.floor((py + r) / T));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (grid[ty][tx] === 1) continue; // 通路タイルはスキップ
      const nearX = Math.max(tx*T, Math.min(px, (tx+1)*T));
      const nearY = Math.max(ty*T, Math.min(py, (ty+1)*T));
      if ((px-nearX)**2 + (py-nearY)**2 < r*r) return true;
    }
  }
  return false;
}

// ─── 押し出し ────────────────────────────────────────────
// 壁にめり込んだオブジェクトを、貫通量（r-d）分だけ外に押し戻すベクトルを累算して返す
function pushOut(px, py, r) {
  const x0 = Math.max(0, Math.floor((px-r)/T));
  const x1 = Math.min(GW-1, Math.floor((px+r)/T));
  const y0 = Math.max(0, Math.floor((py-r)/T));
  const y1 = Math.min(GW-1, Math.floor((py+r)/T));
  let outX = 0, outY = 0;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (grid[ty][tx] === 1) continue;
      const nearX = Math.max(tx*T, Math.min(px, (tx+1)*T));
      const nearY = Math.max(ty*T, Math.min(py, (ty+1)*T));
      const dSq = (px-nearX)**2 + (py-nearY)**2;
      if (dSq < r*r && dSq > 0) {
        const d = Math.sqrt(dSq);
        outX += (px-nearX)/d * (r-d);
        outY += (py-nearY)/d * (r-d);
      } else if (dSq === 0) { outX += r; }
    }
  }
  return { x: px+outX, y: py+outY };
}

// ─── マルチステップ移動 ──────────────────────────────────
// 移動をMOVE_STEPSに分割し、X軸・Y軸を独立に試みることで壁沿いのスライドを実現する
function slideMove(ox, oy, totalDx, totalDy, r) {
  let cx = ox, cy = oy;
  const sx = totalDx / MOVE_STEPS, sy = totalDy / MOVE_STEPS;
  for (let i = 0; i < MOVE_STEPS; i++) {
    const nx = cx + sx, ny = cy + sy;
    if      (!hitsWall(nx, ny, r)) { cx = nx; cy = ny; }   // XY両方移動できる
    else if (!hitsWall(nx, cy, r)) { cx = nx; }             // X軸のみ移動（壁沿いスライド）
    else if (!hitsWall(cx, ny, r)) { cy = ny; }             // Y軸のみ移動（壁沿いスライド）
    const po = pushOut(cx, cy, r);
    cx = po.x; cy = po.y;
  }
  return { x: cx, y: cy };
}

// ─── ゲーム開始（フルリセット） ──────────────────────────
function startGame() {
  score = 0;
  startStage();
}

// ─── ステージ開始（スコア継続） ──────────────────────────
function startStage() {
  buildMaze();
  const prevHp = cheese.hp > 0 ? cheese.hp : 3; // HPを前ステージから引き継ぐ（0以下なら3に戻す）
  cheese    = { x: T*2, y: T*2, hp: prevHp, flash: 0, dmgCool: 0 };
  goal      = { x: (5*3+2)*T, y: (5*3+2)*T }; // ゴールは迷路右下セルの中心
  mice      = [];
  particles = [];
  shockwave = { active: false, r: 0, cool: 0, cx: 0, cy: 0 };
  const { spawnInt } = getDifficulty(score);
  spawnTimer = spawnInt;
  drag       = false;
  state      = 'playing';
}

// ─── ネズミ生成 ──────────────────────────────────────────
// 最大200回試行してランダムな通路タイルを選び、チーズから十分離れた位置に配置する
function spawnMouse() {
  const { maxMice } = getDifficulty(score);
  if (mice.length >= maxMice) return;
  for (let attempts = 0; attempts < 200; attempts++) {
    const tx = Math.floor(Math.random() * GW);
    const ty = Math.floor(Math.random() * GW);
    if (grid[ty][tx] !== 1) continue; // 壁タイルはスキップ
    const mx = (tx+0.5)*T, my = (ty+0.5)*T;
    if (Math.hypot(mx-cheese.x, my-cheese.y) < T*5) continue; // チーズに近すぎる場合もスキップ
    mice.push({ x: mx, y: my, vx: 0, vy: 0, kb: 0 });
    break;
  }
}

// ─── ネズミ更新 ──────────────────────────────────────────
function updateMice() {
  // 末尾からループすることで splice による添字ずれを防ぐ
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    if (m.kb > 0) {
      // ノックバック中：kb フレームだけ惰性移動し、速度を減衰させる
      const moved = slideMove(m.x, m.y, m.vx, m.vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx *= 0.82; m.vy *= 0.82;
      m.kb--;
    } else {
      // 通常時：チーズへ向かって追跡。ジッターで経路をランダム化して挟み込みを自然に見せる
      const dx = cheese.x - m.x, dy = cheese.y - m.y;
      const jitter = (Math.random() - 0.5) * 1.0;
      const angle  = Math.atan2(dy, dx) + jitter;
      const vx = Math.cos(angle) * MOUSE_SPD;
      const vy = Math.sin(angle) * MOUSE_SPD;
      const moved = slideMove(m.x, m.y, vx, vy, MOUSE_R);
      m.x = moved.x; m.y = moved.y;
      m.vx = vx; m.vy = vy;
    }
    // チーズと接触かつ無敵時間切れならダメージを与える
    if (Math.hypot(m.x-cheese.x, m.y-cheese.y) < CHEESE_R+MOUSE_R && cheese.dmgCool === 0) {
      cheese.hp--;
      cheese.flash   = 30;
      cheese.dmgCool = DMG_COOL;
      if (cheese.hp <= 0) {
        isNewRecord = score > highScore;
        if (isNewRecord) {
          highScore = score;
          localStorage.setItem("cheeseEscape_hi", highScore);
        }
        state = 'gameover';
      }
    }
  }
}

// ─── 衝撃波発動（タップ座標を中心、HP連動範囲） ──────────
// killR以内のネズミは即消滅、それ以外は中心から離れる向きにノックバックを付与する
function fireShockwave(x, y) {
  if (shockwave.cool > 0) return; // チャージ中は発動不可
  const swMaxR = getSwMaxR(cheese.hp);
  const killR  = swMaxR * 0.55; // 最大半径の55%以内は即消滅
  shockwave = { active: true, r: 5, cool: SW_COOL, cx: x, cy: y };
  for (let i = mice.length - 1; i >= 0; i--) {
    const m = mice[i];
    const d = Math.hypot(m.x-x, m.y-y);
    if (d > swMaxR) continue; // 範囲外はスキップ
    if (d < killR) {
      spawnParticles(m.x, m.y);
      mice.splice(i, 1);
    } else {
      // 範囲外縁に近いほど弱いノックバック（線形減衰）
      const angle = Math.atan2(m.y-y, m.x-x);
      const force = (1 - d/swMaxR) * 14;
      m.vx = Math.cos(angle)*force;
      m.vy = Math.sin(angle)*force;
      m.kb = 22;
    }
  }
}

// ─── 衝撃波更新 ──────────────────────────────────────────
// クールダウンのカウントとアクティブ状態の拡大を独立して管理する
function updateShockwave() {
  if (shockwave.cool > 0) shockwave.cool--;
  if (!shockwave.active) return;
  shockwave.r += SW_EXPAND;
  if (shockwave.r >= getSwMaxR(cheese.hp)) shockwave.active = false; // 最大半径に達したら終了
}

// ─── パーティクル ────────────────────────────────────────
// ネズミ消滅時の爆発エフェクト。8方向均等にパーティクルを放出する
function spawnParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (i/8)*Math.PI*2;
    particles.push({ x, y,
      vx: Math.cos(angle)*(2+Math.random()*3),
      vy: Math.sin(angle)*(2+Math.random()*3),
      life: 28, maxLife: 28 });
  }
}
// 末尾から削除して splice による添字ずれを防ぐ
function updateParticles() {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.88; p.vy *= 0.88;
    if (--p.life <= 0) particles.splice(i, 1);
  }
}

// ─── 座標変換 ────────────────────────────────────────────
// CSS表示サイズと論理サイズ570pxのスケール比を算出してクライアント座標を論理座標に変換する
function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = BASE / rect.width;
  return { x: (clientX-rect.left)*scale, y: (clientY-rect.top)*scale };
}

// ─── 入力イベント ────────────────────────────────────────
// タップとドラッグを dragDist（移動累積距離）で区別する
// dragDist < 10（論理px）= タップ → 衝撃波発動
// dragDist >= 10         = ドラッグ → チーズ移動

canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  const p = toLogical(e.clientX, e.clientY);
  if (state === 'title' || state === 'gameover') {
    if (hitFdlBtn(p.x, p.y, state)) { location.href = FDL_URL; return; }
    startGame(); return;
  }
  if (state === 'delivered') return;
  drag = true; dragDist = 0;
  lastMX = p.x; lastMY = p.y;
  downPos = { x: p.x, y: p.y };
});
canvas.addEventListener('mousemove', e => {
  e.preventDefault();
  if (!drag || state !== 'playing') return;
  const p = toLogical(e.clientX, e.clientY);
  const dx = p.x-lastMX, dy = p.y-lastMY;
  dragDist += Math.hypot(dx, dy);
  const moved = slideMove(cheese.x, cheese.y, dx, dy, CHEESE_R);
  cheese.x = moved.x; cheese.y = moved.y;
  lastMX = p.x; lastMY = p.y;
});
canvas.addEventListener('mouseup', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  if (drag && dragDist < 10) fireShockwave(downPos.x, downPos.y); // タップ判定：移動量が小さければ衝撃波
  drag = false;
});
// キャンバス外にカーソルが出たらドラッグ状態を解除する
canvas.addEventListener('mouseleave', () => { drag = false; });

// タッチイベント：{ passive: false } でiOS/Androidの標準スクロールを無効化し preventDefault を有効にする
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === 'title' || state === 'gameover') {
    const t = e.touches[0], p = toLogical(t.clientX, t.clientY);
    if (hitFdlBtn(p.x, p.y, state)) { location.href = FDL_URL; return; }
    startGame(); return;
  }
  if (state === 'delivered') return;
  const t = e.touches[0], p = toLogical(t.clientX, t.clientY);
  drag = true; dragDist = 0;
  lastMX = p.x; lastMY = p.y;
  downPos = { x: p.x, y: p.y };
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!drag || state !== 'playing') return;
  const t = e.touches[0], p = toLogical(t.clientX, t.clientY);
  const dx = p.x-lastMX, dy = p.y-lastMY;
  dragDist += Math.hypot(dx, dy);
  const moved = slideMove(cheese.x, cheese.y, dx, dy, CHEESE_R);
  cheese.x = moved.x; cheese.y = moved.y;
  lastMX = p.x; lastMY = p.y;
}, { passive: false });
canvas.addEventListener('touchend', e => {
  e.preventDefault();
  if (state !== 'playing') return;
  if (drag && dragDist < 10) fireShockwave(downPos.x, downPos.y); // タップ判定
  drag = false;
}, { passive: false });

// ─── 描画：迷路 ──────────────────────────────────────────
// grid[ty][tx] === 0 の箇所が壁タイル。通路（1）はキャンバス背景色がそのまま見える
function drawMaze() {
  ctx.fillStyle = '#5D4037';
  for (let ty = 0; ty < GW; ty++)
    for (let tx = 0; tx < GW; tx++)
      if (grid[ty][tx] === 0) ctx.fillRect(tx*T, ty*T, T, T);
}

// ─── 描画：ゴール ────────────────────────────────────────
function drawGoal() {
  const { x, y } = goal, r = T*1.0;
  // 影（楕円）→ 穴（楕円）→ ゴールフラグ（絵文字）の順で重ねて描く
  ctx.beginPath(); ctx.ellipse(x, y+T*0.15, r, r*0.55, 0, 0, Math.PI*2);
  ctx.fillStyle = '#8D6E63'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, r*0.72, r*0.38, 0, 0, Math.PI*2);
  ctx.fillStyle = '#3E2723'; ctx.fill();
  ctx.font = `bold ${T*0.6}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFEB3B';
  ctx.fillText('🏁', x, y - T*0.55);
}

// ─── 描画：チーズ ────────────────────────────────────────
// HP に応じて色・穴の数・ひびを変えてダメージ状態を視覚化する
function drawCheese() {
  const { x, y, hp, flash } = cheese;
  ctx.save();
  // ダメージフラッシュ中はsinで点滅させる
  if (flash > 0) ctx.globalAlpha = Math.abs(Math.sin(flash*0.35))*0.8+0.2;
  const colors = ['#FF5722','#FFA726','#FFD600']; // HP 1=赤 / 2=橙 / 3=黄
  const col = colors[Math.max(0, hp-1)];
  ctx.beginPath();
  ctx.moveTo(x, y - CHEESE_R*1.2);
  ctx.lineTo(x + CHEESE_R*1.2, y + CHEESE_R*0.8);
  ctx.lineTo(x - CHEESE_R*1.2, y + CHEESE_R*0.8);
  ctx.closePath();
  ctx.fillStyle = col; ctx.strokeStyle = '#795548'; ctx.lineWidth = 2;
  ctx.fill(); ctx.stroke();
  // チーズの穴（残りHPの数だけ描く）
  ctx.fillStyle = '#795548';
  const holes = [[x-3,y+4],[x+6,y-2],[x+1,y+10]];
  for (let i = 0; i < hp; i++) {
    ctx.beginPath(); ctx.arc(holes[i][0], holes[i][1], 3, 0, Math.PI*2); ctx.fill();
  }
  // HP2以下：ひびを追加
  if (hp <= 2) {
    ctx.beginPath();
    ctx.moveTo(x-CHEESE_R*0.5, y+CHEESE_R*0.8);
    ctx.lineTo(x-CHEESE_R*0.1, y+CHEESE_R*0.3);
    ctx.lineTo(x+CHEESE_R*0.3, y+CHEESE_R*0.8);
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 2; ctx.stroke();
  }
  // HP1以下：さらにひびを追加
  if (hp <= 1) {
    ctx.beginPath();
    ctx.moveTo(x+CHEESE_R*0.1, y+CHEESE_R*0.8);
    ctx.lineTo(x+CHEESE_R*0.5, y+CHEESE_R*0.25);
    ctx.lineTo(x+CHEESE_R*0.9, y+CHEESE_R*0.8);
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

// ─── 描画：ネズミ ────────────────────────────────────────
// ネズミを常にチーズの方向へ向けて描く（胴体→頭→耳→目→しっぽの順）
function drawMice() {
  for (const m of mice) {
    const { x, y } = m, r = MOUSE_R;
    const angle = Math.atan2(cheese.y-y, cheese.x-x);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, r*1.4, r*0.9, 0, 0, Math.PI*2);
    ctx.fillStyle = '#9E9E9E'; ctx.strokeStyle = '#616161'; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r*1.2, 0, r*0.75, 0, Math.PI*2);
    ctx.fillStyle = '#BDBDBD'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r*1.0, -r*0.8, r*0.5, 0, Math.PI*2);
    ctx.fillStyle = '#EF9A9A'; ctx.fill();
    ctx.beginPath(); ctx.arc(r*1.0,  r*0.8, r*0.5, 0, Math.PI*2);
    ctx.fillStyle = '#EF9A9A'; ctx.fill();
    ctx.beginPath(); ctx.arc(r*1.7, -r*0.3, r*0.22, 0, Math.PI*2);
    ctx.fillStyle = '#212121'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r*1.4, 0);
    ctx.quadraticCurveTo(-r*2.0, r*1.2, -r*2.5, r*0.4);
    ctx.strokeStyle = '#9E9E9E'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
}

// ─── 描画：衝撃波 ────────────────────────────────────────
// progress（0→1）に応じてアルファと線幅を減衰させ、膨張感を表現する
function drawShockwave() {
  if (!shockwave.active) return;
  const { r, cx, cy } = shockwave;
  const swMaxR   = getSwMaxR(cheese.hp);
  const progress = r / swMaxR;
  const alpha    = (1 - progress) * 0.6;

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = `rgba(255,235,59,${alpha})`;
  ctx.lineWidth   = (1-progress)*10+1;
  ctx.stroke();

  const grd = ctx.createRadialGradient(cx, cy, r*0.2, cx, cy, r);
  grd.addColorStop(0, `rgba(255,255,255,${alpha*0.35})`);
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = grd; ctx.fill();
}

// ─── 描画：パーティクル ──────────────────────────────────
// life/maxLife を不透明度と半径に使い、消滅に向けてフェードアウトさせる
function drawParticles() {
  for (const p of particles) {
    const a = p.life/p.maxLife;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4*a, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,200,50,${a})`; ctx.fill();
  }
}

// ─── 描画：HUD ───────────────────────────────────────────
function drawHUD() {
  // ── 左上：HP ▲ × 3 ──────────────────────────────
  const iconSize = 12, iconY = 20;
  for (let i = 0; i < 3; i++) {
    const cx = 18 + i * (iconSize * 2 + 5);
    ctx.beginPath();
    ctx.moveTo(cx, iconY - iconSize);
    ctx.lineTo(cx + iconSize, iconY + iconSize * 0.65);
    ctx.lineTo(cx - iconSize, iconY + iconSize * 0.65);
    ctx.closePath();
    ctx.fillStyle   = i < cheese.hp ? '#FFD600' : '#444'; // 残りHP分は黄色、失ったHPは暗色
    ctx.strokeStyle = '#795548'; ctx.lineWidth = 1.2;
    ctx.fill(); ctx.stroke();
  }

  // ── 左上：スコア（HPの右隣） ───────────────────────
  // 影を1px右下にずらして重ねることで立体感を出す
  ctx.font = `bold ${T * 0.62}px sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(`🧀 ×${score}`, 89, iconY + 1);
  ctx.fillStyle = '#FFD600';
  ctx.fillText(`🧀 ×${score}`, 88, iconY);

  // ── 右上：衝撃波クールバー ─────────────────────────
  const barW = 90, barH = 9;
  const bx = BASE - barW - 14, by = 15;
  const ready = shockwave.cool === 0;
  const fill  = ready ? 1 : 1 - shockwave.cool / SW_COOL; // チャージ進捗（0〜1）

  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 4); ctx.fill();
  ctx.fillStyle = ready ? '#FFEB3B' : '#FFA726'; // チャージ完了時は黄色、充電中は橙
  if (fill > 0) {
    ctx.beginPath(); ctx.roundRect(bx, by, barW * fill, barH, 4); ctx.fill();
  }

  // バーの上にラベル（HPに連動した衝撃波強度を💥の数で示す）
  const swMaxR  = getSwMaxR(cheese.hp);
  const swLabel = swMaxR === T*8 ? '💥💥💥' : swMaxR === T*6.5 ? '💥💥' : '💥';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = ready ? '#FFF' : '#AAA';
  ctx.fillText(ready ? `BLAST ${swLabel}` : 'Charging…', bx - 4, by + barH + 1);

  // ── 右下：ハイスコア ──────────────────────────────────
  ctx.font = `bold ${T * 0.52}px sans-serif`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(`HI 🧀×${highScore}`, BASE - 13, BASE - 11);
  ctx.fillStyle = '#FFD600';
  ctx.fillText(`HI 🧀×${highScore}`, BASE - 14, BASE - 12);
}

// ─── 描画：タイトル画面 ──────────────────────────────────
function drawTitle() {
  ctx.fillStyle = 'rgba(40,20,0,0.74)'; ctx.fillRect(0, 0, BASE, BASE);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = BASE / 2;

  // タイトル
  ctx.font = `bold ${T * 1.6}px sans-serif`;
  ctx.fillStyle = '#FFD600'; ctx.shadowColor = '#FF6F00'; ctx.shadowBlur = 14;
  ctx.fillText('🧀 Cheese Escape', cx, 100);
  ctx.font = `bold ${T * 0.9}px sans-serif`;
  ctx.fillStyle = '#FFE082'; ctx.shadowBlur = 0;
  ctx.fillText('チーズエスケープ', cx, 148);

  // 区切り線
  ctx.strokeStyle = 'rgba(255,220,100,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 175); ctx.lineTo(BASE - 60, 175); ctx.stroke();

  // 操作説明（英語→日本語の順で並べる）
  ctx.font = `${T * 0.58}px sans-serif`; ctx.fillStyle = '#FFF9C4';
  ctx.fillText('Drag → Move cheese', cx, 210);
  ctx.fillStyle = '#FFCC80';
  ctx.fillText('ドラッグ → チーズを移動', cx, 238);

  ctx.fillStyle = '#FFF9C4';
  ctx.fillText('Tap → Blast wave', cx, 278);
  ctx.fillStyle = '#FFCC80';
  ctx.fillText('タップ → 衝撃波でネズミを倒す', cx, 306);

  // HP ヒント
  ctx.font = `${T * 0.5}px sans-serif`; ctx.fillStyle = 'rgba(255,200,100,0.7)';
  ctx.fillText('💥 Low HP = wider blast!', cx, 348);
  ctx.fillText('HPが低いと衝撃波が広くなる', cx, 372);

  // ハイスコア表示（記録があるときだけ）
  if (highScore > 0) {
    ctx.font = `bold ${T * 0.6}px sans-serif`;
    ctx.fillStyle = '#FFD600';
    ctx.fillText(`🏆 Best: 🧀×${highScore}`, cx, 402);
  }

  // スタートボタン
  ctx.fillStyle = '#FFB300'; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(cx - 120, 432, 240, 52, 26); ctx.fill(); ctx.stroke();
  ctx.font = `bold ${T * 0.7}px sans-serif`; ctx.fillStyle = '#3E2723';
  ctx.fillText('Tap / Click to Start', cx, 458);

  drawFdlBtn('title');
}

// ─── 描画：デリバリー演出 ────────────────────────────────
// deliveredTimer が大きい間は半透明のオーバーレイでフェードインし、祝福メッセージを表示する
function drawDelivered() {
  const alpha = deliveredTimer > 20 ? 0.65 : (deliveredTimer / 20) * 0.65;
  ctx.fillStyle = `rgba(0,60,0,${alpha})`; ctx.fillRect(0, 0, BASE, BASE);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = BASE / 2;

  ctx.font = `bold ${T * 1.6}px sans-serif`;
  ctx.fillStyle = '#FFEB3B'; ctx.shadowColor = '#00E676'; ctx.shadowBlur = 18;
  ctx.fillText('🎉 Congratulations!', cx, 220);
  ctx.shadowBlur = 0;

  ctx.font = `bold ${T * 1.0}px sans-serif`;
  ctx.fillStyle = '#A5D6A7';
  ctx.fillText('おめでとう！', cx, 330);
}

// ─── 描画：ゲームオーバー画面 ────────────────────────────
function drawGameOver() {
  ctx.fillStyle = 'rgba(80,0,0,0.78)'; ctx.fillRect(0, 0, BASE, BASE);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // タイトル
  ctx.font = `bold ${T * 1.3}px sans-serif`;
  ctx.fillStyle = '#FF5252'; ctx.shadowColor = '#FF1744'; ctx.shadowBlur = 14;
  ctx.fillText('😢 Game Over!', BASE/2, BASE/2 - T * 2.0);
  ctx.font = `bold ${T * 0.85}px sans-serif`;
  ctx.fillStyle = '#FFCDD2'; ctx.shadowBlur = 0;
  ctx.fillText('やられた！', BASE/2, BASE/2 - T * 1.0);

  // スコア
  ctx.font = `bold ${T * 1.9}px sans-serif`; ctx.fillStyle = '#FFD600';
  ctx.fillText(`🧀 ×${score}`, BASE/2, BASE/2 + T * 0.6);

  // ハイスコア（新記録時は緑でハイライト）
  ctx.font = `bold ${T * 0.65}px sans-serif`;
  ctx.fillStyle = isNewRecord ? '#69F0AE' : '#FFCC80';
  ctx.fillText(
    isNewRecord ? `🏆 New Record!  HI ×${highScore}` : `HI 🧀×${highScore}`,
    BASE/2, BASE/2 + T * 1.7
  );

  // ボタン
  const btnY = BASE/2 + T * 2.6;
  ctx.fillStyle = '#EF5350'; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(BASE/2 - 110, btnY, 220, 52, 26); ctx.fill(); ctx.stroke();
  ctx.font = `bold ${T * 0.7}px sans-serif`; ctx.fillStyle = '#FFF';
  ctx.fillText('Play Again　/　もう一度', BASE/2, btnY + 26);

  drawFdlBtn('gameover');
}

// ─── メインループ ────────────────────────────────────────
// requestAnimationFrame で毎フレーム呼ばれる。状態に応じて更新・描画を振り分ける
function loop() {
  requestAnimationFrame(loop);

  ctx.fillStyle = '#FFF8E1'; ctx.fillRect(0,0,BASE,BASE); // 背景クリア

  if (state === 'title') { drawTitle(); return; }

  drawMaze();

  if (state === 'playing') {
    if (cheese.flash   > 0) cheese.flash--;
    if (cheese.dmgCool > 0) cheese.dmgCool--;

    const { spawnInt } = getDifficulty(score);
    if (--spawnTimer <= 0) { spawnMouse(); spawnTimer = spawnInt; } // タイマーが切れたらネズミを補充

    updateMice();
    updateShockwave();
    updateParticles();

    // ゴールへの到達判定：一定距離以内でスコア加算・演出へ移行
    if (Math.hypot(cheese.x-goal.x, cheese.y-goal.y) < T*1.3) {
      score++;
      deliveredTimer = 110;
      state = 'delivered';
    }
  }

  if (state === 'delivered') {
    updateParticles();
    if (--deliveredTimer <= 0) startStage(); // 演出が終わったら次ステージへ
  }

  drawGoal();
  drawShockwave();
  drawParticles();
  drawMice();
  drawCheese();

  if (state === 'playing')   drawHUD();
  if (state === 'delivered') { drawHUD(); drawDelivered(); }
  if (state === 'gameover')  drawGameOver();
}

loop();
