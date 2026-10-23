# fonts/ — SIL Open Font License (OFL) の書体

**ここにあるフォントは、ルートの `LICENSE`（MIT）の対象ではありません。**

各書体の提供元が定める **SIL Open Font License 1.1（OFL）** に従います。
ライセンス全文は、このフォルダに同梱しています。

---

## 収録している書体

| 書体 | ファイル | ライセンス全文 |
|---|---|---|
| Nunito | `nunito-latin-400/700/900.woff2` | `OFL.txt` |
| Boogaloo | `boogaloo-latin-400.woff2` | `OFL-boogaloo.txt` |
| Orbitron | `orbitron-latin-400/700/900.woff2` | `OFL-orbitron.txt` |
| Outfit | `outfit-latin-400/600/700/800.woff2` | `OFL-outfit.txt` |

いずれも Latin サブセット版です。これは OFL の言う **Modified Version**
（改変版）にあたります。条文の定義にこうあります。

> "Modified Version" refers to any derivative made by adding to, deleting,
> or substituting ... **by changing formats** or by porting the Font Software
> to a new environment.

形式の変換やサブセット化も改変に含まれる、ということです。

---

## なぜ MIT を重ねられないのか

OFL の条文5に、こう書かれています。

> The Font Software, modified or unmodified, in part or in whole,
> **must be distributed entirely under this license, and must not be
> distributed under any other license.**

**他のライセンスで配布してはならない。** これが理由のすべてです。

さらに OFL には自動失効の条項があります。

> **TERMINATION**
> This license becomes null and void if any of the above conditions are not met.

条件を1つでも欠くと、**ライセンスそのものが無効**になります。
無効になれば、フォントを使う権利を失います。

ルートに無条件の MIT を置くと「このリポジトリのすべてが MIT」と
宣言したことになり、条文5に抵触します。だから `LICENSE` で
このフォルダを明示的に対象外にしています。

---

## 持っていく場合に守ること

OFL は再配布を**許可しています**。禁止ではありません。
条件を守れば、自分のプロジェクトで使って構いません。

### ① ライセンス全文を一緒に持っていく

> provided that each copy contains the above copyright notice and this license.
> These can be included either as **stand-alone text files** ...

`woff2` だけ持っていってはいけません。対応する `OFL*.txt` も一緒に置きます。
独立したテキストファイルでよい、と条文が明記しています。

**これを欠くと、上の TERMINATION でライセンスが失効します。**

### ② 単体で売らない

> Neither the Font Software nor any of its individual components ...
> may be **sold by itself**.

フォントファイルそのものを商品にすることはできません。
アプリやサイトに組み込んで、その製品を売ることは許されています。

### ③ 名前について（この4書体は制約なし）

OFL には **Reserved Font Name (RFN)** という仕組みがあります。
宣言されていると、改変版は元の名前を名乗れません。

**この4書体は、いずれも RFN を宣言していません。**

```
OFL.txt           Reserved Font Name: なし
OFL-boogaloo.txt  Reserved Font Name: なし
OFL-orbitron.txt  Reserved Font Name: なし
OFL-outfit.txt    Reserved Font Name: なし
```

そのため、サブセット版であっても `font-family: 'Nunito'` のように
元の名前をそのまま使えます。もし RFN が宣言されていたら、
現在の CSS は違反になっていました。

書体を追加するときは、**まず RFN の有無を確認してください。**

---

## よくある誤解

| 誤解 | 実際 |
|---|---|
| OFL なら何をしてもよい | ライセンス全文を同梱しないと**失効**します |
| Web で使うだけなら再配布ではない | `woff2` をブラウザへ配信するのは**配布**です。全文の同梱が要ります |
| サブセット化は改変ではない | **改変です。**「changing formats」に該当します |
| このフォントで作った作品も OFL になる | **なりません。**条文5の後半が明確に否定しています |

最後の点は、OFL が特に気を配っているところです。

> The requirement for fonts to remain under this license
> **does not apply to any document created using the Font Software.**

フォント自体と、フォントを使って作ったものは別、ということです。
PDF もアプリも Web ページも、OFL に引きずられません。

---

## 書体を追加するとき

1. その書体のライセンスを確認する（OFL とは限りません）
2. **RFN の宣言の有無**を確認する
3. ライセンス全文をこのフォルダに置く
4. この README の表に1行足す
5. ルートの `.gitignore` の記述も更新する

**3 を忘れると、その書体のライセンスが失効します。**
人の注意力に頼る箇所なので、気をつけてください。
