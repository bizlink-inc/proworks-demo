# NPM スクリプト一覧

このプロジェクトで利用可能なカスタム npm スクリプトの一覧です。

## 目次

- [開発・ビルド](#開発ビルド)
- [データベース](#データベース)
- [シードデータ](#シードデータ)
- [RDS アクセス管理](#rds-アクセス管理)
- [Kintone 連携](#kintone-連携)
- [テスト](#テスト)
- [キャッシュ管理](#キャッシュ管理)
- [App Runner 制御](#app-runner-制御)
- [環境変数管理](#環境変数管理)

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

App Runner サービスへ環境変数をプッシュします。

| コマンド | 説明 | スクリプト |
|---------|------|-----------|
| `npm run env:push:dev` | 開発環境へ環境変数をプッシュ | `scripts/push-env-to-apprunner.ts dev` |
| `npm run env:push:prod` | 本番環境へ環境変数をプッシュ | `scripts/push-env-to-apprunner.ts prod` |

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
