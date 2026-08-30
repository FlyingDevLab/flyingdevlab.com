/**
 * apps.js — Flying Dev Lab アプリ一覧データ
 *
 * 新しいアプリを追加する時はここに1行追加するだけでTOPページに自動反映されます。
 * このファイルは index.html の <script src="apps.js"> で読み込まれ、
 * 同ページの index.html 内スクリプトが APPS 配列を参照してカードを描画します。
 *
 * ─── フィールド定義 ───
 *  id       {string}      必須  一意のアプリ識別子（英数字・ハイフン）
 *                               JavaScriptやCSSから参照するための内部ID。画面には表示されません。
 *  name     {string}      必須  アプリ名・日本語（そのまま表示されます）
 *  name_en  {string}      必須  アプリ名・英語
 *  desc     {string}      必須  説明文・日本語（HTMLタグ不可・プレーンテキストのみ）
 *  desc_en  {string}      必須  説明文・英語
 *  icon     {string}      必須  絵文字アイコン（iconImg がない場合のフォールバックとして表示）
 *  iconImg  {string|null} 任意  アイコン画像パス（指定すると絵文字より優先される）。「/」始まりの絶対パスで書くこと。
 *                               null を指定した場合は icon の絵文字が使われます。
 *  status   {string}      必須  "coming" = 近日公開 / "live" = 公開中
 *                               この値によってバッジの色とリンクの有無が変わります。
 *  url      {string|null} 条件  App Store URL（status が "live" の場合は必須）
 *                               "coming" のときは null を指定してください。
 *
 * ─── 使用例 ───
 * { id: "app-id", name: "アプリ名", name_en: "App Name", desc: "説明文", desc_en: "Description", icon: "🎯", iconImg: "/images/icon-app.png", status: "live", url: "https://apps.apple.com/..." },
 *
 * ⚠️ desc / desc_en にHTMLタグを入れないでください（XSS防止のためエスケープされます）。
 * ⚠️ アプリが8本を超えたら style.css の .fade-up:nth-child() にも追記してください。
 * ⚠️ iconImg は「/」で始まる絶対パスで書いてください（例: "/images/icon-xxx.png"）。
 *    "images/..." のような相対パスにすると、/ja/ などサブディレクトリのページから見たときに
 *    /ja/images/... を探してしまい、アイコンが表示されず icon の絵文字に化けます。
 *    画像パスの基準は「apps.js の場所」ではなく「そのページのURL」になるためです。
 */

/*
 * const：再代入できない定数を宣言するキーワード（ES6以降）。
 * var（再宣言・再代入どちらも可）や let（再代入のみ可）と異なり、
 * const は宣言後に APPS = [...] と書き換えることができません。
 * ただし配列の中身（要素の追加・変更）はそのままでは防げないため、
 * Object.freeze() と組み合わせて完全に固定しています。
 *
 * Object.freeze(配列やオブジェクト)：
 * 配列・オブジェクトの中身を凍結し、push（追加）・splice（削除）・
 * プロパティの変更をすべて禁止します。
 * アプリ一覧はこのファイル内でのみ定義・管理するという意図を
 * コードで明示するためのテクニックです。
 *
 * [ ] （配列リテラル）：
 * 複数の値をまとめて管理するデータ構造です。
 * 各要素は { } で囲まれたオブジェクト（ここではアプリ1件分のデータ）で、
 * カンマ区切りで並べます。
 */
const APPS = Object.freeze([

  /* --------------------------------------------------------------------
   * 変更: アプリ名から「MAKE10 - 」の接頭辞を外しました。
   *
   * 理由:
   *   同じTOPページの「Try in Browser」セクションに、単体ゲームとしての
   *   「MAKE10」（/make10/ の30秒チャレンジ）が別に存在します。
   *   iOSアプリ側を「Kids Game Collection」と呼び分けることで、
   *   「MAKE10 = ブラウザで遊べる単体ゲーム」
   *   「Kids Game Collection = iOSアプリ（ゲーム集）」
   *   という役割の違いが読み手に伝わります。
   *
   * 注意:
   *   App Store 側の表示名は「MAKE10 - Kids Game Collection」のままです。
   *   カードをタップした先で名前の見え方が変わる点は許容しています。
   *   App Store 側もリネームする場合は、ここの表記も合わせて見直してください。
   *
   * 日本語名について:
   *   /ja/ ページは「迷路」「モグラ叩き」など日本語表記で統一しているため、
   *   カタカナの「キッズゲームコレクション」を踏襲しました。
   *   英語表記に揃えたい場合は下の name: の1行だけを差し替えてください。
   * -------------------------------------------------------------------- */

  // ─── Kids Game Collection ───
  // 子ども向け・完全無料・広告なし。スタジオのブランド旗艦アプリ。
  {
    id:      "make-ten",       // 内部ID。他のアプリと重複しないようにしてください。
                               // 表示名は変わりましたが、内部IDは変更していません（識別子の安定性を優先）。
    name:    "キッズゲームコレクション", // 日本語ページで表示されるアプリ名
    name_en: "Kids Game Collection",     // 英語ページで表示されるアプリ名
    desc:    "完全無料、広告なし、安心安全のこども向けシンプルゲームアプリ。",
    desc_en: "A simple, safe game for kids — completely free, no ads.",
    icon:    "🔢",             // iconImg が読み込めない場合のフォールバック絵文字
    iconImg: "/images/icon-MAKE10.png", // アイコン画像パス。先頭の / が重要（/ja/ などサブページでも正しく読み込むため）。null にすると icon の絵文字が使われます。
    status:  "live",           // "live" = live バッジ表示・リンクあり
    url:     "https://apps.apple.com/app/id6760253962"
  },

  /* --------------------------------------------------------------------
   * 変更: 「価格比べ（仮）」を正式名称「PriceWise / 単価比べ」に更新し、
   *       status を "coming" から "live" に変更、App Store URL を設定しました。
   *
   * 理由:
   *   App Store Connect 上で 1.0.1 が「配信準備完了」となり公開されたため。
   *   Apple ID は 6764689863 です。
   *
   * 注意:
   *   id は "kakaku-kurabe" のまま据え置いています（内部IDのみで外部参照がなく、
   *   今のタイミングで変える必要がないため）。
   *   iconImg のファイル名も "/images/icon-kakakukurabe.png" のまま据え置きです。
   *   画像の中身が PriceWise の実アイコンに差し替え済みのため、パス変更は不要です。
   * -------------------------------------------------------------------- */

  // ─── PriceWise / 単価比べ ───
  // 一般向けフリーミアムアプリ。内容量あたりの単価を比較するユーティリティ。
  {
    id:      "kakaku-kurabe",  // 内部ID。旧名称「価格比べ（仮）」時代のIDをそのまま使用しています。
    name:    "単価比べ",
    name_en: "PriceWise",
    desc:    "内容量あたりの単価をすばやく比較。買い物の「どっちが得？」に即答。",
    desc_en: "Compare unit prices at a glance.",
    icon:    "🏷️",
    iconImg: "/images/icon-kakakukurabe.png", // 先頭の / で始まる絶対パス（/ja/ などサブページでも正しく読み込むため）
    status:  "live",           // "live" = live バッジ表示・リンクあり
    url:     "https://apps.apple.com/app/id6764689863"
  },

  /* --------------------------------------------------------------------
   * 追加: TechRef を新規エントリとして追加しました。
   *
   * 理由:
   *   開発中であることをサイト上で告知するため。
   *
   * status を "coming" にしている理由:
   *   App Store Connect 上では 1.0 が「提出準備中」の段階で、まだ審査に
   *   出していません。Apple ID（6775818457）は採番済みですが、App Store の
   *   商品ページはまだ存在しないため、URL を入れるとリンク先が404になります。
   *   審査を通過して公開されたら、status を "live" に変え、
   *   url に "https://apps.apple.com/app/id6775818457" を設定してください。
   * -------------------------------------------------------------------- */

  // ─── TechRef ───
  // 技術者向けリファレンスツール。無料お試し後に購入するモデル。
  {
    id:      "techref",
    name:    "TechRef",
    name_en: "TechRef",
    desc:    "インチ・ミリ・はめあい公差を、ひとつのアプリで即計算。",
    desc_en: "Inch, mm, and tolerance in one.",
    icon:    "📐",             // iconImg が読み込めない場合のフォールバック絵文字
    iconImg: "/images/icon-techref.png",
    status:  "coming",         // "coming" = COMING SOON バッジ表示・リンクなし
    url:     null              // 公開後は App Store の URL を入れてください
  },


  // ─── 次のアプリはここに追加してください ↓ ───
  // 上の { } ブロックをコピーして、全フィールドを書き換えてください。
  // status を "live" にする場合は url も必ず設定してください。
  // iconImg は必ず「/」始まりの絶対パスで（例: "/images/icon-xxx.png"）。相対パスだと /ja/ でアイコンが出ません。
]);
