/**
 * apps.js — Flying Dev Lab アプリ一覧データ
 *
 * 新しいアプリを追加する時はここに1行追加するだけでTOPページに自動反映されます。
 *
 * ─── フィールド定義 ───
 *  id       {string}      必須  一意のアプリ識別子（英数字・ハイフン）
 *  name     {string}      必須  アプリ名・日本語（そのまま表示されます）
 *  name_en  {string}      必須  アプリ名・英語
 *  desc     {string}      必須  説明文・日本語（HTMLタグ不可・プレーンテキストのみ）
 *  desc_en  {string}      必須  説明文・英語
 *  icon     {string}      必須  絵文字アイコン（iconImg がない場合に表示）
 *  iconImg  {string|null} 任意  アイコン画像パス（指定すると絵文字より優先）
 *  status   {string}      必須  "coming" = 近日公開 / "live" = 公開中
 *  url      {string|null} 条件  App Store URL（status が "live" の場合は必須）
 *
 * ─── 使用例 ───
 * { id: "app-id", name: "アプリ名", name_en: "App Name", desc: "説明文", desc_en: "Description", icon: "🎯", iconImg: "icon-app.png", status: "live", url: "https://apps.apple.com/..." },
 *
 * ⚠️ desc / desc_en にHTMLタグを入れないでください（XSS防止のためエスケープされます）。
 * ⚠️ アプリが8本を超えたら style.css の .fade-up:nth-child() にも追記してください。
 */

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
 *  iconImg  {string|null} 任意  アイコン画像パス（指定すると絵文字より優先される）
 *                               null を指定した場合は icon の絵文字が使われます。
 *  status   {string}      必須  "coming" = 近日公開 / "live" = 公開中
 *                               この値によってバッジの色とリンクの有無が変わります。
 *  url      {string|null} 条件  App Store URL（status が "live" の場合は必須）
 *                               "coming" のときは null を指定してください。
 *
 * ─── 使用例 ───
 * { id: "app-id", name: "アプリ名", name_en: "App Name", desc: "説明文", desc_en: "Description", icon: "🎯", iconImg: "icon-app.png", status: "live", url: "https://apps.apple.com/..." },
 *
 * ⚠️ desc / desc_en にHTMLタグを入れないでください（XSS防止のためエスケープされます）。
 * ⚠️ アプリが8本を超えたら style.css の .fade-up:nth-child() にも追記してください。
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

  // ─── MAKE10 / 10をつくろう ───
  // 子ども向け・完全無料・広告なし。スタジオのブランド旗艦アプリ。
  // status: "coming" のため url は null。公開されたら "live" に変え url を設定してください。
  {
    id:      "make-ten",       // 内部ID。他のアプリと重複しないようにしてください。
    name:    "MAKE10 / 10をつくろう", // 日本語タブで表示されるアプリ名
    name_en: "MAKE10",               // 英語タブで表示されるアプリ名
    desc:    "完全無料、広告なし、安心安全のこども向けシンプルゲームアプリ。",
    desc_en: "A simple, safe game for kids — completely free, no ads.",
    icon:    "🔢",             // iconImg が読み込めない場合のフォールバック絵文字
    iconImg: "images/icon-MAKE10.png", // 実際のアイコン画像パス。null にすると icon の絵文字が使われます。
    status:  "live",         // "live" = live バッジ表示・リンクあり
    url:     "https://apps.apple.com/app/id6760253962"              // 公開中は App Store の URL を入れてください
  },

  // ─── 価格比べ（仮）───
  // 一般向けフリーミアムアプリ。単価を比較するユーティリティ。
  // アプリ名・説明文は正式決定後に更新してください。
  {
    id:      "kakaku-kurabe",
    name:    "価格比べ（仮）",
    name_en: "Unit Price Compare (TBD)",
    desc:    "数量あたりの単価を計測。",
    desc_en: "Compare unit prices at a glance.",
    icon:    "🏷️",
    iconImg: "images/icon-kakakukurabe.png",
    status:  "coming",         // "coming" = COMING SOON バッジ表示・リンクなし
    url:     null              // 公開後は App Store の URL を入れてください
  },


  // ─── 次のアプリはここに追加してください ↓ ───
  // 上の { } ブロックをコピーして、全フィールドを書き換えてください。
  // status を "live" にする場合は url も必ず設定してください。
]);
