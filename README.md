# 空飛ぶ研究室 / Flying Dev Lab 🐘
こどもも大人も笑顔になる、安心・安全・便利な アプリをつくっています。  
Making safe, reliable, and delightful apps — for kids and grown-ups alike.

🌐 [flyingdevlab.com](https://flyingdevlab.com)

---

## 私について / About Us

### Background & Philosophy

高校時代にBASIC言語に触れたことからプログラミングの歩みを始めました。
前職の航空宇宙関連企業では、安全管理や情報機密保持が極めて重要視される環境に身を置いていました。
そこで培われた「正確さ」と「誠実さ」を、現在はソフトウェア開発における大切な指針としています。

My programming journey began with the BASIC language during my time at a technical high school. 
My subsequent career in the aerospace industry involved working within environments that demanded the highest standards of safety and information security.
The principles of "precision" and "integrity" I embraced there now serve as the core philosophy behind my software development.

### The Mission

親戚のこどもが広告の多いアプリで遊んでいる姿を見て、より健やかなデジタル環境の必要性を感じ、個人開発をスタートしました。
「こどもたちが安心して活用できる、シンプルで誠実なツールを届けたい」という想いから、広告や過剰な演出を排除したアプリ制作に取り組んでいます。

The sight of a young relative playing with apps cluttered with advertisements inspired me to start independent development.
With a mission to "provide simple, honest tools that children can use with peace of mind," I strive to create apps free from intrusive ads and focused on genuine utility.

---

## こどもたちへの誓い / Our Pledge to Children

私たちは、こどもを利益の手段にしません。  
こども向けアプリは**広告なし・課金なし・開発者や第三者へのデータ送信なし**で設計しています。  
（アプリによっては、設定を有効にすると記録を利用者自身の iCloud にのみ保存します。開発者は受け取りません）

We never treat children as a means to profit.  
Our children's apps are built with **no ads, no in-app purchases, and no data sent to the developer or any third party**.  
(Some apps can save records to your own iCloud when you turn that setting on. The developer never receives them.)

📜 [誓いの全文を読む / Read the full pledge](https://flyingdevlab.com/pledge)

---

## ファイル構成 / Structure

| ファイル | 内容 |
|--------|------|
| `index.html` | トップページ（英語） |
| `ja/` | トップページ（日本語） |
| `privacy-policy.html` | プライバシーポリシー・免責事項 |
| `tokusho.html` | 特定商取引法に基づく表示 |
| `pledge.html` | こどもたちへの誓い |
| `404.html` | カスタム 404 ページ |
| `style.css` | 共通スタイル |
| `sitemap.xml` | サイトマップ |
| `robots.txt` | クローラー設定 |
| `_headers` | Cloudflare Pages のHTTPヘッダー定義 |
| `_redirects` | Cloudflare Pages のリダイレクト定義（旧ゲームURLの301転送） |
| `.github/workflows/` | `/kids/` に外部リンクが混入していないかの自動検査 |
| `app-ads.txt` | AdMob 用の販売者宣言（PriceWise） |
| `fonts/` | 自己ホストフォント（woff2 + OFLライセンス） |
| `favicon.ico` | ファビコン |
| `favicon-512.png` | 高解像度ファビコン（512×512） |
| `apple-touch-icon.png` | iOS ホーム画面用アイコン |
| `ogp.png` | OGP / SNS シェア用画像 |
| `kids/` | こども向け領域。ハブ1枚とブラウザゲーム5本 |
| `kids/index.html` | ハブ「Playing Dev Lab / 遊びの研究室」 |
| `kids/make10/` | ブラウザゲーム：MAKE10（10をつくろう） |
| `kids/cheese-escape-web/` | ブラウザゲーム：MAZE（迷路） |
| `kids/whack-a-mole/` | ブラウザゲーム：Whack-a-Mole（モグラ叩き） |
| `kids/pinball/` | ブラウザゲーム：Pinball（ピンボール） |
| `kids/ten-puzzle/` | ブラウザゲーム：Ten Puzzle（テンパズル） |
| `privacy-policy/` | アプリ別プライバシーポリシー（App Store登録用・多言語対応） |

### この表に無いもの

| 対象 | 理由 |
|---|---|
| `images/` | アプリアイコン等の画像アセット。権利のある素材を再配布しないため `.gitignore` で除外しており、**GitHub 上には存在しない**。サイトでは表示される（Cloudflare Pages へのデプロイは `.gitignore` を参照しないため） |
| `apps.js` | TOP のアプリ一覧データだったが、JS無効環境で空白になる問題のため静的HTML直書きに変更した。ファイルはリポジトリ外に退避済み |

⚠️ `images/` がリポジトリに無いため、**クローンしただけではサイトを完全には再現できません**。
また、この構成はフォルダを直接アップロードするデプロイを前提としています。
Git連携デプロイに切り替えると画像が 404 になります。

### こども向け領域について

`kids/` 配下は、こどもが外部サイトへ出られないよう**外部リンクを1本も持たない**構成にしています。

- ハブからも各ゲームからも、TOP・SNS・App Store へのリンクを置いていない
- `_headers` の `/kids*` ブロックが `default-src 'none'` を敷き、外部読み込みを遮断している
- リンクについては CSP で防げないため、`.github/workflows/` の自動検査が担当している

ブラウザゲームのページは英語をメイン、日本語をサブとして表示しています。
`html` の `lang` は `en`（`ja/` のみ `ja`）で、日本語の行には個別に `lang="ja"` を付けています。

---

## 技術スタック / Tech Stack & Qualifications

### Stack

- **Languages:** Swift (SwiftUI), HTML5, CSS3, JavaScript
- **Hosting:** Cloudflare Pages
- **Typography:** Self-hosted latin webfonts (Outfit / Nunito / Orbitron / Boogaloo) + system font stack for Japanese (Noto Sans JP / Hiragino / Yu Gothic)
- **Tools:** VS Code, Xcode, M4 MacBook Pro

### Qualifications

- **ITパスポート (国家資格):** IT全般および経営戦略の体系的理解
- **Webクリエイター能力認定試験 エキスパート:** デザインと実装の専門スキル証明

---

## フォロー / Follow Us

最新情報は 𝕏 をフォローして通知を受け取ってね。  
Follow us on 𝕏 and turn on notifications to stay up to date.

[𝕏 @FlyingDevLab](https://x.com/FlyingDevLab)

---

## ライセンス / License

このリポジトリのコードはすべて公開しています。  
自由に見て、学んで、参考にしてください。

私たちが守りたいのはコードではなく、こどもたちの未来です。  

This repository is fully open.  
You are free to view, learn from, and reference it.

What we protect is not our code — it's children.

---

コードは [MIT ライセンス](LICENSE)です。

ただし次の2つは対象が異なります。詳しくは [LICENSE](LICENSE) をご覧ください。

| 対象 | 扱い |
|---|---|
| `fonts/` 配下のフォント | 各提供元の **SIL Open Font License (OFL)**。条件は [fonts/README.md](fonts/README.md) にまとめています |
| 誓い・ポリシーの文章 | MIT の対象外。構成を参考にするのは歓迎しますが、文章は自分の言葉で書いてください |

The code is under the [MIT License](LICENSE).
Fonts stay under their own OFL, and the pledge and policy texts are not
covered — see [LICENSE](LICENSE) for why.
