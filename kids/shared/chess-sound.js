// ================================================================
// chess-sound.js – 駒の音
// ================================================================
//
// チェスの全ページが読み込む。巻でも「あそぶ」でも同じ音が鳴る。
//
// ★ 音の出どころはファイルではない。その場で作っている ★
//   /kids* の CSP は default-src 'none' で、media-src を書いていない。
//   つまり .wav や .mp3 を置いても読み込めない（実機で確認した。
//   "Loading media from … violates the following Content Security Policy"）。
//
//   Web Audio で波形を組み立てると、読み込みが1回も発生しないので
//   CSP の管轄に入らない。鳴らせることも実機で確認した。
//   おかげで _headers を緩めずに済み、音のファイルも1つも増えていない。
//   駒を SVG で書いて画像を増やさなかったのと同じやり方である。
//
// ★ 消せること ★
//   教室・図書館・きょうだいが寝ている横でも開かれる。
//   消す場所が無い音は、その場でページを閉じられるだけである。
//   消したかどうかは localStorage に置くが、読み書きの両方を try で
//   包み、使えない環境では「音あり」として続ける（レッスンの ✓ と同じ作法）。
//
// ★ 音は知らせの控えでしかない ★
//   音でしか分からないことを作らない。指した手は盤の印と棋譜に必ず出る。
//   耳が使えなくても、音を消していても、失われる情報は無い。
//
// ★ 最初の1回まで鳴らせない ★
//   ブラウザは「人が触る前」の音を止める。だから AudioContext は
//   最初に触られたときに作る。それより前の呼び出しは黙って捨てる。
//   捨てても困らない（鳴るのは人が駒を動かした後だけなので）。
//
// DOM に触らない。ボタンを作るのは画面側の仕事。
// ================================================================

(function (root) {
  'use strict';

  var KEY = 'fdl_chess_sound';
  var ctx = null;
  var on = true;

  try {
    var saved = root.localStorage && root.localStorage.getItem(KEY);
    if (saved === '0') on = false;
  } catch (e) { /* 使えないだけ。音ありのまま続ける */ }

  function remember() {
    try { root.localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* 使えないだけ */ }
  }

  // 人が触った後でなければ作れない。作れなければ null のまま
  function audio() {
    if (ctx) {
      // タブを戻ったときなどに止まっていることがある
      if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) { /* 鳴らないだけ */ } }
      return ctx;
    }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; }
    return ctx;
  }

  // 音ひとつ。
  //   freq  高さ（Hz）
  //   ms    長さ
  //   peak  いちばん大きいところ（1.0 が最大。小さく作ってある）
  //   type  波のかたち
  //
  // 立ち上がりに 4ms かけているのは、いきなり鳴らすと
  // 「プチッ」という別の音が頭に付くため。
  // 終わりも 0 まで落とさず指数で小さくしてから止める（同じ理由）。
  function tone(freq, ms, peak, type, delay) {
    var ac = audio();
    if (!ac) return;
    var t0 = ac.currentTime + (delay || 0);
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000 + 0.02);
  }

  // 駒を置いた・動かした。低く短く、木を置いたような音
  function move() {
    if (!on) return;
    tone(190, 70, 0.14, 'triangle');
    tone(95, 90, 0.10, 'sine');
  }

  // 取った。置くより少し低くて強い。重なりで「ゴッ」と聞こえる
  function capture() {
    if (!on) return;
    tone(140, 110, 0.18, 'triangle');
    tone(70, 130, 0.13, 'square');
  }

  // チェック。上に抜ける音にして、置く音と取り違えないようにする
  function check() {
    if (!on) return;
    tone(740, 90, 0.12, 'sine');
    tone(1110, 110, 0.09, 'sine', 0.07);
  }

  // 決着。2つ鳴らす。勝ち負けでは変えない
  // （引き分けも含めて「終わった」を伝えるだけのため）
  function over() {
    if (!on) return;
    tone(520, 140, 0.13, 'triangle');
    tone(780, 220, 0.12, 'triangle', 0.13);
  }

  root.ChessSound = {
    move: move,
    capture: capture,
    check: check,
    over: over,
    isOn: function () { return on; },
    set: function (want) {
      on = !!want;
      remember();
      // 入れた直後に1つ鳴らす。切ったときは鳴らさない
      // （切ったのに音が出ると、切れていないように見える）
      if (on) move();
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
