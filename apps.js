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

// Object.freeze で配列を凍結し、JS側からの誤った追加・変更・削除を防ぐ
// アプリ一覧はこのファイル内でのみ定義・管理する
const APPS = Object.freeze([

  // ─── MAKE10 / 10をつくろう ───
  // 子ども向け・完全無料・広告なし。スタジオのブランド旗艦アプリ
  {
    id:      "make-ten",
    name:    "MAKE10 / 10をつくろう",
    name_en: "MAKE10",
    desc:    "完全無料、広告なし、安心安全のこども向けシンプルゲームアプリ。",
    desc_en: "A simple, safe game for kids — completely free, no ads.",
    icon:    "🔢",
    iconImg: "images/icon-MAKE10.png",
    status:  "coming",
    url:     null
  },

  // ─── 価格比べ（仮）───
  // 一般向けフリーミアムアプリ。単価を比較するユーティリティ
  {
    id:      "kakaku-kurabe",
    name:    "価格比べ（仮）",
    name_en: "Unit Price Compare (TBD)",
    desc:    "数量あたりの単価を計測。",
    desc_en: "Compare unit prices at a glance.",
    icon:    "🏷️",
    iconImg: "images/icon-kakakukurabe.png",
    status:  "coming",
    url:     null
  },


  // 次のアプリはここに追加してください ↓
]);
