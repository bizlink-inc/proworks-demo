# App Runner環境変数管理

## 概要

AWS App Runnerの環境変数を、`.env.aws.dev` または `.env.aws.prod` ファイルから自動的に更新する仕組みを実装しました。

これにより、環境変数の変更をGitで管理し、CLIコマンドで簡単にApp Runnerに反映できるようになりました。

## ファイル構成

```
proworks-app/
├── .env.aws.dev      # 開発環境用環境変数
├── .env.aws.prod     # 本番環境用環境変数
└── scripts/
    └── push-env-to-apprunner.ts  # 環境変数プッシュスクリプト
```

## 使用方法

### 1. 環境変数ファイルの編集

開発環境の環境変数を変更する場合：

```bash
# .env.aws.dev を編集
vim .env.aws.dev
```

本番環境の環境変数を変更する場合：

```bash
# .env.aws.prod を編集
vim .env.aws.prod
```

### 2. App Runnerに環境変数をプッシュ

開発環境にプッシュ：

```bash
npm run env:push:dev
```

本番環境にプッシュ：

```bash
npm run env:push:prod
```

### 3. 動作確認

コマンド実行後、以下のメッセージが表示されます：

```
🚀 AWS App Runner環境変数を更新します
   環境: dev
   サービス名: proworks-dev
   環境変数ファイル: .env.aws.dev

📖 環境変数ファイルを読み込み中...
✅ XX件の環境変数を読み込みました

🔍 App RunnerサービスARNを取得中...
✅ サービスARN: arn:aws:apprunner:...

📋 現在の環境変数を取得中...
✅ 現在の環境変数を取得しました（プレーンテキスト: XX件、Secrets Manager: X件）

🔄 環境変数を更新中...
✅ 環境変数の更新リクエストを送信しました
   更新された環境変数: XX件
   保持されたSecrets Manager環境変数: X件

✅ 完了しました！
   サービスが更新されるまで数分かかる場合があります。
   AWSコンソールでデプロイ状況を確認してください。
```

## 環境変数ファイルの形式

`.env.aws.dev` および `.env.aws.prod` は、標準的な `.env` ファイル形式です：

```bash
# コメント行（#で始まる行は無視されます）
KEY=VALUE

# 空行は無視されます

# 空の値はスキップされます（TODOコメントなど）
EMPTY_KEY=

# Secrets Manager環境変数（ARN形式で指定）
# 形式: SECRETS_MANAGER_<環境変数名>=<ARN>
SECRETS_MANAGER_DATABASE_URL=arn:aws:secretsmanager:ap-northeast-1:217797467306:secret:proworks/database-J9ADtt:url::
SECRETS_MANAGER_GEMINI_API_KEY=arn:aws:secretsmanager:ap-northeast-1:217797467306:secret:proworks/gemini-api-key-gZ5X5h:api_key::
```

### Secrets Manager環境変数の設定

Secrets Managerで管理されている環境変数は、`SECRETS_MANAGER_`プレフィックスを付けてARN形式で指定します。

**例**:
- `DATABASE_URL`をSecrets Managerから取得する場合: `SECRETS_MANAGER_DATABASE_URL=<ARN>`
- `GEMINI_API_KEY`をSecrets Managerから取得する場合: `SECRETS_MANAGER_GEMINI_API_KEY=<ARN>`

ARNは、AWSコンソールのApp Runnerサービス設定画面で確認できます。

## 注意事項

### Secrets Managerの環境変数

`DATABASE_URL` と `GEMINI_API_KEY` は、AWS Secrets Managerで管理されています。

これらの環境変数は、`.env.aws.dev` や `.env.aws.prod` に `SECRETS_MANAGER_` プレフィックスを付けてARN形式で指定してください：

```bash
SECRETS_MANAGER_DATABASE_URL=arn:aws:secretsmanager:ap-northeast-1:217797467306:secret:proworks/database-J9ADtt:url::
SECRETS_MANAGER_GEMINI_API_KEY=arn:aws:secretsmanager:ap-northeast-1:217797467306:secret:proworks/gemini-api-key-gZ5X5h:api_key::
```

スクリプトは、これらの設定を自動的にSecrets Manager環境変数として処理します。

### 既存のSecrets Manager環境変数の保持

スクリプトは、既存のSecrets Managerで管理されている環境変数を自動的に保持します。プレーンテキストの環境変数のみが更新されます。

### サービス更新のタイミング

環境変数の更新リクエストを送信後、App Runnerサービスが更新されるまで数分かかる場合があります。AWSコンソールでデプロイ状況を確認してください。

## トラブルシューティング

### エラー: 環境変数ファイルが見つかりません

`.env.aws.dev` または `.env.aws.prod` ファイルが存在することを確認してください。

### エラー: App Runnerサービスが見つかりません

AWS CLIが正しく設定されていること、およびサービス名が正しいことを確認してください。

- 開発環境: `proworks-dev`
- 本番環境: `proworks-prod`

### エラー: 環境変数の更新に失敗しました

AWS CLIの権限を確認してください。以下の権限が必要です：

- `apprunner:DescribeService`
- `apprunner:UpdateService`
- `apprunner:ListServices`

## 実装の詳細

### スクリプトの動作フロー

1. 環境変数ファイル（`.env.aws.dev` または `.env.aws.prod`）を読み込む
2. App RunnerサービスのARNを取得
3. 現在の環境変数を取得（Secrets Managerの環境変数を保持するため）
4. 新しい環境変数と既存のSecrets Manager環境変数を結合
5. `aws apprunner update-service` コマンドで環境変数を更新

### 技術的な詳細

- **言語**: TypeScript
- **実行環境**: Node.js (tsxを使用)
- **AWS CLI**: `aws apprunner` コマンドを使用
- **リージョン**: `ap-northeast-1`

## 関連ドキュメント

- [AWS移行ガイド](./AWS移行ガイド.md)
- [App Runnerコスト削減案](../App_Runnerコスト削減案.md)

