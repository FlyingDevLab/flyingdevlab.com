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
| `kids/` | こども向け領域。ハブ1枚とブラウザゲーム10本 |
| `kids/index.html` | ハブ「Playing Dev Lab / 遊びの研究室」 |
| `kids/make10/` | ブラウザゲーム：MAKE10（10をつくろう） |
| `kids/cheese-escape-web/` | ブラウザゲーム：MAZE（迷路） |
| `kids/whack-a-mole/` | ブラウザゲーム：Whack-a-Mole（モグラ叩き） |
| `kids/pinball/` | ブラウザゲーム：Pinball（ピンボール） |
| `kids/ten-puzzle/` | ブラウザゲーム：Ten Puzzle（テンパズル） |
| `kids/memory/` | ブラウザゲーム：Animal Match（どうぶつめくり） |
| `kids/hakoiri-musume/` | ブラウザゲーム：箱入り娘（日本語版） |
| `kids/klotski/` | ブラウザゲーム：KLOTSKI（箱入り娘の英語版） |
| `kids/huarongdao/` | ブラウザゲーム：華容道（箱入り娘の中国語版・繁体字） |
| `kids/river-crossing/` | ブラウザゲーム：River Crossing（川渡り） |
| `kids/shared/` | 上記3本が共有する盤面エンジン（`klotski.js`） |
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

例外が3本あります。箱入り娘・KLOTSKI・華容道は、同じパズルを言語ごとに
別のページに分けたもので、それぞれ1言語だけで書かれています。

| ページ | `lang` | 画面の文字 |
|---|---|---|
| `kids/hakoiri-musume/` | `ja` | 日本語だけ（娘・父・母・番頭・丁稚・女中） |
| `kids/klotski/` | `en` | 英語だけ。駒には文字を書いていない |
| `kids/huarongdao/` | `zh-Hant` | 繁体字だけ（曹操・關羽・張飛・趙雲・馬超・黃忠・兵） |

盤も駒の構成も3本とも同じです。違うのは名札と色と文言、そして始まりの配置だけなので、
盤を動かす仕組みは `kids/shared/klotski.js` に1本だけ置いて共有しています。
**ここを直すと3本すべてが変わります。** 直したら3本とも開いて確かめてください。

始まりの配置は、盤面を総当たりで解いて最短手数を確かめたうえで選んでいます
（KLOTSKI 32手 / 華容道 81手 / 箱入り娘 81〜120手）。
華容道は名前を確かめられた唯一の布局「橫刀立馬」なので動かしていません。

箱入り娘だけ、むずかしさを4段から選べます。

| | 最短 | 駒立て |
|---|---|---|
| 標準 | 81手 | 古典（縦2マス4枚・横2マス1枚） |
| 難関 | 89手 | 古典 |
| おこ | 103手 | 横2マスが3枚（父・母・番頭） |
| 激おこ | 120手 | 横2マスが3枚 |

最初は標準と難関だけを選べて、どれか1つクリアすると残りが開きます。
盤を入れ替える仕組みは共有エンジンの `setLayout` で、
クリアの知らせは `onClear` です。他の2本はどちらも使っていません。
配置を変えるときは、解き直してから各ゲームの注記を書き換えてください。

### 時間を計っていません

ブラウザゲームのうち、箱入り娘・KLOTSKI・華容道・川渡りの4本は、
以前あった経過時間の表示を外しました（2026-10-28）。

動いている時計は、こどもにとって「急がなければいけない」という合図になります。
この4本はどれも、盤を眺めて考えることが中身のパズルで、速さを競うものではありません。
記録として残すのも手数だけにしています。

モグラ叩き・MAKE10 のように、制限時間そのものが遊びの骨組みになっているゲームは
対象外です。あちらは時間が無いと成立しません。

---

sitemap では、この3本だけが互いを `hreflang` の代替として申告しています
（サイト内の他のURLは1ページに日英を併記しているため、自分自身を指しています）。

### 川渡り（River Crossing）について

舟でみんなを向こう岸へ運ぶ古典パズルを4題まとめたものです。

| | 題材 | 舟 | 最短 |
|---|---|---|---|
| 1 | おおかみと やぎと キャベツ | せんどう＋1人 | 7回 |
| 2 | おとなと こども | おとな1人 または こども2人 | 9回 |
| 3 | 3くみの おやこ | 2人乗り・だれでも漕げる | 11回 |
| 4 | 8にんの いかだ | 2人乗り・漕げるのは3人 | 17回 |

手数は「川を渡った回数」です。時間は計っていません（理由は上の節に書きました）。
いずれも幅優先探索で全状態を調べて確かめました。
判定は実装と同じく「渡り終えた後の両岸」だけを見ており、舟の中の組み合わせは見ていません。

3は古くは「嫉妬深い夫」として知られる問題で、漕げる人を親だけに絞ると**解が存在しません**。
総当たりで確かめたうえで、こどもも漕げることにしてあります。
4の原型は警官と泥棒を含む形ですが、こども向け領域なのでせんせいと いぬ に置き換えました。
手数は変わりません。配置や決まりごとを変えるときは、必ず解き直してください。

ルール違反になる手も、舟はいったん渡り切ります。渡った先で何が起きるかを見せてから、
約1.2秒後に自動で引き返します。この回は手数に数えません。

箱入り娘と違い、4題とも最初から選べます。開放の仕掛けは置いていません。

#### 駒と舟の絵（任意）

既定では駒は絵文字、舟は CSS で描いています。
`/images/river-crossing/` に絵を置くと、そちらに入れ替わります。

| | 置くもの |
|---|---|
| 置き場所 | `images/river-crossing/`（`.gitignore` で除外。GitHub には上がらない） |
| 形式 | `.webp`（透過） |
| 駒（16枚） | 正方形 120px。`boatman` `wolf` `goat` `cabbage` `man` `woman` `boy` `girl` `bear-parent` `bear-child` `rabbit-parent` `rabbit-child` `cat-parent` `cat-child` `teacher` `dog` |
| 舟（1枚） | `boat` … 真横から見た空の舟。船体だけを切り出す（560 × 183） |

駒16枚は**同じ枠で切り出してあります**。1枚ずつ輪郭ぴったりに詰めると、
おやぐま と こぐま が画面上で同じ大きさになってしまうためです。

舟は CSS が下端に揃えて敷きます。駒の札がその上に座って見えるかどうかは、
`style.css` の `.boat.has-art` にある幅（210px）と `padding-bottom`（44px）が
絵の舟べりの位置と合っているかで決まります。絵を差し替えたらこの2つを直します。

`man` `woman` `boy` `girl` はステージ2と4で共用します。
ステージ選択のボタンは `wolf` `boy` `bear-parent` `dog` を使い回します。

**クローンしただけでは絵がありませんが、そのまま絵文字で遊べます。**
`images/` が無いことでサイトが再現できない他のページとは、ここだけ事情が違います。
自分で用意した絵を同じ名前で置けば差し替わります。

絵が無いときに出る通信は `boat.webp` への1回だけです。
これが読めなければ残りは読みにいきません（17本の404を並べないため）。
揃っていない絵が一部あった場合は、その駒だけ絵文字に戻ります。

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
