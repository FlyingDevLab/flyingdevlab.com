# 🔟 テンパズル（Ten Puzzle）

4つの数字と ＋ − × ÷ ・括弧をつかって **10** をつくるブラウザゲームです。
iOS アプリ「MAKE10」収録のテンパズルを移植したものです。

## 🎮 ゲーム概要

4枚の数字タイルを**すべて1回ずつ**使って、計算結果が 10 になる式を組み立てます。

3つのモードがあります。

| モード | 出題範囲 | 問題数 |
| --- | --- | --- |
| ⭐️ Normal | 解が5個以上の問題 | 505問 |
| ⭐️⭐️ Hard | 解が1〜4個の難問 | 47問 |
| ⭐️⭐️⭐️ Challenge | 難問＋10を作れない問題 | 210問 |

画面に出すモード名は Normal / Hard / Challenge の3段階です。
問題データ側の難易度コード（easy / normal / hard / impossible）とは別物で、
Normal モードは easy と normal をまとめた範囲を出題します。

Challenge モードには「そもそも10を作れない問題」が混ざります。
見破って「Can't make 10!」を押せば正解です。

1プレイは10問。モードごとにベスト記録が残ります。

## 🕹 操作方法

**PC**
- クリック：数字・記号を式に入れる
- 数字キー / `+` `-` `*` `/` `(` `)`：同じ入力ができる
- `Enter`：こたえあわせ
- `Backspace`：ひとつ戻す
- `Esc`：式をぜんぶ消す

**スマホ / タブレット**
- タップ：数字・記号を式に入れる

## 🧩 特徴

- 何度でも式を作り直せます。時間制限はありません
- 💡 Hint で解の例を表示できます（使った問題は加点されません）
- ベスト記録はブラウザ内（localStorage）にのみ保存されます

## 📁 ファイル構成

```
/ten-puzzle/
├── index.html   # 画面（トップ / ゲーム / リザルト）
├── style.css    # 見た目・レイアウト
├── game.js      # ゲームロジック＋問題データ715問
└── readme.md    # このファイル
```

## 🌐 表示言語

英語をメイン、日本語をサブとする方針でサイト内の他ゲームと揃えています。

- `html` は `lang="en"`。日本語の行には個別に `lang="ja"` を付与
- 日本語の従行は `.tip-ja`（`font-size: 0.9em`）で一段小さく表示
- `game.js` が出す判定メッセージは `Correct! / 正解！` のように英日併記
- モードの説明文は英語のみ。日本語の併記は行いません
  （ボタンのラベルや見出しは併記を残しています）

## 🧱 技術仕様

**外部リクエストはゼロです。**
フォントは `/fonts/` の Nunito を自己ホストし、問題データは `game.js` に
定数として直接埋め込んでいます。fetch も XHR も使っていないため、
オフラインでも動作します。

### 問題データ

MAKE10 アプリの `ten_puzzle_problems.json`（全715問）から生成しました。
アプリとまったく同じ問題・同じ難易度が出ます。

1問の形式は `[数字4桁, 解の個数, 難易度コード, 解の例]` です。
オブジェクト形式のままだとキー名が715回くり返されてファイルが5倍以上に
膨らむため、配列に圧縮して約18KBに収めています。

難易度コード： `e` = easy（403問） / `n` = normal（102問） /
`h` = hard（47問） / `x` = impossible（163問）

問題を作り直したいときは、MAKE10 リポジトリの
`Scripts/ten_puzzle_solver.py` で再生成できます。

### 判定ロジック

アプリ側の `TenPuzzleModels.swift` と同じ手順です。

1. 4つの数字を全部使っているか
2. 式として文法的に正しいか（再帰下降パーサーで解析）
3. 計算結果が 10 か（誤差 `1e-9` まで許容）

3 でぴったり 10 かを見ずに誤差を許すのは ÷ があるためです。
`1÷3×3` は浮動小数点では `0.9999999999999998` になり、
厳密比較では正しい式が不正解になってしまいます。

**検証済み：** 収録されている解の例552件すべてが、このパーサーで
10 と判定されることを確認しています。

## 🔧 サイトに組み込むときの作業

このフォルダを置くだけでは TOP ページに出ません。以下の3箇所を手で足してください。

### 1. `index.html`（英語版）

`game-card-4`（Pinball）の直後、`</section>` の前に追加：

```html
      <!-- Ten Puzzle -->
      <a href="/ten-puzzle/" class="try-game-card fade-up" id="game-card-5" aria-label="Play Ten Puzzle in browser">
        <div class="try-game-inner">
          <div class="try-game-name" id="game-name-5">Ten Puzzle</div>
        </div>
      </a>
```

### 2. `ja/index.html`（日本語版）

同じ位置に追加：

```html
      <!-- Ten Puzzle -->
      <a href="/ten-puzzle/" class="try-game-card fade-up" id="game-card-5" aria-label="テンパズルをブラウザでプレイ">
        <div class="try-game-inner">
          <div class="try-game-name" id="game-name-5">テンパズル</div>
        </div>
      </a>
```

### 3. `sitemap.xml`

`/pinball/` の `</url>` の直後に追加（`lastmod` は公開日に直すこと）：

```xml
  <url>
    <loc>https://flyingdevlab.com/ten-puzzle/</loc>
    <lastmod>2026-08-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="ja" href="https://flyingdevlab.com/ten-puzzle/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://flyingdevlab.com/ten-puzzle/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://flyingdevlab.com/ten-puzzle/"/>
  </url>
```

また、リポジトリ README の「ファイル構成」表にも1行足しておくと揃います。

```
| `ten-puzzle/`        | ブラウザゲーム：テンパズル（四則演算で10をつくる） |
```

## 🎯 今後の拡張アイデア

- 問題数（現在10問固定）をモードごとに変える
- 解の個数を「あと何通りあるか」として見せる
- App Store 導線ボタンの有効化（`index.html` 内にコメントアウトで用意済み）

## 📜 ライセンス

MIT（MAKE10 リポジトリと同じ）
