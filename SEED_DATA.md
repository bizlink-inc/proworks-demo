# シードデータ管理

このドキュメントでは、開発・テスト用のシードデータの作成・削除方法について説明します。

## 🎯 シードデータセット一覧

| セット   | コマンド                | 人材数 | 案件数 | 推薦数        | 用途                       |
| -------- | ----------------------- | ------ | ------ | ------------- | -------------------------- |
| セット 1 | `npm run seed:create:1` | 1 人   | 5 件   | スコア 0 除外 | 小規模テスト（Yamada）     |
| セット 2 | `npm run seed:create:2` | 5 人   | 5 件   | スコア 0 除外 | 中規模テスト（カテゴリ別） |
| セット 3 | `npm run seed:create:3` | 50 人  | 50 件  | スコア 0 除外 | 大規模テスト（本番規模）   |

**全セット共通**: `npm run seed:delete` で全データを削除後に作成

## 📋 シードデータの内容

### セット 1（小規模） - Yamada

#### Better Auth ユーザー: 1 件

| 名前      | メールアドレス            | パスワード    |
| --------- | ------------------------- | ------------- |
| 山田 太郎 | `seed_yamada@example.com` | `password123` |

#### kintone 人材 DB: 1 件

| 人材      | スキル                                         |
| --------- | ---------------------------------------------- |
| 山田 太郎 | JavaScript, TypeScript, React, Next.js, Python |

#### kintone 案件 DB: 5 件

#### kintone 応募履歴 DB: 3 件

#### kintone 推薦 DB: スコア > 0 のみ

---

### セット 2（中規模） - カテゴリ別 5x5

#### Better Auth ユーザー: 5 件

| 名前      | メールアドレス               | パスワード    | 専門分野               |
| --------- | ---------------------------- | ------------- | ---------------------- |
| 田中 一郎 | `seed_tanaka@example.com`    | `password123` | フロントエンド         |
| 佐藤 次郎 | `seed_sato@example.com`      | `password123` | バックエンド           |
| 鈴木 三郎 | `seed_suzuki@example.com`    | `password123` | フルスタック           |
| 高橋 四郎 | `seed_takahashi@example.com` | `password123` | モバイル               |
| 伊藤 五郎 | `seed_ito@example.com`       | `password123` | データエンジニアリング |

#### kintone 人材 DB: 5 件

各ユーザーと連携（auth_user_id）し、それぞれ異なるスキルセットを持つ

#### kintone 案件 DB: 5 件

#### kintone 応募履歴 DB: 3 件

#### kintone 推薦 DB: スコア > 0 のみ

各人材と各案件の適合スコアが設定されます（スコア 0 は作成されません）。

---

### セット 3（大規模） - 本番規模 50x50

#### Better Auth ユーザー: 50 件

| カテゴリ          | 人材数 | パターン                                |
| ----------------- | ------ | --------------------------------------- |
| フロントエンド    | 10 人  | React, Vue, Angular, TypeScript 等      |
| バックエンド      | 10 人  | Python, Java, Go, Node.js, PHP 等       |
| インフラ/クラウド | 10 人  | AWS, GCP, Azure, Docker, Kubernetes 等  |
| モバイル          | 10 人  | React Native, Flutter, Swift, Kotlin 等 |
| データ/AI         | 10 人  | Python, TensorFlow, BigQuery 等         |

#### kintone 人材 DB: 50 件

各カテゴリで 10 人の人材を生成。各人材には：

- メインスキル: 該当カテゴリのスキル
- サブスキル: 他カテゴリのスキル（バラツキ演出用）

#### kintone 案件 DB: 50 件

各カテゴリで 10 件の案件を生成。カテゴリ別にマッチング度合いが変わる設計

#### kintone 応募履歴 DB: 5 件

各カテゴリから 1 件のみ（テスト用）

#### kintone 推薦 DB: スコア > 0 のみ

同カテゴリ: 高マッチ（多数スキル一致）
異カテゴリ: 低〜中マッチ（一部スキルのみ一致）

**注**: スコア 0 のレコードは作成されません

---

## 🚀 シードデータ作成

```bash
# セット1を作成（削除 + 作成 + マッチング計算）
npm run seed:create:1

# セット2を作成（削除 + 作成 + マッチング計算）
npm run seed:create:2

# セット3を作成（削除 + 作成 + マッチング計算）
npm run seed:create:3

# デフォルト（セット2と同じ）
npm run seed:create
```

### 作成時間目安

| セット   | ユーザー作成 | Kintone 作成 | マッチング計算 | 合計     |
| -------- | ------------ | ------------ | -------------- | -------- |
| セット 1 | < 1 秒       | < 1 秒       | < 1 秒         | < 3 秒   |
| セット 2 | < 1 秒       | < 1 秒       | < 1 秒         | < 3 秒   |
| セット 3 | < 1 秒       | 数秒         | 数秒           | 10-15 秒 |

### 実装の特徴

- **ユーザー作成**: SQLite トランザクションで一括作成（HTTP リクエスト不要）
- **Kintone レコード作成**: `addRecords` で一括作成（1 回の API 呼び出し）
- **マッチング計算**: 人材 × 案件のスコア計算
- **スコア 0 除外**: スコア 0 のレコードは作成されません

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

### 管理者ログイン

```
メールアドレス: admin@example.com
パスワード: admin123
```

### シードデータユーザー

**セット 2**: 5 名

```
田中 一郎: seed_tanaka@example.com / password123
佐藤 次郎: seed_sato@example.com / password123
鈴木 三郎: seed_suzuki@example.com / password123
高橋 四郎: seed_takahashi@example.com / password123
伊藤 五郎: seed_ito@example.com / password123
```

**セット 3**: 50 名（seed_talent_001〜seed_talent_050@example.com、全員 password123）

## 🎯 マッチングテスト用データ

### セット 2 の適合度スコア

| 人材 / 案件 | 案件 1 | 案件 2 | 案件 3 | 案件 4 | 案件 5 |
| ----------- | ------ | ------ | ------ | ------ | ------ |
| 田中 一郎   | **15** | 20     | 70     | 60     | 10     |
| 佐藤 次郎   | 15     | **12** | 30     | 10     | 65     |
| 鈴木 三郎   | 75     | 25     | **8**  | 55     | 50     |
| 高橋 四郎   | 45     | 10     | 40     | **9**  | 15     |
| 伊藤 五郎   | 5      | 55     | 45     | 10     | **8**  |

**注**: スコア 0 のレコードは作成されません

### セット 3 の特徴

- カテゴリ別マッチング: 同カテゴリは高スコア、異カテゴリは低スコア
- 自然なバラツキ: 各人材に他カテゴリのスキルも混在させる
- 大規模データ: 本番環境の規模をシミュレート

---

## 🔄 開発フロー例

```bash
# 1. 開発開始時：大規模データで検証
npm run seed:create:3

# 2. 管理者ページで確認
# http://localhost:3000/admin

# 3. マッチングロジックのテスト
# - 案件一覧が表示されるか確認
# - 推薦人材が降順でスコア順に表示されるか確認

# 4. 開発終了時：全データ削除
npm run seed:delete
```

## 💡 パフォーマンス最適化

### Kintone API 最適化

- **一括作成**: `addRecords` で 100 件ずつ処理
- **一括更新**: `updateRecords` で 100 件ずつ処理
- **一括削除**: `deleteRecords` で 100 件ずつ処理

### Better Auth 最適化

- **トランザクション**: SQLite トランザクションで全ユーザーを一括挿入
- **パスワードハッシュ**: 共通パスワードなので 1 回だけハッシュ化

---
