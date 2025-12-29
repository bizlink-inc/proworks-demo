# ProWorks 推薦バッチ処理 Lambda

毎日深夜2時（JST）に推薦レコードを更新するバッチ処理。
AWS Lambda + Step Functions で実装。

## アーキテクチャ

```
EventBridge (毎日JST 02:00 / UTC 17:00)
    ↓
Step Functions
    ├── GetJobsFunction     (案件・人材一覧取得)
    ├── ProcessJobFunction  (案件ごとに並列処理、最大5並列)
    └── UpdateStateFunction (バッチ状態更新)
```

## ディレクトリ構成

```
lambda/
├── functions/
│   ├── get-jobs/          # Step 1: 案件・人材取得
│   ├── process-job/       # Step 2: 1案件の推薦処理
│   └── update-state/      # Step 3: 状態更新
├── shared/                # 共有コード
│   ├── kintone.ts         # Kintoneクライアント
│   ├── matching.ts        # マッチングロジック
│   └── db.ts              # DB操作
├── events/                # テスト用イベント
├── template.yaml          # SAMテンプレート
├── statemachine.asl.json  # Step Functions定義
├── samconfig.toml         # デプロイ設定
└── package.json
```

## 前提条件

1. AWS SAM CLI インストール済み
   ```bash
   brew install aws-sam-cli
   ```

2. AWS認証情報が設定済み
   ```bash
   aws configure
   ```

## セットアップ

```bash
cd lambda
npm install
```

## ローカルテスト

```bash
# 環境変数ファイルを作成
cp env.json.example env.json
# env.json を編集して実際の値を設定

# GetJobs関数をテスト
npm run local:get-jobs

# ProcessJob関数をテスト
npm run local:process-job
```

## ビルド

```bash
# TypeScriptコンパイル + 依存関係インストール + SAMビルド
npm run build
```

ビルドプロセス:
1. TypeScriptをJavaScriptにコンパイル（dist/）
2. コンパイル結果をbuild/にコピー
3. 本番用依存関係をインストール（--omit=dev）
4. SAM buildでLambdaパッケージを作成

## デプロイ

### 初回デプロイ（ガイド付き）

```bash
sam deploy --guided
```

パラメータを聞かれるので、以下を入力:
- KintoneBaseUrl: https://xxxxx.cybozu.com
- KintoneTalentApiToken: (Kintone人材DBのAPIトークン)
- KintoneJobApiToken: (Kintone案件DBのAPIトークン)
- KintoneRecommendationApiToken: (Kintone推薦DBのAPIトークン)
- KintoneTalentAppId: (人材DBのアプリID)
- KintoneJobAppId: (案件DBのアプリID)
- KintoneRecommendationAppId: (推薦DBのアプリID)
- DatabaseUrl: (PostgreSQL接続文字列)

### 通常デプロイ

```bash
# 開発環境
npm run deploy:dev

# 本番環境
npm run deploy:prod
```

## 処理フロー

1. **GetJobsFunction** (最大2分)
   - アクティブな案件一覧を取得
   - 全人材（退会者除く）を取得
   - DB設定（閾値、前回バッチ日時）を取得

2. **ProcessJobFunction** (案件ごと、最大5分)
   - 1案件に対する全人材のスコア計算
   - 既存推薦レコードとの差分計算
   - レコードの作成/更新/削除

3. **UpdateStateFunction** (最大1分)
   - 処理結果の集計
   - lastBatchTime, lastThresholdを更新

## インクリメンタル計算

- 前回バッチ以降に更新されたレコードのみ再計算
- 閾値が下がった場合はフル計算
- 閾値が上がった場合は削除のみ

## 並列度

- 案件処理の並列度: 最大5
- Kintone APIレート制限を考慮

## 料金目安

- Lambda: 月数百円程度
- Step Functions: 月数十円程度
- 合計: 月1,000円以下

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
sam build --no-cached
```

### デプロイエラー

```bash
# スタックの状態を確認
aws cloudformation describe-stacks --stack-name proworks-recommend-batch-dev

# 失敗したスタックを削除
aws cloudformation delete-stack --stack-name proworks-recommend-batch-dev
```

### Lambda実行エラー

CloudWatch Logsで確認:
- /aws/lambda/proworks-recommend-get-jobs-dev
- /aws/lambda/proworks-recommend-process-job-dev
- /aws/lambda/proworks-recommend-update-state-dev
