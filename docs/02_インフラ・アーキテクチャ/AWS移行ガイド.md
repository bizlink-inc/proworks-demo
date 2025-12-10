# AWS移行ガイド（GCP → AWS）

## 📋 概要

このドキュメントは、ProWorksアプリケーションをGCP（Cloud Run + SendGrid）からAWS（App Runner + Amazon SES）へ移行するための手順をまとめたものです。

---

## 1. 移行概要

### 1.1 移行対象

| コンポーネント | 移行前（GCP） | 移行後（AWS） |
|---------------|-------------|-------------|
| **コンテナホスティング** | Cloud Run | **App Runner** |
| **データベース** | Cloud SQL PostgreSQL | **RDS PostgreSQL** |
| **メール送信** | SendGrid | **Amazon SES** |
| **コンテナレジストリ** | Artifact Registry | **ECR** |
| **シークレット管理** | Secret Manager | **Secrets Manager** |
| **監視・ログ** | Cloud Logging | **CloudWatch** |
| **CI/CD** | Cloud Build | **GitHub Actions** |

### 1.2 移行スケジュール（想定）

| フェーズ | 期間 | 内容 |
|---------|------|------|
| **準備** | 1週間 | AWS環境構築、ドメイン認証 |
| **開発環境移行** | 1週間 | コード修正、テスト |
| **本番環境移行** | 3日 | デプロイ、動作確認 |
| **監視・最適化** | 継続 | パフォーマンス監視、コスト最適化 |

---

## 2. 事前準備

### 2.1 AWSアカウント作成

1. [AWS公式サイト](https://aws.amazon.com/jp/)でアカウント作成
2. 請求先情報の登録
3. MFA（多要素認証）の設定

### 2.2 必要な権限

以下のAWSサービスへのアクセス権限が必要です：

- App Runner
- RDS
- SES
- ECR
- Secrets Manager
- CloudWatch
- IAM

### 2.3 ドメイン準備

- `proworks.jp` のDNS管理画面へのアクセス
- DNS設定変更権限

---

## 3. AWS環境構築

### 3.1 VPC・ネットワーク設定

#### VPC作成

```bash
# VPC作成
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=proworks-vpc}]'

# パブリックサブネット作成（App Runner用）
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-northeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=proworks-public-1a}]'

# プライベートサブネット作成（RDS用）
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone ap-northeast-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=proworks-private-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.12.0/24 \
  --availability-zone ap-northeast-1c \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=proworks-private-1c}]'
```

### 3.2 RDS PostgreSQL作成

#### RDSサブネットグループ作成

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name proworks-db-subnet \
  --db-subnet-group-description "ProWorks RDS Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy
```

#### RDSインスタンス作成

```bash
aws rds create-db-instance \
  --db-instance-identifier proworks-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username proworks_admin \
  --master-user-password 'CHANGE_ME_STRONG_PASSWORD' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-subnet-group-name proworks-db-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --tags Key=Name,Value=proworks-db
```

#### 接続文字列の取得

```bash
# エンドポイント取得
aws rds describe-db-instances \
  --db-instance-identifier proworks-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# 接続文字列例
# postgresql://proworks_admin:PASSWORD@proworks-db.xxxxx.ap-northeast-1.rds.amazonaws.com:5432/proworks
```

### 3.3 ECR（コンテナレジストリ）作成

```bash
# ECRリポジトリ作成
aws ecr create-repository \
  --repository-name proworks \
  --region ap-northeast-1 \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Name,Value=proworks

# レジストリURLを取得
aws ecr describe-repositories \
  --repository-names proworks \
  --query 'repositories[0].repositoryUri' \
  --output text
```

### 3.4 Secrets Manager設定

```bash
# データベース接続情報
aws secretsmanager create-secret \
  --name proworks/database \
  --secret-string '{"url":"postgresql://proworks_admin:PASSWORD@HOST:5432/proworks"}' \
  --region ap-northeast-1

# Better Auth Secret
aws secretsmanager create-secret \
  --name proworks/auth-secret \
  --secret-string '{"secret":"RANDOM_SECRET_KEY_HERE"}' \
  --region ap-northeast-1

# kintone認証情報
aws secretsmanager create-secret \
  --name proworks/kintone \
  --secret-string '{
    "base_url":"https://example.cybozu.com",
    "talent_app_id":"123",
    "talent_api_token":"token1",
    "job_app_id":"456",
    "job_api_token":"token2"
  }' \
  --region ap-northeast-1
```

### 3.5 Amazon SES設定

#### ドメイン認証

```bash
# ドメイン認証開始
aws ses verify-domain-identity \
  --domain proworks.jp \
  --region ap-northeast-1

# DKIM設定取得
aws ses verify-domain-dkim \
  --domain proworks.jp \
  --region ap-northeast-1
```

#### DNS設定（proworks.jp）

以下のレコードをDNSに追加：

```
# Domain Verification
_amazonses.proworks.jp  TXT  "verification-token-here"

# DKIM（3つのCNAMEレコード）
token1._domainkey.proworks.jp  CNAME  token1.dkim.amazonses.com
token2._domainkey.proworks.jp  CNAME  token2.dkim.amazonses.com
token3._domainkey.proworks.jp  CNAME  token3.dkim.amazonses.com

# SPF
proworks.jp  TXT  "v=spf1 include:amazonses.com ~all"

# DMARC
_dmarc.proworks.jp  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@proworks.jp"
```

#### Production Access申請

1. [SESコンソール](https://console.aws.amazon.com/ses/)を開く
2. 「Account dashboard」→「Request production access」
3. 以下を入力：
   - Use case: Transactional
   - Website: https://proworks.jp
   - Description: ユーザー登録確認メール、パスワードリセット等
4. 申請送信（1〜2営業日で承認）

---

## 4. コード修正

### 4.1 メール送信ライブラリの変更

#### パッケージインストール

```bash
# SendGridを削除
npm uninstall @sendgrid/mail

# AWS SDKをインストール
npm install @aws-sdk/client-ses
```

#### lib/email.ts の修正

```typescript
/**
 * メール送信ユーティリティ（Amazon SES版）
 */
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// 環境判定
const isDevelopment = process.env.NODE_ENV === "development";

// SES クライアント初期化（本番環境のみ）
let sesClient: SESClient | null = null;

if (!isDevelopment) {
  sesClient = new SESClient({
    region: process.env.AWS_SES_REGION || "ap-northeast-1",
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    } : undefined, // IAMロールを使用する場合はundefined
  });
}

// 送信元メールアドレス
const FROM_EMAIL = process.env.EMAIL_FROM || "PRO WORKS <noreply@proworks.jp>";

// メール送信結果の型
type SendEmailResult = {
  success: boolean;
  error?: string;
};

/**
 * 汎用メール送信関数
 */
const sendEmail = async ({ to, subject, html, text }: SendEmailParams): Promise<SendEmailResult> => {
  // 開発環境: コンソールに出力
  if (isDevelopment) {
    console.log("\n" + "=".repeat(80));
    console.log(`📧 ${subject}`);
    console.log("=".repeat(80));
    console.log(`宛先: ${to}`);
    console.log("");
    console.log(text.trim());
    console.log("=".repeat(80) + "\n");
    return { success: true };
  }

  // 本番環境: Amazon SES で送信
  if (!sesClient) {
    console.error("❌ Amazon SES クライアントが初期化されていません");
    return { success: false, error: "メール送信サービスが設定されていません" };
  }

  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);

    console.log(`✅ メール送信成功: ${to} - ${subject}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ Amazon SES メール送信エラー:", error);
    
    // エラー詳細をログ出力
    if (error && typeof error === "object") {
      console.error("SES エラー詳細:", JSON.stringify(error, null, 2));
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : "メール送信に失敗しました" 
    };
  }
};

// 既存の関数（sendVerificationEmail等）はそのまま
export const sendVerificationEmail = async (to: string, verificationUrl: string): Promise<SendEmailResult> => {
  // ... 既存のコード ...
  return sendEmail({ to, subject, html: htmlContent, text: textContent });
};

// ... その他の関数も同様 ...
```

### 4.2 環境変数の更新

#### .env.local（ローカル開発）

```bash
# データベース
DATABASE_URL="postgresql://user:pass@localhost:5432/proworks_local"

# 認証
BETTER_AUTH_SECRET="development-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AWS SES（開発環境では不要）
# AWS_SES_REGION="ap-northeast-1"
# AWS_ACCESS_KEY_ID="AKIA..."
# AWS_SECRET_ACCESS_KEY="secret..."
EMAIL_FROM="PRO WORKS <noreply@proworks.jp>"

# kintone
KINTONE_BASE_URL="https://example.cybozu.com"
KINTONE_TALENT_APP_ID="123"
KINTONE_TALENT_API_TOKEN="token..."
# ... その他のkintone設定 ...

# Gemini API
GEMINI_API_KEY="AIza..."
```

### 4.3 Dockerfileの確認

既存のDockerfileはそのまま使用可能です。変更不要。

```dockerfile
# 既存のDockerfileをそのまま使用
# App Runnerで動作します
```

---

## 5. GitHub Actions設定

### 5.1 GitHub Secretsの設定

以下のSecretsをGitHubリポジトリに追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `AWS_ACCOUNT_ID` | AWSアカウントID | `123456789012` |
| `AWS_REGION` | AWSリージョン | `ap-northeast-1` |
| `AWS_ACCESS_KEY_ID` | AWS認証情報 | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS認証情報 | `secret...` |
| `DATABASE_URL` | RDS接続文字列 | `postgresql://...` |
| `BETTER_AUTH_SECRET` | 認証シークレット | `random-key` |
| `EMAIL_FROM` | 送信元メールアドレス | `PRO WORKS <noreply@proworks.jp>` |
| `KINTONE_*` | kintone設定 | 既存と同じ |
| `GEMINI_API_KEY` | Gemini APIキー | 既存と同じ |

### 5.2 ワークフローファイル作成

`.github/workflows/deploy-apprunner.yml` を作成：

```yaml
name: Deploy to AWS App Runner

on:
  push:
    branches:
      - develop
      - main

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: proworks

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      # コードチェックアウト
      - name: Checkout code
        uses: actions/checkout@v4

      # AWS認証
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # ECRログイン
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # 環境名とサービス名を決定
      - name: Set environment variables
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "ENV_NAME=prod" >> $GITHUB_ENV
            echo "SERVICE_NAME=proworks-prod" >> $GITHUB_ENV
          else
            echo "ENV_NAME=dev" >> $GITHUB_ENV
            echo "SERVICE_NAME=proworks-dev" >> $GITHUB_ENV
          fi

      # Dockerイメージビルド
      - name: Build Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build \
            --tag $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }} \
            --tag $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .

      # ECRにプッシュ
      - name: Push Docker image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }}
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      # App Runnerにデプロイ
      - name: Deploy to App Runner
        run: |
          # App Runnerサービスが存在するか確認
          if aws apprunner describe-service --service-arn $(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='${{ env.SERVICE_NAME }}'].ServiceArn" --output text) 2>/dev/null; then
            # 既存サービスを更新
            aws apprunner update-service \
              --service-arn $(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='${{ env.SERVICE_NAME }}'].ServiceArn" --output text) \
              --source-configuration ImageRepository={ImageIdentifier=${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }},ImageRepositoryType=ECR}
          else
            # 新規サービス作成（初回のみ）
            echo "App Runnerサービスを手動で作成してください"
            exit 1
          fi

      # デプロイ結果を出力
      - name: Show deployment result
        run: |
          echo "🚀 Deployed to AWS App Runner"
          echo "Environment: ${{ env.ENV_NAME }}"
          echo "Service: ${{ env.SERVICE_NAME }}"
```

---

## 6. App Runnerサービス作成

### 6.1 IAMロール作成

#### App Runner用IAMロール

```bash
# ロール作成
aws iam create-role \
  --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "build.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# ECRアクセスポリシーをアタッチ
aws iam attach-role-policy \
  --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

#### App Runnerインスタンス用IAMロール

```bash
# ロール作成
aws iam create-role \
  --role-name ProWorksAppRunnerInstanceRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "tasks.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# SES送信権限ポリシー作成
aws iam create-policy \
  --policy-name ProWorksSESPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }]
  }'

# ポリシーをアタッチ
aws iam attach-role-policy \
  --role-name ProWorksAppRunnerInstanceRole \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/ProWorksSESPolicy

# Secrets Managerアクセス権限
aws iam attach-role-policy \
  --role-name ProWorksAppRunnerInstanceRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### 6.2 App Runnerサービス作成（コンソール）

1. [App Runnerコンソール](https://console.aws.amazon.com/apprunner/)を開く
2. 「サービスを作成」をクリック
3. 以下を設定：

#### ソース設定

- **リポジトリタイプ**: コンテナレジストリ
- **プロバイダー**: Amazon ECR
- **コンテナイメージURI**: `ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/proworks:latest`
- **デプロイ設定**: 自動
- **ECRアクセスロール**: `AppRunnerECRAccessRole`

#### サービス設定

- **サービス名**: `proworks-prod`（または `proworks-dev`）
- **ポート**: `8080`
- **CPU**: `1 vCPU`
- **メモリ**: `2 GB`
- **環境変数**: 以下を追加

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://proworks.jp
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
AWS_SES_REGION=ap-northeast-1
EMAIL_FROM=PRO WORKS <noreply@proworks.jp>
KINTONE_BASE_URL=...
KINTONE_TALENT_APP_ID=...
KINTONE_TALENT_API_TOKEN=...
GEMINI_API_KEY=...
```

- **インスタンスロール**: `ProWorksAppRunnerInstanceRole`

#### ネットワーク設定

- **VPC接続**: 有効（RDS接続用）
- **VPC**: `proworks-vpc`
- **サブネット**: プライベートサブネット選択
- **セキュリティグループ**: RDS接続を許可

#### ヘルスチェック

- **パス**: `/api/health`（作成が必要）
- **間隔**: 5秒
- **タイムアウト**: 2秒
- **正常しきい値**: 1
- **異常しきい値**: 5

4. 「作成とデプロイ」をクリック

---

## 7. データベースマイグレーション

### 7.1 GCPからAWSへのデータ移行

#### 1. GCP Cloud SQLからデータエクスポート

```bash
# Cloud SQLからダンプ
gcloud sql export sql proworks-db \
  gs://proworks-backup/backup-$(date +%Y%m%d).sql \
  --database=proworks
```

#### 2. ダンプファイルをダウンロード

```bash
gsutil cp gs://proworks-backup/backup-*.sql ./
```

#### 3. AWS RDSにインポート

```bash
# RDSに接続
psql postgresql://proworks_admin:PASSWORD@HOST:5432/proworks

# ダンプファイルをインポート
psql postgresql://proworks_admin:PASSWORD@HOST:5432/proworks < backup-*.sql
```

### 7.2 データ整合性確認

```sql
-- レコード数確認
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'verification_tokens', COUNT(*) FROM verification_tokens;
```

---

## 8. DNS切り替え

### 8.1 App Runner URLの確認

```bash
# App RunnerサービスURLを取得
aws apprunner describe-service \
  --service-arn SERVICE_ARN \
  --query 'Service.ServiceUrl' \
  --output text
```

### 8.2 カスタムドメイン設定

1. App Runnerコンソールで「カスタムドメイン」を選択
2. `proworks.jp` を追加
3. 表示されたCNAMEレコードをDNSに追加

```
proworks.jp  CNAME  xxxxx.ap-northeast-1.awsapprunner.com
```

### 8.3 SSL証明書

App Runnerが自動的にSSL証明書を発行・管理します。

---

## 9. 動作確認

### 9.1 ヘルスチェック

```bash
curl https://proworks.jp/api/health
```

### 9.2 メール送信テスト

1. 新規ユーザー登録
2. 確認メールが届くか確認
3. パスワードリセットテスト

### 9.3 案件検索・応募テスト

1. ログイン
2. 案件一覧表示
3. 案件応募
4. kintoneに応募履歴が登録されているか確認

---

## 10. 監視設定

### 10.1 CloudWatch Alarms設定

```bash
# CPU使用率アラート
aws cloudwatch put-metric-alarm \
  --alarm-name proworks-high-cpu \
  --alarm-description "App Runner CPU使用率が80%を超えた" \
  --metric-name CPUUtilization \
  --namespace AWS/AppRunner \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# メモリ使用率アラート
aws cloudwatch put-metric-alarm \
  --alarm-name proworks-high-memory \
  --alarm-description "App Runnerメモリ使用率が80%を超えた" \
  --metric-name MemoryUtilization \
  --namespace AWS/AppRunner \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### 10.2 SES監視

```bash
# バウンス率アラート
aws cloudwatch put-metric-alarm \
  --alarm-name proworks-high-bounce-rate \
  --alarm-description "SESバウンス率が5%を超えた" \
  --metric-name Reputation.BounceRate \
  --namespace AWS/SES \
  --statistic Average \
  --period 3600 \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 11. ロールバック手順

万が一、問題が発生した場合のロールバック手順：

### 11.1 DNS切り戻し

```
# GCP Cloud RunのURLに戻す
proworks.jp  CNAME  xxxxx-uc.a.run.app
```

### 11.2 データベース復元

```bash
# GCP Cloud SQLに戻す場合
# 事前にバックアップを取得しておく
```

---

## 12. 移行後の最適化

### 12.1 コスト監視

- AWS Cost Explorerで日次コスト確認
- 予算アラート設定

### 12.2 パフォーマンス最適化

- CloudWatch Insightsでログ分析
- App RunnerのAuto Scaling設定調整

### 12.3 セキュリティ強化

- IAMポリシーの最小権限化
- VPCエンドポイント設定
- WAF導入検討

---

## 13. チェックリスト

### 移行前

- [ ] AWSアカウント作成・MFA設定
- [ ] VPC・サブネット作成
- [ ] RDS PostgreSQL作成
- [ ] ECRリポジトリ作成
- [ ] Secrets Manager設定
- [ ] Amazon SES ドメイン認証
- [ ] Amazon SES Production Access申請
- [ ] IAMロール作成
- [ ] コード修正（SendGrid → SES）
- [ ] GitHub Secrets設定

### 移行時

- [ ] データベースバックアップ
- [ ] データベース移行
- [ ] App Runnerサービス作成
- [ ] GitHub Actionsでデプロイ
- [ ] ヘルスチェック確認
- [ ] メール送信テスト
- [ ] 案件検索・応募テスト

### 移行後

- [ ] DNS切り替え
- [ ] SSL証明書確認
- [ ] CloudWatch Alarms設定
- [ ] コスト監視設定
- [ ] GCP環境の停止（確認後）
- [ ] ドキュメント更新

---

## 14. トラブルシューティング

### よくある問題

| 問題 | 原因 | 解決方法 |
|------|------|---------|
| App Runnerがデプロイできない | IAMロール権限不足 | ECRアクセスロールを確認 |
| RDSに接続できない | セキュリティグループ設定 | VPC設定を確認 |
| メールが送信できない | SESサンドボックスモード | Production Access申請 |
| メールが届かない | ドメイン認証未完了 | DNS設定を確認 |

---

## 15. 参考リンク

- [AWS App Runner公式ドキュメント](https://docs.aws.amazon.com/apprunner/)
- [Amazon SES公式ドキュメント](https://docs.aws.amazon.com/ses/)
- [Amazon RDS公式ドキュメント](https://docs.aws.amazon.com/rds/)
- [AWS料金計算ツール](https://calculator.aws/)

---

**作成日**: 2025年12月  
**作成者**: 佐藤（開発担当）  
**対象**: ProWorks AWS移行  
**関連ドキュメント**: 
- `AmazonSES_アーキテクチャ.md`
- `技術スタック.md`
- `インフラストラクチャ図.md`
- `メール送信数_月間コスト試算.md`
