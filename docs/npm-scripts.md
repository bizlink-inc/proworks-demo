# NPM スクリプト一覧

このプロジェクトで利用可能なカスタム npm スクリプトの一覧です。

## 目次

- [開発・ビルド](#開発ビルド)
- [データベース](#データベース)
- [シードデータ](#シードデータ)
- [RDS アクセス管理](#rds-アクセス管理)
- [Kintone 連携](#kintone-連携)
- [バッチ処理](#バッチ処理)
- [テスト](#テスト)
- [キャッシュ管理](#キャッシュ管理)
- [App Runner 制御](#app-runner-制御)
- [環境変数管理](#環境変数管理)
- [Lambda バッチ制御](#lambda-バッチ制御)
- [Slack 通知](#slack-通知)

---

## 開発・ビルド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルドを実行 |
| `npm run start` | プロダクションサーバーを起動 |
| `npm run lint` | ESLint でコードチェック |
| `npm run dev:fresh` | キャッシュをクリアして開発サーバーを起動 |

---

## データベース

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run db:push` | Drizzle スキーマをデータベースにプッシュ | drizzle-kit push |
| `npm run db:create` | データベースを作成 | `scripts/create-database.ts` |
| `npm run db:schema` | スキーマを作成 | `scripts/create-schema.ts` |

---

## シードデータ

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run seed:create` | シードデータをフルセットアップ（RDS接続→DB作成→スキーマ→シード投入→RDS切断） | 複合コマンド |
| `npm run seed:delete` | シードデータを削除 | `scripts/seed-data.ts delete` |
| `npm run seed:upsert` | シードデータを更新/挿入（RDS接続→upsert→RDS切断） | `scripts/seed-data.ts upsert` |
| `npm run seed:check` | シードユーザーの存在確認 | `scripts/check-seed-user.ts` |

### seed:create の処理フロー

```
1. npm run rds:access:add    # RDSアクセスを許可
2. npm run db:create         # データベース作成
3. npm run db:schema         # スキーマ作成
4. npm run seed:delete       # 既存シードデータ削除
5. npx tsx scripts/seed-data.ts create  # シードデータ投入
6. npm run rds:access:remove # RDSアクセスを解除
```

---

## RDS アクセス管理

AWS RDS セキュリティグループへのアクセス制御を管理します。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run rds:access:add` | 現在のIPアドレスからRDSへのアクセスを許可 | `scripts/rds-access-manager.ts add` |
| `npm run rds:access:remove` | 現在のIPアドレスからRDSへのアクセスを解除 | `scripts/rds-access-manager.ts remove` |

---

## Kintone 連携

Kintone アプリのフィールド管理を行います。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run get-fields` | Kintone フィールド情報を取得 | `scripts/get-kintone-fields.ts` |
| `npm run kintone:fields:get` | Kintone フィールド定義を取得 | `scripts/kintone-fields/manage-fields.sh get` |
| `npm run kintone:fields:add` | Kintone フィールドを追加 | `scripts/kintone-fields/manage-fields.sh add` |
| `npm run kintone:fields:deploy` | Kintone フィールドをデプロイ | `scripts/kintone-fields/manage-fields.sh deploy` |
| `npm run kintone:fields:status` | Kintone フィールドの状態確認 | `scripts/kintone-fields/manage-fields.sh status` |

---

## バッチ処理

推薦データの更新バッチ処理を実行します。

| コマンド | 説明 |
|---------|------|
| `npm run recommend:batch` | 推薦データを更新（DB設定の閾値を使用） |
| `npm run recommend:batch:dry` | ドライラン（確認のみ） |
| `npm run recommend:reset` | 推薦データを全削除してシードデータから再作成 |

### 使用例

```bash
# DB設定の閾値で実行
npm run recommend:batch

# ドライラン
npm run recommend:batch:dry

# 閾値を指定して実行
npm run recommend:batch -- -t 5

# 閾値を指定してドライラン
npm run recommend:batch:dry -- -t 3
```

### オプション

| オプション | 説明 |
|-----------|------|
| `-t, --threshold` | スコア閾値（未指定時はDBから取得） |
| `-v, --verbose` | 詳細ログ |

### 閾値の設定

管理者ダッシュボード（`/admin/dashboard`）の「バッチ設定」から変更可能。

---

## テスト

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run test` | Jest 単体テストを実行 | jest |
| `npm run test:watch` | Jest をウォッチモードで実行 | jest --watch |
| `npm run test:coverage` | カバレッジレポート付きでテスト実行 | jest --coverage |
| `npm run test:e2e` | Playwright E2Eテストを実行 | playwright test |
| `npm run test:e2e:ui` | Playwright E2EテストをUIモードで実行 | playwright test --ui |
| `npm run test:signup` | サインアップフローのE2Eテスト（headed） | playwright test signup-flow --headed |
| `npm run test:text-extraction` | テキスト抽出機能のテスト | `scripts/test-text-extraction.ts` |
| `npm run test:ai-match` | AIマッチング機能のテスト | `scripts/test-ai-match.ts` |
| `npm run test:notification` | 通知機能のテスト | `scripts/test-notification.ts` |
| `npm run test-signup` | サインアップ処理のテスト | `scripts/test-signup.ts` |
| `npm run dev:signup` | 開発用サインアップ実行 | `scripts/dev-signup.ts` |
| `npm run delete-user` | テストユーザーを削除 | `scripts/delete-test-user.ts` |

---

## キャッシュ管理

| コマンド | 説明 |
|---------|------|
| `npm run cache:clear:announcements` | お知らせキャッシュをクリア |
| `npm run cache:clear:notifications` | 通知キャッシュをクリア（ブラウザで開く） |
| `npm run cache:clear:all` | 全てのキャッシュをクリア（.next, node_modules/.cache） |
| `npm run dev:fresh` | キャッシュクリア後に開発サーバーを起動 |

---

## App Runner 制御

AWS App Runner サービスの起動・停止を制御します。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run apprunner:start:dev` | 開発環境のApp Runnerを起動 | `scripts/apprunner-control.ts start dev` |
| `npm run apprunner:start:prod` | 本番環境のApp Runnerを起動 | `scripts/apprunner-control.ts start prod` |
| `npm run apprunner:stop:dev` | 開発環境のApp Runnerを停止 | `scripts/apprunner-control.ts stop dev` |
| `npm run apprunner:stop:prod` | 本番環境のApp Runnerを停止 | `scripts/apprunner-control.ts stop prod` |
| `npm run apprunner:status:dev` | 開発環境のApp Runnerの状態確認 | `scripts/apprunner-control.ts status dev` |
| `npm run apprunner:status:prod` | 本番環境のApp Runnerの状態確認 | `scripts/apprunner-control.ts status prod` |

---

## 環境変数管理

AWS Secrets Manager を使用して環境変数を管理します。CI/CD 時に自動で取得されます。

### App Runner シークレット管理

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run apprunner:secrets:push:dev` | dev環境の環境変数をSecrets Managerに反映 | `scripts/push-apprunner-secrets.ts dev` |
| `npm run apprunner:secrets:push:prod` | prod環境の環境変数をSecrets Managerに反映 | `scripts/push-apprunner-secrets.ts prod` |

ローカルの `.env.aws.dev` / `.env.aws.prod` から環境変数を抽出して Secrets Manager (`proworks/apprunner-dev`, `proworks/apprunner-prod`) に登録/更新します。

### App Runner 直接プッシュ（レガシー）

App Runner サービスへ環境変数を直接プッシュします。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run env:push:dev` | 開発環境へ環境変数を直接プッシュ | `scripts/push-env-to-apprunner.ts dev` |
| `npm run env:push:prod` | 本番環境へ環境変数を直接プッシュ | `scripts/push-env-to-apprunner.ts prod` |

---

## Lambda バッチ制御

AWS Lambda（推薦バッチ処理）のスケジュールトリガーと環境変数を管理します。

### トリガー制御

定期実行（毎日 JST 02:00）のオン/オフを制御します。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run lambda:trigger:status` | 両環境のトリガー状態を表示 | `scripts/lambda-trigger-control.ts status` |
| `npm run lambda:trigger:on:dev` | dev環境のトリガーを有効化 | `scripts/lambda-trigger-control.ts on dev` |
| `npm run lambda:trigger:off:dev` | dev環境のトリガーを無効化 | `scripts/lambda-trigger-control.ts off dev` |
| `npm run lambda:trigger:on:prod` | prod環境のトリガーを有効化 | `scripts/lambda-trigger-control.ts on prod` |
| `npm run lambda:trigger:off:prod` | prod環境のトリガーを無効化 | `scripts/lambda-trigger-control.ts off prod` |

### シークレット管理

Lambda 用の環境変数を AWS Secrets Manager にプッシュします。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run lambda:secrets:push:dev` | dev環境の環境変数をSecrets Managerに反映 | `scripts/push-lambda-secrets.ts dev` |
| `npm run lambda:secrets:push:prod` | prod環境の環境変数をSecrets Managerに反映 | `scripts/push-lambda-secrets.ts prod` |

ローカルの `.env.aws.dev` / `.env.aws.prod` から Kintone 関連の環境変数を抽出して Secrets Manager に登録/更新します。

---

## Slack 通知

Slack Webhook の動作確認を行います。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run slack:test` | Slack Webhook の動作確認 | `scripts/test-slack-webhook.ts` |

### 使用方法

Webhook URL を引数として指定して実行します：

```bash
npm run slack:test -- https://hooks.slack.com/services/xxx/yyy/zzz
```

### 出力例

成功時：
```
🔍 Slack Webhook テスト開始...
   URL: https://hooks.slack.com/services/xxx/yyy/...

✅ テスト成功！
   Slackチャンネルにテスト通知が送信されました。
   チャンネルを確認してください。
```

失敗時：
```
❌ テスト失敗: HTTP 403
   レスポンス: invalid_token
```

### Webhook URL の取得方法

1. https://api.slack.com/apps にアクセス
2. 「Create New App」→「From scratch」を選択
3. 「Incoming Webhooks」を有効化
4. 「Add New Webhook to Workspace」で通知先チャンネルを選択
5. 生成された Webhook URL をコピー

---

## その他のスクリプト（package.json 未登録）

`scripts/` ディレクトリには以下の追加スクリプトも存在します：

| ファイル | 説明 |
|---------|------|
| `scripts/benchmark-matching.ts` | マッチング機能のベンチマーク |
| `scripts/benchmark-scale.ts` | スケールテスト用ベンチマーク |
| `scripts/benchmark-kintone.ts` | Kintone連携のベンチマーク |
| `scripts/benchmark-applications.ts` | 応募機能のベンチマーク |
| `scripts/create-test-user.ts` | テストユーザー作成 |
| `scripts/check-talent.ts` | タレント情報確認 |
| `scripts/seed-data-large.ts` | 大規模シードデータ投入 |
| `scripts/add-staff-recommend-field.ts` | スタッフ推薦フィールド追加 |

実行例：
```bash
npx tsx scripts/benchmark-matching.ts
```
