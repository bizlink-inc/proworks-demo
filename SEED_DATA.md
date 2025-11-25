# シードデータ管理

このドキュメントでは、開発・テスト用のシードデータの作成・削除方法について説明します。

## 📋 シードデータの内容

### Better Auth ユーザー: 5 件

| 名前      | メールアドレス               | パスワード    | 専門分野               |
| --------- | ---------------------------- | ------------- | ---------------------- |
| 田中 一郎 | `seed_tanaka@example.com`    | `password123` | フロントエンド         |
| 佐藤 次郎 | `seed_sato@example.com`      | `password123` | バックエンド           |
| 鈴木 三郎 | `seed_suzuki@example.com`    | `password123` | フルスタック           |
| 高橋 四郎 | `seed_takahashi@example.com` | `password123` | モバイル               |
| 伊藤 五郎 | `seed_ito@example.com`       | `password123` | データエンジニアリング |

### kintone 人材 DB: 5 件

各ユーザーと連携（auth_user_id）し、それぞれ異なるスキルセットを持つ：

| 人材      | スキル                                         | 最適合案件               |
| --------- | ---------------------------------------------- | ------------------------ |
| 田中 一郎 | JavaScript, TypeScript, React, Vue.js, Next.js | 案件 1（フロントエンド） |
| 佐藤 次郎 | Python, Django, FastAPI, PostgreSQL, Docker    | 案件 2（バックエンド）   |
| 鈴木 三郎 | JavaScript, TypeScript, Node.js, React, AWS    | 案件 3（フルスタック）   |
| 高橋 四郎 | React Native, TypeScript, Firebase, Swift      | 案件 4（モバイル）       |
| 伊藤 五郎 | Python, SQL, AWS, BigQuery, Apache Spark       | 案件 5（データ）         |

### kintone 案件 DB: 5 件

| 案件名                                 | スキル                             | 最適合人材 |
| -------------------------------------- | ---------------------------------- | ---------- |
| 大手 EC サイトのフロントエンド刷新案件 | JavaScript, React, TypeScript      | 田中 一郎  |
| 金融系 Web アプリケーション API 開発   | Python, Django, PostgreSQL         | 佐藤 次郎  |
| スタートアップ向け新規サービス開発     | JavaScript, Node.js, React, AWS    | 鈴木 三郎  |
| ヘルスケアアプリ開発案件               | React Native, TypeScript, Firebase | 高橋 四郎  |
| データ基盤構築・運用案件               | Python, SQL, AWS                   | 伊藤 五郎  |

### kintone 応募履歴 DB: 3 件

| 人材      | 案件                                   | ステータス |
| --------- | -------------------------------------- | ---------- |
| 田中 一郎 | 大手 EC サイトのフロントエンド刷新案件 | 応募済み   |
| 佐藤 次郎 | 金融系 Web アプリケーション API 開発   | 面談調整中 |
| 鈴木 三郎 | スタートアップ向け新規サービス開発     | 案件参画   |

### kintone 推薦 DB: 25 件（オプション）

各人材と各案件の適合スコアが設定されています。マッチングロジックのテスト用データです。

## 🚀 シードデータ作成

```bash
# シードデータを作成
npm run seed:create
```

### 作成される内容

1. Better Auth にユーザー登録（5 名、メール認証済み）
2. kintone 人材 DB にレコード作成（5 件）
3. kintone 案件 DB にレコード作成（5 件、スキルフィールド付き）
4. kintone 応募履歴 DB にレコード作成（3 件）
5. kintone 推薦 DB にレコード作成（25 件、設定されている場合のみ）

## 🗑️ シードデータ削除

```bash
# シードデータを削除
npm run seed:delete
```

### 削除される内容

1. kintone 推薦 DB のレコード削除（設定されている場合）
2. kintone 応募履歴 DB のレコード削除
3. kintone 案件 DB のレコード削除
4. kintone 人材 DB のレコード削除
5. Better Auth のユーザーとセッションデータ削除

## ⚠️ 注意事項

### 環境変数の確認

シードデータ作成前に、以下の環境変数が設定されていることを確認してください：

```bash
# .env.local
KINTONE_BASE_URL=https://your-domain.cybozu.com

# 必須アプリ
KINTONE_TALENT_APP_ID=81
KINTONE_JOB_APP_ID=85
KINTONE_APPLICATION_APP_ID=84
KINTONE_TALENT_API_TOKEN=your_talent_token
KINTONE_JOB_API_TOKEN=your_job_token
KINTONE_APPLICATION_API_TOKEN=your_application_token

# 推薦DB（オプション - 設定しない場合はスキップされます）
KINTONE_RECOMMENDATION_APP_ID=97
KINTONE_RECOMMENDATION_API_TOKEN=RGizwa6pEfbLigChtI2vGUQ6J2DrErgjnN12G7pf
```

### API トークンの権限

各 kintone アプリの API トークンに以下の権限が必要です：

- **レコード閲覧**: ✅
- **レコード追加**: ✅
- **レコード編集**: ✅
- **レコード削除**: ✅

### 案件 DB のスキルフィールド

案件 DB に「スキル」フィールド（チェックボックス or 複数選択）が必要です。
以下のような選択肢を設定してください：

- JavaScript
- TypeScript
- React
- Vue.js
- Node.js
- Python
- Django
- FastAPI
- PostgreSQL
- MySQL
- AWS
- Firebase
- React Native
- SQL
- BigQuery

## 🔧 トラブルシューティング

### よくあるエラー

#### 1. 環境変数エラー

```
❌ KINTONE_BASE_URL が設定されていません
```

**解決方法**: `.env.local` ファイルに環境変数を設定してください。

#### 2. API トークンエラー

```
❌ [403] このAPIトークンでは、指定したAPIを実行できません。
```

**解決方法**: kintone アプリの設定で、API トークンに必要な権限を付与してください。

#### 3. スキルフィールドエラー

```
❌ [520] 指定したフィールドコードが見つかりません。（スキル）
```

**解決方法**: 案件 DB に「スキル」フィールドを追加してください。

#### 4. 重複ユーザーエラー

```
❌ User already exists. Use another email.
```

**解決方法**: 既存のユーザーを削除してから再作成してください。

```bash
npm run seed:delete
npm run seed:create
```

## 📝 ログイン情報

### シードデータユーザー（5 名）

```
田中 一郎: seed_tanaka@example.com / password123
佐藤 次郎: seed_sato@example.com / password123
鈴木 三郎: seed_suzuki@example.com / password123
高橋 四郎: seed_takahashi@example.com / password123
伊藤 五郎: seed_ito@example.com / password123
```

## 🎯 マッチングテスト用データ

シードデータは、マッチングロジックのテストを想定して設計されています：

### 適合度スコア（参考）

| 人材 / 案件 | 案件 1 | 案件 2 | 案件 3 | 案件 4 | 案件 5 |
| ----------- | ------ | ------ | ------ | ------ | ------ |
| 田中 一郎   | **95** | 20     | 70     | 60     | 10     |
| 佐藤 次郎   | 15     | **95** | 30     | 10     | 65     |
| 鈴木 三郎   | 75     | 25     | **98** | 55     | 50     |
| 高橋 四郎   | 45     | 10     | 40     | **95** | 15     |
| 伊藤 五郎   | 5      | 55     | 45     | 10     | **98** |

※太字は各人材が最も適合する案件

---

## 🔄 開発フロー例

```bash
# 1. 開発開始時：シードデータ作成
npm run seed:create

# 2. マッチングロジックのテスト
# - 各人材が自分に最適な案件を検索できるか確認
# - 適合スコアが正しく計算されるか確認

# 3. 開発終了時：全データ削除
npm run seed:delete
```
