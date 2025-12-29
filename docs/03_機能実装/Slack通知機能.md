# Slack通知機能

ユーザーアクション時にSlackへリアルタイム通知を送信する機能。

## 概要

PRO WORKSでは、以下のユーザーアクション発生時にSlack通知を送信します：

| 通知種別 | トリガー | 通知内容 |
|---------|---------|---------|
| 新規登録 | メール認証完了後 | 氏名、メール、電話、人材DBリンク |
| プロフィール完成 | 必須項目がすべて入力された時 | 氏名、メール、人材DBリンク |
| 案件応募 | 応募完了時 | 氏名、案件タイトル、人材DB・案件DBリンク |
| 面談リマインド | 毎日 JST 10:00（Lambda） | 翌日の面談予定一覧 |

## 環境別動作

| 環境 | 動作 | 通知先 |
|------|------|-------|
| ローカル開発 (`localhost:3000`) | コンソール出力 | ターミナル |
| App Runner Dev | Slack Webhook送信 | 自社Slack（テスト用） |
| App Runner Prod | Slack Webhook送信 | 受託先Slack |

## 必要な環境変数

### App Runner（Next.js）

```bash
# .env.aws.dev / .env.aws.prod
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

Secrets Managerへの反映:
```bash
npm run apprunner:secrets:push:dev   # dev環境
npm run apprunner:secrets:push:prod  # prod環境
```

### Lambda（面談リマインド）

Lambda用の環境変数はSecrets Manager経由で取得されます。

```bash
npm run lambda:secrets:push:dev   # dev環境
npm run lambda:secrets:push:prod  # prod環境
```

Secrets Managerに登録されるキー:
- `SLACK_WEBHOOK_URL`
- その他Kintone関連の環境変数

## Slack Webhook URLの取得方法

1. https://api.slack.com/apps にアクセス
2. 「Create New App」→「From scratch」を選択
3. App名とワークスペースを設定
4. 左メニューから「Incoming Webhooks」を選択
5. 「Activate Incoming Webhooks」をONに
6. 「Add New Webhook to Workspace」をクリック
7. 通知先チャンネルを選択して「許可する」
8. 生成されたWebhook URLをコピー

## Webhookヘルスチェック

Webhook URLが有効かテストするコマンド:

```bash
npm run slack:test -- https://hooks.slack.com/services/xxx/yyy/zzz
```

成功時:
```
🔍 Slack Webhook テスト開始...
   URL: https://hooks.slack.com/services/xxx/yyy/...

✅ テスト成功！
   Slackチャンネルにテスト通知が送信されました。
```

## 実装詳細

### ファイル構成

```
lib/
└── slack.ts                    # Next.js用Slack通知ユーティリティ

lambda/
├── shared/
│   ├── slack.ts               # Lambda用Slack通知
│   └── secrets.ts             # Secrets Manager連携
└── functions/
    └── interview-reminder/
        └── index.ts           # 面談リマインドLambda

scripts/
└── test-slack-webhook.ts      # Webhookテストスクリプト
```

### 通知トリガー箇所

| 通知種別 | ファイル | 関数/処理 |
|---------|---------|----------|
| 新規登録 | `app/api/auth/callback/route.ts` | `createTalent()` 成功後 |
| プロフィール完成 | `app/api/me/route.ts` | PATCH時に必須項目チェック |
| 案件応募 | `app/api/applications/route.ts` | `createApplication()` 成功後 |
| 面談リマインド | `lambda/functions/interview-reminder/index.ts` | EventBridge Schedule |

### プロフィール完成の判定条件

以下のすべての必須項目が入力された時点で「プロフィール完成」と判定:

**プロフィールタブ:**
- 姓（フリガナ）
- 名（フリガナ）
- 生年月日
- 電話番号
- 郵便番号
- 住所

**職歴・資格タブ:**
- 言語・ツールの経験
- 主な実績・PR・職務経歴
- 経歴書（ファイルアップロード）

**希望条件タブ:**
- 稼働可能時期
- 希望単価
- 希望勤務日数
- 出社頻度
- 希望勤務スタイル
- 希望作業時間（1日あたり）

判定ロジック: `lib/utils/profile-validation.ts` の `checkRequiredFields()`

## 通知メッセージ例

### 新規登録
```
🆕 新規会員登録
━━━━━━━━━━━━━━━
氏名: 山田 太郎
メールアドレス: yamada@example.com
電話番号: 090-1234-5678
登録日時: 2025/01/15 10:30

📋 人材DBで確認
```

### プロフィール完成
```
✅ プロフィール完成
━━━━━━━━━━━━━━━
氏名: 山田 太郎
メールアドレス: yamada@example.com

📋 人材DBで確認
```

### 案件応募
```
📝 案件応募
━━━━━━━━━━━━━━━
氏名: 山田 太郎
案件タイトル: 【React】ECサイト開発

📋 人材DBで確認　💼 案件DBで確認
```

### 面談リマインド
```
📅 明日の面談予定
━━━━━━━━━━━━━━━
日付: 2025/01/16
面談件数: 3件

• 山田 太郎 様 / ECサイト開発
• 鈴木 花子 様 / API開発
• 佐藤 一郎 様 / フロントエンド開発
```

## Lambda面談リマインド

### スケジュール

- **実行時間**: 毎日 JST 10:00（UTC 01:00）
- **Cronスケジュール**: `cron(0 1 * * ? *)`

### 処理フロー

1. Secrets Managerから設定を取得
2. 翌日の日付を計算（JST基準）
3. kintone応募履歴DBから条件に合うレコードを取得
   - ステータス: 「面談予定」
   - 面談日: 翌日
4. 該当があればSlack通知を送信

### デプロイ

```bash
cd lambda
npm run deploy:dev   # dev環境
npm run deploy:prod  # prod環境
```

## トラブルシューティング

### 通知が送信されない

1. **環境変数の確認**
   - `SLACK_WEBHOOK_URL` が正しく設定されているか
   - Secrets Managerに反映されているか

2. **Webhook URLの有効性確認**
   ```bash
   npm run slack:test -- <WEBHOOK_URL>
   ```

3. **ローカル開発の場合**
   - `NODE_ENV=development` であることを確認
   - コンソールに出力されているか確認

### プロフィール完成通知が発火しない

1. すべての必須項目が入力されているか確認
2. デバッグログを確認:
   ```
   [Profile Check] 更新前の未入力項目: [...]
   [Profile Check] 更新後の未入力項目: [...]
   [Profile Check] wasIncomplete: true isNowComplete: true
   ```

### Lambda面談リマインドが動かない

1. トリガーが有効か確認:
   ```bash
   npm run lambda:trigger:status
   ```

2. トリガーを有効化:
   ```bash
   npm run lambda:trigger:on:dev   # または :prod
   ```

3. CloudWatch Logsでエラーを確認
