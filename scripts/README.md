# 開発用スクリプト

## 🔐 自動ログインスクリプト

開発中にいちいちサインイン入力するのが面倒な場合に使用します。

### 方法1: Playwright自動入力（おすすめ）

ブラウザを自動で開いて、入力・ログインまで自動で行います。

```bash
# デフォルトユーザーでログイン (test@example.com / test1234)
npm run login

# カスタムユーザーでログイン
npm run login your@email.com yourpassword
```

**特徴:**
- ブラウザが自動で開く
- 入力からログインまで全自動
- ログイン後もブラウザは開いたまま（手動操作可能）
- 終了は `Ctrl+C`

### 方法2: API直接呼び出し（軽量）

APIを直接叩いてCookieを取得します。

```bash
# デフォルトユーザーでログイン
npm run quick-login

# カスタムユーザーでログイン
npm run quick-login your@email.com yourpassword
```

**特徴:**
- 軽量・高速
- Cookieファイル（`cookies.txt`）が生成される
- ブラウザで手動でCookieをインポートする必要あり

---

## 🗑️ テストユーザー削除

テストで作成したユーザーを削除します（PostgreSQL + kintone両方から削除）。

```bash
npm run delete-user test@example.com
```

---

## 📊 データベース操作

### スキーマをデータベースに反映

```bash
npm run db:push
```

---

## 使用例

```bash
# 1. 開発サーバー起動
npm run dev

# 2. 別のターミナルで自動ログイン
npm run login

# 3. テスト完了後、ユーザー削除
npm run delete-user test@example.com
```

