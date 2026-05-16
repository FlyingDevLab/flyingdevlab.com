'use strict';
/* ═══════════════════════════════════════════════════════════
   ファイル名  : game.js
   プロジェクト: Pinball | Flying Dev Lab
   概要        : HTML Canvas と Vanilla JS だけで実装した
                 ピンボールの物理エンジン＋描画システム。
                 外部ライブラリは一切使用しない。

   【モジュール構成】
     1.  定数                … 物理・フィールドサイズの固定値
     2.  SF サウンドエンジン … Web Audio API による合成音
     3.  ジオメトリヘルパー  … 座標変換ユーティリティ
     4.  静的ゲームオブジェクト … バンパー/スリング/壁/ターゲット配置
     5.  状態変数            … スコア・ボール・フリッパーの実行時状態
     6.  物理ヘルパー        … 衝突判定と速度解決（反発計算）
     7.  フリッパーユーティリティ … 角度更新と衝突処理
     8.  ゲームループ        … requestAnimationFrame による毎フレーム処理
     9.  描画                … Canvas 2D API による全オブジェクト描画
    10.  ゲームフロー        … 開始・終了・得点管理
    11.  入力処理            … キーボード・マウス・タッチイベント
    12.  初期化              … DOMContentLoaded 時のセットアップ
   ═══════════════════════════════════════════════════════════ */


// ╔══════════════════════════════════════════════════════╗
// ║  1. 定数（CONSTANTS）                                ║
// ╚══════════════════════════════════════════════════════╝
// ゲーム全体を通じて変化しない値をここにまとめる。
// マジックナンバー（コード中に突然現れる数値）をなくし、
// 調整が必要な際は 1 か所だけ変更すれば済む設計にする。

const CW = 390, CH = 700;          // Canvas の幅・高さ（px）。HTML の width/height 属性と一致させる。
const BR = 13;                       // ボールの半径（px）。衝突判定の基準サイズ。
const GRAVITY   = 300;             // 重力加速度（px/s²）。大きいほどボールが速く落ちる。
const VEL_DAMP  = 0.9993;          // 1フレームあたりの速度減衰率。1.0=減衰なし、値が小さいほど早く止まる。
const MAX_SPEED = 19000;            // ボールの速度上限（px/s）。バンパー連打で無限加速しないよう制限。
const SUBSTEPS  = 4;               // 1フレームを細分化する物理ステップ数。
                                   // 大きいほど精度が上がるが処理負荷も増える。
const MAX_BALLS = 3;               // プレイヤーのボール（残機）数。

// ── フリッパー定数 ────────────────────────────────────
const FL     = 80;                 // フリッパーの長さ（px）。ピボット（根元）から先端までの距離。
const FW     = 10;                 // フリッパーの描画上の太さ（px）。
const FY     = 620;                // フリッパーピボットの Y 座標（Canvas 上）。下げて引っかかり解消。
const LPX    = 95;                 // 左フリッパーのピボット X 座標。
const RPX    = 295;                // 右フリッパーのピボット X 座標。
const CAP_R  = 2.5;                  // ピボット部分に描画する円（キャップ）の半径（px）。
const REST_A  =  30 * Math.PI / 180;  // フリッパーの休止角度（+30°＝下向き）。ラジアン変換。
const ACT_A   = -25 * Math.PI / 180;  // フリッパーの作動角度（−25°＝上向き）。ラジアン変換。
const RAISE_W = 14;                // フリッパーを上げる角速度（rad/s）。下げるより速く設定（操作感向上）。
const LOWER_W =  7;                // フリッパーを下げる角速度（rad/s）。

// ── アーチ（上部の半円形境界）定数 ───────────────────
const ARCH_CX = CW / 2;           // アーチ円弧の中心 X（= 195px、Canvas 中央）。
const ARCH_CY = 230;              // アーチ円弧の中心 Y（px）。上にずらしてバンパーと重ならないよう調整。
const ARCH_R  = 210;              // アーチの半径（px）。
const ARCH_N  = 16;               // アーチを近似する線分（セグメント）の数。多いほど滑らか。

// ── ターゲット定数 ────────────────────────────────────
const TW = 52, TH = 18;           // ターゲット矩形の幅・高さ（px）。

// ── ガイドウォール傾斜（30°）──────────────────────────
const GSLOPE = Math.tan(30 * Math.PI / 180);
// フリッパー上部の斜め壁（ガイドウォール）の傾斜を tan(30°) で表す。
// 壁の Y 座標計算に使用する。

// ── ボール初期位置 ────────────────────────────────────
const BSX = CW / 2;               // ボール発射 X 座標（Canvas 中央 = 195px）。
const BSY = FY - 1;　             // ボール発射 Y 座標（フリッパーラインの 1px 上）。


// ╔══════════════════════════════════════════════════════╗
// ║  2. SF サウンドエンジン（Web Audio API — ファイル不要）║
// ╚══════════════════════════════════════════════════════╝
// 音声ファイル(.mp3/.ogg)を一切使わず、Web Audio API のオシレーターと
// ノイズバッファだけで全効果音を合成する。
// 利点: 追加ファイルが不要、ロード時間ゼロ、SF 感のある独特なサウンド。

let _ac = null;
// AudioContext のシングルトンインスタンス。
// ブラウザはユーザー操作（クリック・タッチ）なしに音声を再生できないため、
// 最初のユーザー操作で遅延初期化（Lazy Init）する。

/** AudioContext を遅延生成する。ブラウザは最初のユーザー操作後でないと音声を許可しない。 */
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  // window.webkitAudioContext は Safari などの古いブラウザ向けのフォールバック。
  if (_ac.state === 'suspended') _ac.resume();
  // バックグラウンドタブに移動すると AudioContext が自動停止（suspended）することがある。
  // その場合は resume() で再開する。
  return _ac;
}

/**
 * オシレーターによるトーンを合成・再生する内部関数。
 *
 * @param {number} freq     - 開始周波数（Hz）。例: 440 = ラ音
 * @param {number} freqEnd  - 終了周波数（Hz）。freq と異なると音程が変化する（音程スイープ）。
 * @param {string} type     - 波形種別。'sine'=正弦波（滑らか）,'square'=矩形波（電子音),
 *                            'sawtooth'=のこぎり波（荒い）,'triangle'=三角波。
 * @param {number} vol      - ピーク音量（0〜1）。
 * @param {number} attack   - アタック時間（秒）。音量が 0 → vol になるまでの時間。
 * @param {number} decay    - ディケイ時間（秒）。音量が vol → 0 になるまでの時間。
 * @param {number} delay    - 再生開始までの遅延（秒）。複数音を時間差で重ねる際に使用。
 */
function _tone(freq, freqEnd, type, vol, attack, decay, delay) {
  delay = delay || 0;
  try {
    const ac  = getAC();
    const t0  = ac.currentTime + delay;  // 再生開始時刻（AudioContext の内部時計基準）

    const osc = ac.createOscillator();   // 音を生成するオシレーターノード
    const env = ac.createGain();         // 音量エンベロープ（ADSR の AG 部分）を制御するゲインノード

    osc.type = type;  // 波形を設定（sine/square/sawtooth/triangle）
    osc.frequency.setValueAtTime(freq, t0);  // 開始周波数を即時セット
    if (freqEnd && freqEnd !== freq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freqEnd, 10), t0 + attack + decay * 0.9);
      // 周波数を指数的に変化させる（人間の音感に合った自然な変化）。
      // 最小値 10Hz に制限（0Hz や負値で例外が起きるのを防ぐ）。
    }

    // エンベロープ設定（アタック → ディケイ）
    env.gain.setValueAtTime(0.001, t0);                              // 開始時は無音に近い値（0 だと exponentialRamp が使えない）
    env.gain.linearRampToValueAtTime(vol, t0 + attack);              // アタック: 線形で音量を上げる
    env.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay); // ディケイ: 指数的に消音

    // ノードを接続: オシレーター → エンベロープ → スピーカー出力
    osc.connect(env);
    env.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);  // 少し余裕を持たせて停止（クリックノイズ防止）
  } catch(e) { /* audio not available */ }
  // try-catch で囲むことで、音声が使えない環境（autoplay ポリシー等）でもゲームが止まらないようにする。
}

/** フィルタリングされたホワイトノイズを短時間再生する内部関数。
 *  衝突音・打撃音などの「ノイズ成分」を担当する。
 *
 * @param {number} vol       - 音量（0〜1）
 * @param {number} filterHz  - バンドパスフィルターの中心周波数（Hz）
 * @param {number} filterQ   - フィルターの Q 値（高いほどバンド幅が狭く鋭い音）
 * @param {number} duration  - 再生時間（秒）
 * @param {number} delay     - 再生開始遅延（秒）
 */
function _noise(vol, filterHz, filterQ, duration, delay) {
  delay = delay || 0;
  try {
    const ac  = getAC();
    const t0  = ac.currentTime + delay;
    const sr  = ac.sampleRate;  // サンプリング周波数（通常 44100 または 48000 Hz）
    const n   = Math.ceil(sr * (duration + 0.05));  // 必要なサンプル数を計算
    const buf = ac.createBuffer(1, n, sr);           // モノラルのオーディオバッファを生成
    const dat = buf.getChannelData(0);               // Float32Array としてチャンネルデータを取得
    for (let i = 0; i < n; i++) dat[i] = Math.random() * 2 - 1;
    // −1〜+1 のランダム値を全サンプルに書き込む → ホワイトノイズ

    const src  = ac.createBufferSource();  // バッファを再生するソースノード
    src.buffer = buf;

    const filt = ac.createBiquadFilter();  // 双二次フィルターで特定の周波数帯域を強調
    filt.type            = 'bandpass';     // バンドパス: 中心周波数周辺の成分だけを通す
    filt.frequency.value = filterHz;
    filt.Q.value         = filterQ;

    const env = ac.createGain();  // エンベロープ（音量の時間変化）
    env.gain.setValueAtTime(vol, t0);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + duration);  // 指数的に消音

    // ノード接続: バッファソース → フィルター → エンベロープ → スピーカー
    src.connect(filt);
    filt.connect(env);
    env.connect(ac.destination);
    src.start(t0);
    src.stop(t0 + duration + 0.06);
  } catch(e) { /* audio not available */ }
}

// ── 個別効果音関数 ────────────────────────────────────
// 各効果音は _tone / _noise を組み合わせて合成する。
// 複数を同時に鳴らすことで厚みのあるサウンドを作る。

/** フリッパーを動かした時の音 — カチッとした機械的なクリック音 */
function sndFlipper() {
  _tone(220, 80,   'square',   0.14, 0.003, 0.07);
  // 220Hz（矩形波）→ 80Hz に落とす短いトーン: ソレノイド駆動音をイメージ
  _noise(0.10, 600,  1.5, 0.04);
  // 600Hz 帯のノイズ: 機械的なタッチ感を加える
}

/** バンパーに当たった時の音 — 電子的な「ピュン」音 */
function sndBumper() {
  _tone(1100, 1600, 'square',  0.20, 0.003, 0.06);
  // 上昇する矩形波: バンパーの弾き出しエネルギーを表現
  _tone(1600, 500,  'sine',    0.14, 0.002, 0.10, 0.02);
  // 遅延して下降するサイン波: 余韻
  _noise(0.06, 3000, 2, 0.03, 0.01);
  // 高周波ノイズ: 電子的な「ジッ」音
}

/** スリングショットに当たった時の音 — 鋭い電気的なバチッ音 */
function sndSling() {
  _tone(800,  150,  'sawtooth', 0.22, 0.002, 0.09);
  // 急降下するのこぎり波: 鋭い衝撃音
  _noise(0.18, 2200, 3, 0.06);
  // 鋭い高周波ノイズ: 電気スパーク感
}

/** サイドターゲット（1000pt）の音 — 2音の SF チャイム */
function sndTargetlow() {
  _tone(1047, 1047, 'sine', 0.20, 0.006, 0.28);
  // 1047Hz = C6（高いド音）: 基音
  _tone(1319, 1319, 'sine', 0.13, 0.006, 0.22, 0.06);
  // 1319Hz = E6（ミ音）: 60ms 後に重ねてハーモニーを作る
}

/** センターターゲット（10000pt）の音 — 4音上昇ファンファーレ */
function sndTargethi() {
  _tone(784,  784,  'sine', 0.20, 0.006, 0.30);
  // G5（ソ）
  _tone(1047, 1047, 'sine', 0.17, 0.006, 0.28, 0.07);
  // C6（ド）: 70ms 後
  _tone(1319, 1319, 'sine', 0.14, 0.006, 0.26, 0.14);
  // E6（ミ）: 140ms 後
  _tone(1568, 1568, 'sine', 0.12, 0.006, 0.24, 0.21);
  // G6（ソ）: 210ms 後。G→C→E→G の上昇コード感で「大当たり」を演出
}

/** ボール発射音 — 上昇するウォッシュ音 */
function sndLaunch() {
  _tone(180, 700,  'sawtooth', 0.16, 0.02, 0.28);
  // 低音から高音へ上昇するのこぎり波: 発射の勢いを表現
  _noise(0.09, 400, 1.5, 0.22);
  // 低周波ノイズ: 空気を切る感覚を加える
}

/** ボール消失（ドレイン）音 — 悲しげな下降音 */
function sndDrain() {
  _tone(440, 110,  'sine',   0.22, 0.01, 0.45);
  // 440Hz（ラ）→ 110Hz に大きく下降: 「ガッカリ感」を演出
  _tone(330, 82,   'square', 0.12, 0.01, 0.38, 0.12);
  // 追いかけるように下降する矩形波の副音
  _noise(0.06, 200, 1, 0.35, 0.05);
  // 低周波ノイズ: 暗い残響
}

/** ゲームオーバー音 — 5音下降アルペジオ（音の連なり）*/
function sndGameOver() {
  const seq = [880, 698, 587, 494, 370];
  // A5→F5→D5→B4→F#4（上から下に落ちていく音列）
  seq.forEach(function(f, i) {
    _tone(f, f * 0.88, 'sine',   0.20, 0.01, 0.32, i * 0.20);
    // サイン波: メロディー成分（200ms ずつずらして鳴らす）
    _tone(f, f * 0.88, 'square', 0.06, 0.01, 0.28, i * 0.20);
    // 矩形波: サイン波に少し混ぜて厚みを出す
  });
}

/** 壁・アーチへの接触音 — 控えめなティック音 */
function sndWall() {
  _tone(160, 90, 'square', 0.06, 0.002, 0.035);
  // 低音の短い矩形波: 壁への軽い当たりをさりげなく伝える
}


// ╔══════════════════════════════════════════════════════╗
// ║  3. ジオメトリヘルパー（GEOMETRY HELPERS）            ║
// ╚══════════════════════════════════════════════════════╝
// オブジェクトの配置を「正規化座標（0〜1）」で記述し、
// Canvas 座標に変換するユーティリティ。
// 正規化座標を使うことで、Canvas サイズが変わっても
// 相対的なレイアウトを保てる。

/**
 * 正規化ステージ座標（nx 0〜1, ny 0〜1）を Canvas 座標に変換する。
 * ny=0: フリッパーライン（FY=570）、ny=1: Canvas 最上部（y=0）。
 * ※ Y 軸は Canvas では上が小さい値のため、ny は上方向を正とする独自定義。
 */
function sc(nx, ny)           { return { x: nx * CW, y: FY * (1 - ny) }; }

/**
 * 2 点の正規化座標からセグメント（線分）オブジェクトを生成する。
 * 返り値: { x1, y1, x2, y2 }（Canvas 座標）
 */
function makeSeg(nx1,ny1,nx2,ny2) {
  const a = sc(nx1, ny1), b = sc(nx2, ny2);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}


// ╔══════════════════════════════════════════════════════╗
// ║  4. 静的ゲームオブジェクト（STATIC GAME OBJECTS）    ║
// ╚══════════════════════════════════════════════════════╝
// ゲーム中に位置が変わらない障害物を定義する。
// 全て sc() / makeSeg() を使い正規化座標で記述している。

const BUMP_R = Math.round(0.06 * CW); // バンパーの半径 ≈ 23px（Canvas 幅の 6%）

/** バンパーオブジェクトを生成するファクトリ関数 */
function mkBumper(nx, ny, pts) {
  const p = sc(nx, ny);
  return { x: p.x, y: p.y, r: BUMP_R, pts, flash: 0 };
  // flash: ヒット時に発光演出を行うタイマー（秒）。0 = 非発光。
}

/** ターゲットオブジェクトを生成するファクトリ関数 */
function mkTarget(nx, ny, pts) {
  const p = sc(nx, ny);
  return { x: p.x, y: p.y, pts, active: true, restore: 4 };
  // active: false になるとヒット不可（消灯）になる。
  // restore: 消灯から点灯に戻るまでのカウントダウン（秒）。
}

// ── バンパー配置 ──────────────────────────────────────
const bumpers = [
  mkBumper(0.50, 0.78, 100),   // 上中央  → Canvas (195, 125)
  mkBumper(0.28, 0.65, 100),   // 中左    → Canvas (109, 200)
  mkBumper(0.72, 0.65, 100),   // 中右    → Canvas (281, 200)
];

// ── スリングショット配置 ──────────────────────────────
// フリッパー上部の斜め壁。ボールを激しく弾き返す。
const slings = [
  { ...makeSeg(0.14, 0.22, 0.24, 0.14), flash: 0 },  // 左  (55,445)→(94,490)
  { ...makeSeg(0.86, 0.22, 0.76, 0.14), flash: 0 },  // 右 (335,445)→(296,490)
];

// ── スリングウォール（スリングショット三角形の閉じ壁）──
// スリングショット周囲の小さな壁。三角形の隙間を塞いでボールがはまり込まないようにする。
const slingWalls = [
  makeSeg(0.14, 0.22, 0.14, 0.14),   // (55,445)→(55,490): 左縦壁
  makeSeg(0.14, 0.14, 0.24, 0.14),   // (55,490)→(94,490): 左下壁
  makeSeg(0.86, 0.22, 0.86, 0.14),   // (335,445)→(335,490): 右縦壁
  makeSeg(0.76, 0.14, 0.86, 0.14),   // (296,490)→(335,490): 右下壁
];

// ── ターゲット配置 ────────────────────────────────────
const targets = [
  mkTarget(0.25, 0.47, 1000),  // 左サイドターゲット   → Canvas (98,  302)
  mkTarget(0.50, 0.47, 2500),  // センターターゲット   → Canvas (195, 302)
  mkTarget(0.75, 0.47, 1000),  // 右サイドターゲット   → Canvas (293, 302)
  mkTarget(0.50, 0.57, 10000),  // センター上部（高得点）→ Canvas
];

// ── アーチ（上部半円形境界）セグメント生成 ─────────────
// 半円を ARCH_N 本の線分で近似する。
// a が 0→π: 左端（5,300）→ 頂点（195,110）→ 右端（385,300）の順に点を打つ。
const archPts = [];
for (let i = 0; i <= ARCH_N; i++) {
  const a = Math.PI * i / ARCH_N;
  archPts.push({
    x: ARCH_CX - ARCH_R * Math.cos(a),
    y: ARCH_CY - ARCH_R * Math.sin(a)   // sin は正の値 → y が減少（Canvas 上方向）
  });
}
// 隣接する点を結んでセグメント配列を生成する
const archSegs = [];
for (let i = 0; i < archPts.length - 1; i++) {
  archSegs.push({ x1: archPts[i].x, y1: archPts[i].y,
                  x2: archPts[i+1].x, y2: archPts[i+1].y });
}

// ── ガイドウォール（フリッパー上部の傾斜壁）────────────
// ボールをフリッパーへ誘導する斜め壁。30° の傾斜。
const LGY = FY - LPX * GSLOPE;            // 左ガイド壁の上端 Y ≈ 515
const RGY = FY - (CW - RPX) * GSLOPE;     // 右ガイド壁の上端 Y ≈ 515
const guides = [
  { x1: 0,   y1: LGY, x2: LPX, y2: FY },   // 左ガイド: Canvas 左端→左フリッパーピボット
  { x1: RPX, y1: FY,  x2: CW,  y2: RGY },   // 右ガイド: 右フリッパーピボット→Canvas 右端
];

// ── 全静的物理壁（結合）──────────────────────────────
// 衝突判定ループで一括処理するため、全壁を 1 つの配列にまとめる。
const staticWalls = [
  { x1: 0,  y1: 0, x2: 0,  y2: CH + 300 },   // 左端の壁（Canvas 外まで延ばしてすり抜け防止）
  { x1: CW, y1: 0, x2: CW, y2: CH + 300 },   // 右端の壁
  { x1: 0,  y1: 0, x2: CW, y2: 0 },           // 上端の壁（アーチが機能しない場合のフォールバック）
  ...archSegs,     // 上部アーチの線分群
  ...guides,       // ガイドウォール
  ...slingWalls,   // スリングウォール
];


// ╔══════════════════════════════════════════════════════╗
// ║  5. 状態変数（STATE）                                ║
// ╚══════════════════════════════════════════════════════╝
// ゲーム実行中に変化する値（ミュータブルな状態）をここで宣言する。
// const ではなく let を使い、上書き可能にする。

let canvas, ctx;
// canvas: <canvas> DOM 要素の参照（初期化時に取得）。
// ctx: Canvas 2D 描画コンテキスト（全描画操作の起点）。

let score        = 0;          // 実際のスコア（内部値）
let displayScore = 0;          // HUD に表示するスコア（カウントアップアニメーション用）
let ballsLeft = MAX_BALLS;  // 残りボール数（0 になるとゲーム終了）
let running   = false;      // ゲームループが動いているか。false のとき update() をスキップ。
let draining  = false;      // ボールが消失処理中か。二重処理を防ぐフラグ。
let hiScore   = parseInt(localStorage.getItem('fdl_pinball_hi') || '0', 10);
// ハイスコアをブラウザの localStorage から読み込む。
// キー: 'fdl_pinball_hi'。存在しない場合は '0' をパースして 0 にする。
let rafId     = null;  // requestAnimationFrame の ID。cancelAnimationFrame に使う。
let lastTs    = 0;     // 前フレームのタイムスタンプ（ms）。dt（フレーム間隔）計算に使う。

// ボールオブジェクト（物理ヘルパー用の現在処理中ボール参照）
let ball = null;
// balls: フィールド上の全ボールを管理する配列（マルチボール対応）
let balls = [];
// awaitingRespawn: 全ボール消失後のリスポーン待ちフラグ（二重タイマー防止）
let awaitingRespawn = false;

// フリッパーオブジェクト
// REST_A = 下がっている角度、ACT_A = 上がっている角度
const lFlip = { angle: REST_A, target: REST_A, raising: false };
const rFlip = { angle: REST_A, target: REST_A, raising: false };
// angle: 現在の角度（ラジアン）/ target: 目標角度 / raising: 上昇中か（ヒット時ブースト判定）

const popups = [];   // スコアポップアップのリスト { x, y, pts, alpha }
// ヒット時に「+100」などの数字がフワッと浮かぶ演出用オブジェクトの配列。


// ╔══════════════════════════════════════════════════════╗
// ║  6. 物理ヘルパー（PHYSICS HELPERS）                  ║
// ╚══════════════════════════════════════════════════════╝
// ボールとゲームオブジェクトの衝突判定・速度解決（反発計算）。
// 全て「点と形状の最近接点を求めて法線方向に押し出す」基本アルゴリズムを使う。
// 反発係数（restitution）: 1.0 = 完全弾性、0.0 = 完全非弾性。

/**
 * 線分 [ax,ay]→[bx,by] 上でボール [px,py] に最も近い点を返す。
 * t が 0〜1 の範囲にクランプされるため、端点を超えることはない。
 */
function segClosest(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx*dx + dy*dy;          // 線分の長さの 2 乗
  if (len2 === 0) return { x: ax, y: ay };  // 長さ 0 の場合は端点をそのまま返す
  const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / len2));
  // t = 線分上の最近接点のパラメーター（0=始点, 1=終点）
  // 内積を長さの 2 乗で割って正規化し、0〜1 にクランプ
  return { x: ax + t*dx, y: ay + t*dy };  // 最近接点の座標を返す
}

/**
 * ボールと線分の衝突判定と速度解決。
 * 衝突があった場合は true を返す。
 * @param {number} rest - 反発係数（0=吸収, 1=完全反発, >1=エネルギー増加）
 */
function resolveSegment(ax, ay, bx, by, rest) {
  const cp = segClosest(ax, ay, bx, by, ball.x, ball.y);  // 最近接点
  const dx = ball.x - cp.x, dy = ball.y - cp.y;          // 最近接点からボール中心へのベクトル
  const d2 = dx*dx + dy*dy;                               // 距離の 2 乗
  if (d2 >= BR*BR || d2 === 0) return false;              // ボール半径未満でなければ非衝突
  const d  = Math.sqrt(d2);
  const nx = dx/d, ny = dy/d;                             // 衝突法線ベクトル（単位ベクトル）
  const vn = ball.vx*nx + ball.vy*ny;                     // 法線方向の速度成分
  if (vn >= 0) return false;                               // 既に離れる方向なら処理しない
  ball.x = cp.x + nx * BR;                                // ボールを表面から押し出す（貫通防止）
  ball.y = cp.y + ny * BR;
  ball.vx -= (1 + rest) * vn * nx;                        // 反射速度を計算（法線成分を反転）
  ball.vy -= (1 + rest) * vn * ny;
  return true;
}

/**
 * ボールと静的円（ピボットキャップ）の衝突判定と速度解決。
 * 衝突があった場合は true を返す。
 */
function resolveCircle(cx, cy, cr, rest) {
  const dx = ball.x - cx, dy = ball.y - cy;
  const d2 = dx*dx + dy*dy;
  const md = BR + cr;                      // 衝突判定距離（両半径の和）
  if (d2 >= md*md || d2 === 0) return false;
  const d  = Math.sqrt(d2);
  const nx = dx/d, ny = dy/d;             // 衝突法線
  const vn = ball.vx*nx + ball.vy*ny;    // 法線方向の相対速度
  if (vn >= 0) return false;
  ball.x = cx + nx * md;                 // 押し出し
  ball.y = cy + ny * md;
  ball.vx -= (1 + rest) * vn * nx;       // 反射
  ball.vy -= (1 + rest) * vn * ny;
  return true;
}

/**
 * ボールとバンパーの衝突判定（速度ブースト付き）。
 * バンパーは通常の反射に加えて最低速度を保証することで、
 * ゆっくり当たっても必ず弾き返す「アクティブバンパー」を実現する。
 */
function resolveBumper(b) {
  const dx = ball.x - b.x, dy = ball.y - b.y;
  const d2 = dx*dx + dy*dy;
  const md = BR + b.r;
  if (d2 >= md*md || d2 === 0) return false;
  const d  = Math.sqrt(d2);
  const nx = dx/d, ny = dy/d;
  const vn = ball.vx*nx + ball.vy*ny;
  if (vn >= 0) return false;
  ball.x = b.x + nx * md;
  ball.y = b.y + ny * md;
  // ブースト: 現在速度の 1.5 倍と 700px/s の大きい方を新しい速さにする。
  // これにより反発係数 > 1 の「エネルギー増加型」バンパーを実現する。
  const spd = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
  const ns  = Math.max(spd * 1.5, 700);
  ball.vx = nx * ns;
  ball.vy = ny * ns;
  clampSpeed();  // MAX_SPEED を超えないよう速度をクランプ
  return true;
}

/**
 * ボールと軸平行矩形（AABB）の衝突判定と速度解決。
 * ターゲット（長方形）との衝突に使用する。
 */
function resolveRect(rx, ry, rw, rh, rest) {
  const hw = rw/2, hh = rh/2;
  // 矩形内でボールに最も近い点を求める（AABB 最近接点）
  const cx = Math.max(rx-hw, Math.min(ball.x, rx+hw));
  const cy = Math.max(ry-hh, Math.min(ball.y, ry+hh));
  const dx = ball.x - cx, dy = ball.y - cy;
  const d2 = dx*dx + dy*dy;
  if (d2 >= BR*BR || d2 === 0) return false;
  const d  = Math.sqrt(d2);
  const nx = dx/d, ny = dy/d;
  const vn = ball.vx*nx + ball.vy*ny;
  if (vn >= 0) return false;
  ball.x = cx + nx * BR;
  ball.y = cy + ny * BR;
  ball.vx -= (1 + rest) * vn * nx;
  ball.vy -= (1 + rest) * vn * ny;
  return true;
}

/** ボールの速度を MAX_SPEED 以下に制限する。ベクトルの大きさだけ変え方向は保つ。 */
function clampSpeed() {
  const spd = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
  if (spd > MAX_SPEED) {
    const s = MAX_SPEED / spd;  // スケーリング係数
    ball.vx *= s;
    ball.vy *= s;
  }
}


// ╔══════════════════════════════════════════════════════╗
// ║  7. フリッパーユーティリティ（FLIPPER UTILS）         ║
// ╚══════════════════════════════════════════════════════╝

/**
 * フリッパーの先端（チップ）座標を計算して返す。
 * @param {object} flip - フリッパーオブジェクト { angle, target, raising }
 * @param {number} pivX - ピボットの X 座標
 * @param {number} dir  - +1（左フリッパー、先端が右向き）/ -1（右フリッパー、先端が左向き）
 */
function tipPos(flip, pivX, dir) {
  return {
    x: pivX + dir * FL * Math.cos(flip.angle),
    // 水平成分: cos(angle) × フリッパー長さ × 方向
    y: FY   +       FL * Math.sin(flip.angle),
    // 垂直成分: sin(angle) × フリッパー長さ（角度が正なら下向き）
  };
}

/** フリッパーを目標角度に向けて滑らかに回転させる（毎フレーム呼ぶ）。 */
function updateFlipper(flip, dt) {
  const diff  = flip.target - flip.angle;              // 目標角度との差
  const speed = diff < 0 ? RAISE_W : LOWER_W;          // 上げるときは速く、下げるときは遅く
  const step  = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
  // 1 フレームで進む角度: 差が小さければ差のぶんだけ、大きければ speed*dt まで
  flip.angle += step;
  flip.raising = (flip.target === ACT_A) && Math.abs(flip.angle - ACT_A) > 0.01;
  // raising フラグ: 目標が「上げ」で、まだ目標に到達していない ≒ 上昇中
  // ヒット時のボール加速（ブースト）判定に使う
}

/**
 * フリッパーとボールの衝突を処理し、上昇中ならボールに追加の打ち出し力を加える。
 * @param {object} flip - フリッパーオブジェクト
 * @param {number} pivX - ピボット X 座標
 * @param {number} dir  - +1 or -1
 */
function checkFlipper(flip, pivX, dir) {
  const tip = tipPos(flip, pivX, dir);
  const hit = resolveSegment(pivX, FY, tip.x, tip.y, 0.3);
  // フリッパーを線分として扱い通常の反射処理を行う（反発係数 0.3）
  if (hit && flip.raising) {
    // 上昇中にヒットした場合は追加の打ち出し力を与える（「スラップ」効果）
    ball.vx += dir * 150;  // 横方向へ 150px/s の加速（フリッパーの向きに応じて）
    ball.vy -= 750;        // 上方向へ 240px/s の加速
    clampSpeed();
  }
}


// ╔══════════════════════════════════════════════════════╗
// ║  8. ゲームループ（GAME LOOP）                        ║
// ╚══════════════════════════════════════════════════════╝
// requestAnimationFrame（RAF）を使ったメインループ。
// ブラウザの画面更新タイミング（通常 60fps）に同期して毎フレーム呼ばれる。

// ── 物理更新（update）────────────────────────────────
/**
 * 物理シミュレーションを 1 フレーム分進める。
 * SUBSTEPS 回に分割して精度を上げ、高速ボールのすり抜けを防ぐ。
 * @param {number} dt - 前フレームからの経過時間（秒）
 */
// マルチボールの同時上限数（この数を超えるボールは追加しない。増やしすぎると面白くなくなるので２個で様子を見る。５個以上は処理し切れないかもしれない。）
const MAX_MULTI_BALLS = 2;

function update(dt) {
  if (!running) return;

  const sdt = dt / SUBSTEPS;  // サブステップ 1 回分の時間
  let drainedCount = 0;       // このフレームで消えたボール数

  for (let s = 0; s < SUBSTEPS; s++) {
    // ── フリッパー角度をサブステップごとに 1 回だけ更新 ──────
    // 【重要】フリッパー更新はボールループの外側・サブステップの先頭で行う。
    // ボールループ内で呼ぶと「ボール数 × SUBSTEPS 回」更新されてしまい、
    // フリッパーが瞬時に動き終わって raising フラグが消え、
    // ボールを加速できなくなるバグの原因になる。
    updateFlipper(lFlip, sdt);
    updateFlipper(rFlip, sdt);

    // フリッパー先端座標はサブステップ内で共通（毎回計算しない）
    const lTip = tipPos(lFlip, LPX,  1);
    const rTip = tipPos(rFlip, RPX, -1);

    // ── 全ボールの物理を処理（後ろから走査で splice 安全）──
    for (let bi = balls.length - 1; bi >= 0; bi--) {
      ball = balls[bi];  // グローバルポインタを現在のボールに向ける

      // ── 積分（位置・速度の更新）──────────────────────────
      ball.vy += GRAVITY * sdt;
      const damp = Math.pow(VEL_DAMP, 60 * sdt);
      ball.vx *= damp;
      ball.vy *= damp;
      ball.x  += ball.vx * sdt;
      ball.y  += ball.vy * sdt;

      // ── 静的壁・アーチとの衝突 ──────────────────────────
      let wallHit = false;
      for (const w of staticWalls) {
        if (resolveSegment(w.x1, w.y1, w.x2, w.y2, 0.55)) wallHit = true;
      }
      if (wallHit && s === 0) sndWall();

      // ── バンパーとの衝突 ────────────────────────────────
      for (const b of bumpers) {
        if (resolveBumper(b)) {
          b.flash = 0.20;
          sndBumper();
          scoreAt(b.pts, ball.x, ball.y);
        }
      }

      // ── スリングショットとの衝突 ────────────────────────
      for (const sl of slings) {
        if (resolveSegment(sl.x1, sl.y1, sl.x2, sl.y2, 1.11)) {
          const dx = sl.x2 - sl.x1, dy = sl.y2 - sl.y1;
          const len = Math.sqrt(dx*dx + dy*dy);
          let nx = -dy/len, ny = dx/len;
          const midX = (sl.x1 + sl.x2) / 2;
          if ((CW/2 - midX) * nx < 0) { nx = -nx; ny = -ny; }
          ball.vx += nx * 140;
          ball.vy += ny * 140;
          clampSpeed();
          sl.flash = 0.15;
          sndSling();
          scoreAt(500, midX, (sl.y1 + sl.y2)/2);
        }
      }

      // ── ターゲットとの衝突 ──────────────────────────────
      for (const t of targets) {
        if (t.active && resolveRect(t.x, t.y, TW, TH, 0.55)) {
          t.active  = false;
          t.restore = 4.0;
          if (t.pts >= 10000) {
            sndTargethi();
            // 10000pt 命中: 上限 MAX_MULTI_BALLS を超えない場合のみボールを追加
            if (balls.length < MAX_MULTI_BALLS) {
              balls.push({
                x:  t.x,
                y:  t.y,
                vx: (Math.random() < 0.5 ? 1 : -1) * (200 + Math.random() * 100),
                vy: -(300 + Math.random() * 150),
                active: true
              });
            }
          } else {
            sndTargetlow();
          }
          scoreAt(t.pts, t.x, t.y);
        }
      }

      // ── フリッパーとの衝突 ──────────────────────────────
      checkFlipper(lFlip, LPX,  1);
      checkFlipper(rFlip, RPX, -1);

      // ── ピボットキャップとの衝突 ────────────────────────
      resolveCircle(LPX, FY, CAP_R, 0.35);
      resolveCircle(RPX, FY, CAP_R, 0.35);

      // ── フリッパーすり抜け防止ガード ────────────────────
      // フリッパー線分の裏側にボールが入り込んだ場合、強制的に押し戻す。
      for (const [px, py, tx, ty] of [
        [LPX, FY, lTip.x, lTip.y],
        [RPX, FY, rTip.x, rTip.y],
      ]) {
        const cp = segClosest(px, py, tx, ty, ball.x, ball.y);
        const ddx = ball.x - cp.x, ddy = ball.y - cp.y;
        const dist2 = ddx*ddx + ddy*ddy;
        if (dist2 < BR * BR && dist2 > 0 && ball.y > cp.y - 1) {
          const dist = Math.sqrt(dist2);
          const nnx = ddx / dist, nny = ddy / dist;
          const upNx = (nny < 0) ? nnx : -nnx;
          const upNy = (nny < 0) ? nny : -nny;
          ball.x = cp.x + upNx * BR;
          ball.y = cp.y + upNy * BR;
          const vn = ball.vx * upNx + ball.vy * upNy;
          if (vn < 0) {
            ball.vx -= 1.3 * vn * upNx;
            ball.vy -= 1.3 * vn * upNy;
          }
        }
      }

      // ── ドレイン判定 ────────────────────────────────────
      if (ball.y > CH + BR * 4) {
        balls.splice(bi, 1);
        drainedCount++;
      }
    }
  }

  // ドレインが 1 件以上あれば全滅チェックを 1 回だけ実行
  if (drainedCount > 0) oneBallDrained();
}

/**
 * requestAnimationFrame から毎フレーム呼ばれるメインループ関数。
 * @param {DOMHighResTimeStamp} ts - ブラウザが渡す高精度タイムスタンプ（ms）
 */
function gameLoop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 1/30);
  lastTs = ts;

  // ターゲット再点灯タイマーをカウントダウン
  for (const t of targets) {
    if (!t.active) {
      t.restore -= dt;
      if (t.restore <= 0) t.active = true;  // 時間が来たら再点灯
    }
  }

  // 発光（flash）タイマーをカウントダウン
  for (const b of bumpers) if (b.flash > 0) b.flash -= dt;
  for (const sl of slings)  if (sl.flash > 0) sl.flash -= dt;

  // スコアポップアップのフェードアウト・上昇処理
  for (let i = popups.length - 1; i >= 0; i--) {
    // 後ろから走査することで splice 後のインデックスズレを防ぐ
    const p = popups[i];
    p.y    -= 50 * dt;   // 毎秒 50px 上方向に移動
    p.alpha -= 2.2 * dt; // 約 0.45 秒で完全透明（alpha=0）になる
    if (p.alpha <= 0) popups.splice(i, 1);  // 透明になったら配列から削除
  }

  // 物理シミュレーション
  update(dt);

  // 全オブジェクトを Canvas に描画
  draw();

  if (running) rafId = requestAnimationFrame(gameLoop);
}


// ╔══════════════════════════════════════════════════════╗
// ║  9. 描画（DRAWING）                                  ║
// ╚══════════════════════════════════════════════════════╝
// Canvas 2D API で全オブジェクトを毎フレーム描き直す（ダーティ矩形なし）。
// 描画順序: 背景 → 壁 → 障害物 → フリッパー → ボール → UI。
// 前面のものを後から描くことで正しいレイヤー順を実現する。

/** Canvas 全体を描画する。gameLoop から毎フレーム呼ばれる。 */
function draw() {
  // ── フィールド背景 ────────────────────────────────────
  ctx.fillStyle = '#070714';
  ctx.fillRect(0, 0, CW, CH);
  // 毎フレームの最初に全画面を塗りつぶして前フレームの描画を消去する。

  // 薄いドットグリッドで「電子基板」の雰囲気を演出する
  ctx.fillStyle = 'rgba(255,255,255,0.028)';  // ほぼ透明な白
  const gs = 36;  // グリッド間隔（px）
  for (let gx = gs/2; gx < CW; gx += gs) {
    for (let gy = gs/2; gy < CH; gy += gs) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI*2);  // 半径 1px の極小円
      ctx.fill();
    }
  }

  // 各描画関数を順番に呼び出す（後に呼んだものが手前に描画される）
  drawArch();
  drawGuideWalls();
  drawSlingWalls();
  drawSlingshots();
  drawTargets();
  drawBumpers();
  drawFlippers();
  drawPivotCaps();
  // 全ボールを描画（マルチボール対応）
  for (const b of balls) { ball = b; drawBall(); }
  drawPopups();

  // フリッパーゾーン区切り線（薄いピンク）
  ctx.beginPath();
  ctx.moveTo(0, FY + 90);
  ctx.lineTo(CW, FY + 90);
  ctx.strokeStyle = 'rgba(255,0,88,0.18)';  // 薄いピンク
  ctx.lineWidth = 1;
  ctx.stroke();
  // ドレイン領域（フリッパー以下）を視覚的に示す境界線。
}

/** 上部アーチ（半円形の天井）を描画する。 */
function drawArch() {
  ctx.save();
  ctx.beginPath();
  // anticlockwise=false → 時計回りで π（左端）→ 0（右端）の弧を描く
  // これにより下向きに開いた逆 U 字型（∩）のアーチが描画される
  ctx.arc(ARCH_CX, ARCH_CY, ARCH_R, Math.PI, 0, false);
  ctx.strokeStyle = 'rgba(220,220,255,0.85)';   // 薄い白紫（壁の色）
  ctx.lineWidth = 5;
  ctx.shadowColor = 'rgba(0,229,255,0.7)';      // シアングロー
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
  // save/restore で shadowBlur などのスタイル変更を局所化する（他の描画に漏れない）。
}

/** ガイドウォールとポケット閉じ壁を描画する。 */
function drawGuideWalls() {
  ctx.save();
  ctx.lineWidth = 14;       // 太い線でボールを誘導する存在感を出す
//  ctx.lineCap = 'round';   // 線端を丸くして端部のギザギザを防ぐ
  ctx.strokeStyle = 'rgba(180,180,220,0.90)';
  ctx.shadowColor = 'rgba(100,120,255,0.5)';   // 青紫グロー
  ctx.shadowBlur = 6;
  for (const g of guides) {
    ctx.beginPath();
    ctx.moveTo(g.x1, g.y1);
    ctx.lineTo(g.x2, g.y2);
    ctx.stroke();
  }
  ctx.restore();
}

/** スリングウォール（スリングショット周囲の補助壁）を描画する。 */
function drawSlingWalls() {
  ctx.save();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(140,140,200,0.7)';   // 控えめな薄紫
  for (const w of slingWalls) {
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.stroke();
  }
  ctx.restore();
}

/** スリングショット本体を描画する。ヒット中はフラッシュ（白く発光）する。 */
function drawSlingshots() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const sl of slings) {
    const fl = sl.flash > 0;  // フラッシュ中かどうか
    ctx.beginPath();
    ctx.moveTo(sl.x1, sl.y1);
    ctx.lineTo(sl.x2, sl.y2);
    ctx.strokeStyle  = fl ? '#ffffff' : '#ff6d00';   // フラッシュ中は白、通常はオレンジ
    ctx.lineWidth    = 7;
    ctx.shadowColor  = fl ? '#ffffff' : '#ff6d00';
    ctx.shadowBlur   = fl ? 28 : 10;                 // フラッシュ中はグローを強くする
    ctx.stroke();
  }
  ctx.restore();
}

/** バンパーを描画する。外円→内リング→コア→得点ラベルの 4 層構造。 */
function drawBumpers() {
  ctx.save();
  for (const b of bumpers) {
    const fl = b.flash > 0;  // ヒット発光中かどうか

    // 外円（バンパー本体の外縁）
    ctx.shadowColor = fl ? '#ffffff' : '#ffd600';   // フラッシュ中は白グロー、通常は黄グロー
    ctx.shadowBlur  = fl ? 32 : 14;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle   = '#0c0c22';                     // 暗い紺で「空洞」感を出す
    ctx.fill();
    ctx.strokeStyle = fl ? '#ffffff' : 'rgba(180,160,60,0.8)';
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // 内リング（装飾的な同心円）
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.72, 0, Math.PI*2);  // 外円の 72% の半径
    ctx.strokeStyle = fl ? 'rgba(255,255,255,0.5)' : 'rgba(255,214,0,0.22)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // コア（中央の光る核）
    ctx.shadowColor = fl ? '#ffffff' : '#ffd600';
    ctx.shadowBlur  = fl ? 20 : 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.42, 0, Math.PI*2);  // 外円の 42% の半径
    ctx.fillStyle = fl ? '#ffffff' : '#ffd600';     // フラッシュ中は白、通常は黄
    ctx.fill();

    // 得点ラベル（バンパー中央に「100」と表示）
    ctx.shadowBlur = 0;
    ctx.fillStyle = fl ? '#000' : 'rgba(0,0,0,0.75)';  // コアの色と対比する黒
    ctx.font = 'bold 9px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.pts, b.x, b.y);
  }
  ctx.restore();
}

/**
 * 角丸矩形のパスを描くヘルパー関数。
 * Canvas 2D API には roundRect が後から追加されたため、互換性のため手動実装する。
 * @param {number} x, y - 矩形の左上座標
 * @param {number} w, h - 幅・高さ
 * @param {number} r    - 角丸半径
 */
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);                          // 上辺左端（角丸開始点）
  ctx.lineTo(x+w-r, y);                        // 上辺右端
  ctx.arcTo(x+w, y,   x+w, y+r,   r);          // 右上角の円弧
  ctx.lineTo(x+w, y+h-r);                      // 右辺下端
  ctx.arcTo(x+w, y+h, x+w-r, y+h, r);          // 右下角の円弧
  ctx.lineTo(x+r, y+h);                        // 下辺左端
  ctx.arcTo(x,   y+h, x,   y+h-r, r);          // 左下角の円弧
  ctx.lineTo(x,   y+r);                        // 左辺上端
  ctx.arcTo(x,   y,   x+r, y,     r);          // 左上角の円弧
  ctx.closePath();                             // パスを閉じる
  // arcTo(x1,y1, x2,y2, r): 現在点→(x1,y1) と (x1,y1)→(x2,y2) の間に
  // 半径 r の円弧を挿入するメソッド。4 回呼ぶことで 4 つの角丸を描く。
}

/** ターゲットを描画する。アクティブ（青く発光）/ 非アクティブ（暗い）で外見が変わる。 */
function drawTargets() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of targets) {
    const tx = t.x - TW/2, ty = t.y - TH/2;  // rrect は左上座標が必要なので中心から変換
    if (t.active) {
      ctx.fillStyle   = '#0044cc';   // 青背景: アクティブ
      ctx.strokeStyle = '#44aaff';   // 明るい青枠線
      ctx.shadowColor = '#44aaff';
      ctx.shadowBlur  = 12;          // 青グロー
    } else {
      ctx.fillStyle   = '#111128';   // 暗い背景: 非アクティブ（消灯）
      ctx.strokeStyle = '#2a2a50';
      ctx.shadowBlur  = 0;           // グローなし
    }
    rrect(tx, ty, TW, TH, 4);       // 角丸矩形のパスを生成
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = t.active ? '#ffffff' : '#333355';  // アクティブは白文字、非アクティブは暗い文字
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.fillText(t.pts, t.x, t.y);  // 得点数値をターゲット中央に描画
  }
  ctx.restore();
}

/** 左右フリッパーを描画する。白い太い線＋シアングロー。 */
function drawFlippers() {
  ctx.save();
  ctx.lineCap = 'round';        // 端を丸くして見た目を整える
  ctx.shadowColor = '#00e5ff';  // シアングロー
  ctx.shadowBlur  = 14;

  const lTip = tipPos(lFlip, LPX,  1);  // 左フリッパーの先端座標
  const rTip = tipPos(rFlip, RPX, -1);  // 右フリッパーの先端座標

  // 左右フリッパーをループで描画（ピボット → 先端 の線分）
  for (const [x1, y1, x2, y2] of [
    [LPX, FY, lTip.x, lTip.y],
    [RPX, FY, rTip.x, rTip.y],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#ffffff';  // 白いフリッパー本体
    ctx.lineWidth   = FW;         // 太さ FW（11px）
    ctx.stroke();
  }
  ctx.restore();
}

/** フリッパーのピボット部分に円形キャップを描画する。 */
function drawPivotCaps() {
  ctx.save();
  ctx.shadowColor = '#00e5ff';  // シアングロー
  ctx.shadowBlur  = 10;
  for (const cx of [LPX, RPX]) {  // 左右ピボットに同じ処理
    ctx.beginPath();
    ctx.arc(cx, FY, CAP_R, 0, Math.PI*2);
    ctx.fillStyle   = '#ffffff';       // 白い円
    ctx.strokeStyle = '#aaaacc';       // 薄い輪郭線
    ctx.lineWidth   = 1.2;
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** ボールを描画する。動いていれば速度方向に向かってモーショントレイルを表示する。 */
function drawBall() {
  ctx.save();

  // モーショントレイル（残像）
  if (ball.vx !== 0 || ball.vy !== 0) {
    const spd = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
    const trailLen = Math.min(spd * 0.012, 14);
    // トレイルの長さ: 速度に比例するが最大 14px に制限
    const ux = ball.vx / spd, uy = ball.vy / spd;
    // 速度の単位ベクトル（進行方向）
    const grd = ctx.createLinearGradient(
      ball.x - ux*trailLen, ball.y - uy*trailLen,  // トレイル始点
      ball.x, ball.y                                 // ボール中心（終点）
    );
    grd.addColorStop(0, 'rgba(0,229,255,0)');    // 始点: 透明
    grd.addColorStop(1, 'rgba(0,229,255,0.25)'); // 終点: 25% 透明シアン
    ctx.beginPath();
    ctx.arc(ball.x - ux*trailLen, ball.y - uy*trailLen, BR*0.5, 0, Math.PI*2);
    // トレイルは半径 BR*0.5（ボールの半分）の小さい円で表現
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // ボール本体
  ctx.shadowColor = '#ffffff';  // 白いグロー
  ctx.shadowBlur  = 22;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BR, 0, Math.PI*2);
  ctx.fillStyle = '#ffffff';                      // 白い球体
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,160,220,0.6)';     // 薄い青紫の輪郭線（立体感）
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

/** スコアポップアップ（「+100」など）を描画する。alpha に従い透明度が変化する。 */
function drawPopups() {
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = 'bold 17px Orbitron, monospace';
  for (const p of popups) {
    // 得点に応じて色を変える: 10000pt以上=黄, 1000pt以上=オレンジ, それ以下=白
    const col = p.pts >= 10000 ? '#ffd600' : p.pts >= 1000 ? '#ff6d00' : '#ffffff';
    ctx.globalAlpha  = Math.max(0, p.alpha);  // alpha が負にならないよう 0 でクランプ
    ctx.fillStyle    = col;
    ctx.shadowColor  = col;
    ctx.shadowBlur   = 10;
    ctx.fillText(`+${p.pts}`, p.x, p.y);
  }
  ctx.globalAlpha = 1;  // グローバルアルファを 1（不透明）に戻す
  ctx.restore();
}


// ╔══════════════════════════════════════════════════════╗
// ║ 10. ゲームフロー（GAME FLOW）                        ║
// ╚══════════════════════════════════════════════════════╝
// スコア管理・画面遷移・ボールの発射/消失/終了処理。

/**
 * スコア表示を更新し、桁数に応じてフォントサイズを自動縮小する。
 * CSS の clamp() はテキスト量を関知しないため、JS 側で桁数を判定して
 * style.fontSize を上書きする。7 桁以下は CSS デフォルト（clamp 値）を維持。
 * @param {number} val - 表示する数値
 */
function updateScoreDisplay(val) {
  const el     = document.getElementById('score-display');
  el.textContent = val;
  const digits = String(val).length;
  //  〜 7桁: デフォルト（clamp: 2.6rem〜3.6rem）
  //  8〜 9桁: 2.2rem
  // 10〜11桁: 1.6rem
  //   12桁〜: 1.2rem
  if      (digits <= 7)  el.style.fontSize = '';
  else if (digits <= 9)  el.style.fontSize = '2.2rem';
  else if (digits <= 11) el.style.fontSize = '1.6rem';
  else                   el.style.fontSize = '1.2rem';
}

/**
 * 得点を加算してポップアップを表示する。
 * スコアはカウントアップアニメーションで増加させてワクワク感を演出する。
 * @param {number} pts - 加算する点数
 * @param {number} x   - ポップアップ表示 X 座標
 * @param {number} y   - ポップアップ表示 Y 座標
 */
function scoreAt(pts, x, y) {
  score += pts;
  popups.push({ x, y, pts, alpha: 1.0 });
  // カウントアップアニメーション
  // displayScore を目標の score まで段階的に増やす
  // step を pts/40 にすることで、元の pts/20 より 2 倍ゆっくりカウントアップする
  const target = score;
  const step   = Math.max(1, Math.floor(pts / 40)); // 1フレームあたりの増加量（半速）
  function tick() {
    displayScore = Math.min(displayScore + step, target);
    updateScoreDisplay(displayScore);
    if (displayScore < target) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** HUD のボール残数表示（●●●●●）を現在の ballsLeft に合わせて更新する。 */
function refreshBallsHUD() {
  let s = '';
  for (let i = 0; i < MAX_BALLS; i++) s += (i < ballsLeft) ? '●' : '○';
  // 残りボール分だけ ● を並べ、消費した分は ○ に変える
  document.getElementById('balls-display').textContent = s;
}

/**
 * 新しいボールをフィールド中央上部から発射して balls 配列に追加する。
 */
function launchBall() {
  balls.push({
    x:  BSX,
    y:  BSY,
    vx: (Math.random() < 0.5 ? 1 : -1) * (70 + Math.random() * 20),
    vy: -(340 + Math.random() * 30),
    active: true
  });
  awaitingRespawn = false;
  draining = false;
  sndLaunch();
}

/**
 * ボールが1個フィールドから消えた時に呼ばれる。
 * 全ボールが消えた場合のみ1秒待機してから残機を1減らし次のボールを発射する。
 * awaitingRespawn フラグで二重タイマーを防ぐ。
 */
function oneBallDrained() {
  sndDrain();

  // まだフィールド上にボールが残っている間は何もしない（マルチボール継続）
  if (balls.length > 0) return;

  // 全ボール消失 → リスポーン待ち開始（二重起動防止）
  if (awaitingRespawn) return;
  awaitingRespawn = true;
  draining = true;

  setTimeout(() => {
    if (!running) return;  // その間にゲームが終了していたら無視
    ballsLeft--;
    refreshBallsHUD();
    draining = false;
    awaitingRespawn = false;

    if (ballsLeft <= 0) {
      setTimeout(endGame, 700);
    } else {
      launchBall();
    }
  }, 1000);  // 全消滅から1秒後にリスポーン
}

/**
 * ゲームを開始（またはリスタート）する。
 * HTML の onclick から呼ばれるため、グローバル関数として定義する。
 */
function startGame() {       // eslint-disable-line no-unused-vars
  score        = 0;
  displayScore = 0;
  ballsLeft = MAX_BALLS;
  running   = true;
  draining  = false;
  awaitingRespawn = false;
  balls = [];  // 全ボールをクリア
  popups.length = 0;

  // フリッパーを初期角度にリセット
  lFlip.angle = lFlip.target = REST_A;
  rFlip.angle = rFlip.target = REST_A;
  lFlip.raising = rFlip.raising = false;

  // ターゲットの点灯状態と発光タイマーをリセット
  for (const t of targets) { t.active = true; t.restore = 4; }
  for (const b of bumpers) b.flash = 0;
  for (const sl of slings) sl.flash = 0;

  updateScoreDisplay(0);
  document.getElementById('top-highscore').textContent = hiScore;
  refreshBallsHUD();

  showScreen('screen-game');   // ゲーム画面に遷移
  launchBall();                // 最初のボールを発射

  if (rafId) cancelAnimationFrame(rafId);
  // 既存のループが走っていれば停止（リスタート時の多重ループを防ぐ）
  lastTs = performance.now();
  rafId  = requestAnimationFrame(gameLoop);  // 新しいループを開始
}

/**
 * ゲーム終了処理。ループを停止し、ハイスコアを保存してリザルト画面に遷移する。
 */
function endGame() {
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  sndGameOver();

  const isNew = score > hiScore;
  if (isNew) {
    hiScore = score;
    localStorage.setItem('fdl_pinball_hi', hiScore);
    // ブラウザの localStorage に新しいハイスコアを永続保存する。
    // localStorage はドメイン単位で保存され、ページを閉じても残る。
  }

  // リザルト画面の各要素にスコアを書き込む
  document.getElementById('result-score').textContent     = score;
  document.getElementById('result-highscore').textContent = hiScore;
  document.getElementById('top-highscore').textContent    = hiScore;
  document.getElementById('new-record-area').hidden = !isNew;
  // !isNew: 新記録でなければ hidden 属性を true にして新記録バナーを非表示にする

  showScreen('screen-result');  // リザルト画面に遷移
}

/**
 * タイトル画面に戻る。HTML の onclick から呼ばれる。
 * ゲームループを停止してからタイトル画面を表示する。
 */
function goToTop() {         // eslint-disable-line no-unused-vars
  running = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  balls = [];  // 全ボールをクリア
  document.getElementById('top-highscore').textContent = hiScore;
  showScreen('screen-top');
}

/**
 * 画面を切り替える。全 .screen 要素から active クラスを外し、
 * 指定した id の要素に active クラスを付けて表示する。
 * aria-hidden 属性も合わせて更新してアクセシビリティに対応する。
 * @param {string} id - 表示したい画面の要素 ID
 */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden', 'true');   // 非表示画面をスクリーンリーダーから隠す
  });
  const el = document.getElementById(id);
  el.classList.add('active');
  el.removeAttribute('aria-hidden');         // 表示画面をスクリーンリーダーに認識させる
}


// ╔══════════════════════════════════════════════════════╗
// ║ 11. 入力処理（INPUT）                                ║
// ╚══════════════════════════════════════════════════════╝
// キーボード・マウス・タッチの 3 種類の入力をサポートする。
// いずれもフリッパーの raise（上げる）/ lower（下げる）を呼ぶだけで
// 実際の動作はゲームループ内の updateFlipper に委ねる設計。

/**
 * フリッパーを上げる（目標角度を ACT_A に設定）。
 * すでに上がっている場合は音を鳴らさない（連打時の音割れ防止）。
 */
const raise = (flip) => {
  if (flip.target !== ACT_A) sndFlipper();  // 状態が変わる時だけ効果音を鳴らす
  flip.target = ACT_A;
};
/** フリッパーを下げる（目標角度を REST_A に設定）。 */
const lower = (flip) => { flip.target = REST_A; };

/* ── キーボード入力 ──────────────────────────────────── */
const keysDown = new Set();
// 現在押されているキーのセット。Set を使うことで同じキーの重複を防ぎ、
// 複数キー同時押しを効率よく管理する。

document.addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))
    e.preventDefault();
  // 矢印キーとスペースキーによるページスクロールを防ぐ。
  // e.preventDefault() を呼ばないと、キー操作でページが動いてしまう。

  if (keysDown.has(e.code)) return;
  // キーリピート（長押し時の連続 keydown）を無視する。
  // Set にすでにあれば初回押下でないため処理をスキップ。

  keysDown.add(e.code);
  if (!running) return;  // ゲームが動いていなければ操作を無視
  if (e.code === 'KeyZ'    || e.code === 'ArrowLeft')  raise(lFlip);  // Z または ← で左フリッパー
  if (e.code === 'KeyM'    || e.code === 'ArrowRight') raise(rFlip);  // M または → で右フリッパー
});

document.addEventListener('keyup', e => {
  keysDown.delete(e.code);
  // 離したキーを Set から削除。これにより「まだ押しているキー」が正確に管理できる。
  if (!keysDown.has('KeyZ') && !keysDown.has('ArrowLeft'))  lower(lFlip);
  // 左フリッパーに対応するキーが両方とも離されていれば下げる（どちらか片方でも押していれば維持）
  if (!keysDown.has('KeyM') && !keysDown.has('ArrowRight')) lower(rFlip);
});

/* ── マウス / タッチ 共通ヘルパー（init 内で登録）────── */

/**
 * クライアント座標（ブラウザウィンドウ基準）を
 * Canvas 内部座標（内部解像度基準）に変換する。
 * Canvas が CSS で縮小表示されている場合に必要。
 * @param {number} clientX - マウス/タッチのクライアント X 座標
 */
function canvasX(clientX) {
  const r = canvas.getBoundingClientRect();
  // getBoundingClientRect(): Canvas の画面上の位置・サイズを取得する
  return (clientX - r.left) * (CW / r.width);
  // (クリック位置 - Canvas 左端) × (内部解像度 / 表示幅) = Canvas 内部 X 座標
}

let mouseZone = null;
// マウスが押されている側。'L'（左半分）/ 'R'（右半分）/ null（離れている）。

const touches = new Map();   // タッチID → 'L' | 'R' のマップ
// Map のキー: Touch.identifier（各指を一意に識別する番号）
// Map の値: そのタッチが左半分か右半分かを示す 'L' または 'R'

/**
 * 現在アクティブなタッチに基づいてフリッパーの状態を同期する。
 * 左側のタッチがあれば左フリッパーを上げ、なければ下げる（右も同様）。
 * マルチタッチ（両手同時操作）に対応するために Map で管理している。
 */
function syncTouchFlippers() {
  const hasL = [...touches.values()].some(z => z === 'L');
  const hasR = [...touches.values()].some(z => z === 'R');
  if (hasL) raise(lFlip); else lower(lFlip);
  if (hasR) raise(rFlip); else lower(rFlip);
}


// ╔══════════════════════════════════════════════════════╗
// ║ 12. 初期化（INIT）                                   ║
// ╚══════════════════════════════════════════════════════╝
// DOMContentLoaded: HTML のパースが完了した時点で発火するイベント。
// DOM 要素（canvas など）が確実に存在する状態になってから処理を開始する。
// window.onload より早く発火する（画像・CSSの読み込み完了を待たない）。

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  // ×（タイトルへ戻る）ボタンを非表示にする
  const quitBtn = document.querySelector('.btn-quit');
  if (quitBtn) quitBtn.style.display = 'none';

  document.getElementById('top-highscore').textContent = hiScore;
  showScreen('screen-top');

  // ── マウス入力イベントの登録 ────────────────────────
  canvas.addEventListener('mousedown', e => {
    if (!running) return;
    mouseZone = canvasX(e.clientX) < CW/2 ? 'L' : 'R';
    // クリック位置が Canvas 左半分なら 'L'、右半分なら 'R'
    if (mouseZone === 'L') raise(lFlip); else raise(rFlip);
  });
  document.addEventListener('mouseup', () => {
    // mouseup は document に登録することで、Canvas 外でマウスを離した場合も確実に処理する
    if (mouseZone === 'L') lower(lFlip);
    else if (mouseZone === 'R') lower(rFlip);
    mouseZone = null;
  });

  // ── タッチ入力イベントの登録 ────────────────────────
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    // スクロール・ズーム・遅延クリックシミュレーションを防ぐ（必須）。
    // passive: false と組み合わせることで preventDefault() が有効になる。
    if (!running) return;
    for (const t of e.changedTouches) {
      // changedTouches: このイベントで状態が変化した指の一覧
      touches.set(t.identifier, canvasX(t.clientX) < CW/2 ? 'L' : 'R');
      // 新しい指タッチを Map に追加。identifier でどの指かを区別する。
    }
    syncTouchFlippers();
  }, { passive: false });
  // passive: false を明示することで preventDefault() を使えるようにする。
  // passive: true（デフォルト）では e.preventDefault() が無効になる。

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    for (const t of e.changedTouches) touches.delete(t.identifier);
    // 離した指を Map から削除
    syncTouchFlippers();  // 残っている指の状態に合わせてフリッパーを更新
  }, { passive: false });

  canvas.addEventListener('touchcancel', e => {
    // touchcancel: 電話着信・通知など外部要因でタッチが強制的に解除された時
    for (const t of e.changedTouches) touches.delete(t.identifier);
    syncTouchFlippers();  // キャンセルされた指を Map から削除してフリッパーを戻す
  });
});
