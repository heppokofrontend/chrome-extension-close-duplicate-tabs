# 重複したタブを閉じるやつ

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![Maintainability](https://api.codeclimate.com/v1/badges/6a4a32f68f2776d2710c/maintainability)](https://codeclimate.com/github/heppokofrontend/chrome-extension-close-duplicate-tabs/maintainability)

![](./images/main--ja.png)

[English version is here.](./README.md)

仕事中は GitHub や Redmine、Backlog などからたくさんの通知が来ます。

そういう時、あとで読もうと思って別タブで開いておくのを何度か繰り返していると、気がついた時にはあなたのブラウザはタブだらけ…。

このエクステンションはそんな状態で重複しているタブをすべて閉じ、残ったタブもまとめてリロードして最新状態をすぐに確認できます。

## Download

Google Chrome にインストールしてください。

[![Available in the Chrome Web Store](./images/iNEddTyWiMfLSwFD6qGq.png)](https://chrome.google.com/webstore/detail/close-duplicate-tab/ollnnjepahcgphpjjhcfohpelmpldghj)

## 使い方

1. このブラウザ拡張のアイコンをクリックします
2. 必要に応じて設定を変更します（チェックボックス）
3. 使いたい機能ごとにボタンをクリックします

### URL の比較

初期値では、URL の比較に Origin (Scheme + FQDN + Port)からクエリまでを利用します。

なお、比較時に次のようなデフォルトドキュメントは常に省略されます。

> /index.html  
> /index.htm  
> /index.xhtml  
> /index.php  
> /index.cgi  
> /index.aspx

たとえば、次のような URL はすべて同じものとして扱われます。

```
https://www.example.com/index.html
https://www.example.com/

→　https://www.example.com/
```

```
https://www.example.com/index.php#bar
https://www.example.com/index.htm#bar
https://www.example.com/index.cgi#bar
https://www.example.com/#bar

→　https://www.example.com/#bar
```

### クエリを無視する

タブごとの URL の比較をするときに、URL クエリを無視するかどうかを切り替えるものです。

URL クエリとは、URL のうち次の範囲を指します。

```
https://www.example.com/?a=10&b=20#foo

-> ?a=10&b=20
```

クエリが無視されている場合、次のような URL はすべて同じものとして扱われます。

```
https://www.example.com/
https://www.example.com/?a=10
https://www.example.com/?a=10&b=20
https://www.example.com/index.html?a=10&b=20

→　https://www.example.com/
```

### ハッシュを無視する

タブごとの URL の比較をするときに、URL ハッシュを無視するかどうかを切り替えるものです。

URL ハッシュとは、URL のうち次の範囲を指します。

```
https://www.example.com/?a=10&b=20#foo

-> #foo
```

ハッシュが無視されている場合、次のような URL はすべて同じものとして扱われます。

```
https://www.example.com/
https://www.example.com/#foo
https://www.example.com/#bar
https://www.example.com/index.html#baz

→　https://www.example.com/
```

### 両方とも無視する

クエリとハッシュが無視されている場合、次のような URL はすべて同じものとして扱われます。

```
https://www.example.com/
https://www.example.com/#baz
https://www.example.com/#bar
https://www.example.com/index.html#bar
https://www.example.com/?a=10
https://www.example.com/?a=10&b=20
https://www.example.com/?a=10&b=20#foo
https://www.example.com/?a=10&b=20#baz

→　https://www.example.com/
```
