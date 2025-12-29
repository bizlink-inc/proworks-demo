#!/bin/bash
# .env.local から環境変数を読み込んでデプロイ
#
# Usage:
#   ./scripts/deploy.sh dev   # 開発環境にデプロイ
#   ./scripts/deploy.sh prod  # 本番環境にデプロイ

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAMBDA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$LAMBDA_DIR")"

echo "=== ProWorks Lambda デプロイ ==="
echo "環境: $ENV"
echo ""

# .env.local を読み込み
if [ -f "$PROJECT_DIR/.env.local" ]; then
  echo ".env.local から環境変数を読み込み中..."
  set -a
  source "$PROJECT_DIR/.env.local"
  set +a
else
  echo "エラー: $PROJECT_DIR/.env.local が見つかりません"
  exit 1
fi

# 必須環境変数のチェック
REQUIRED_VARS=(
  "KINTONE_BASE_URL"
  "KINTONE_TALENT_API_TOKEN"
  "KINTONE_JOB_API_TOKEN"
  "KINTONE_RECOMMENDATION_API_TOKEN"
  "KINTONE_TALENT_APP_ID"
  "KINTONE_JOB_APP_ID"
  "KINTONE_RECOMMENDATION_APP_ID"
  "DATABASE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "エラー: $var が設定されていません"
    exit 1
  fi
done

echo "環境変数の確認完了"
echo ""

# SAM デプロイ実行
cd "$LAMBDA_DIR"

echo "SAM デプロイを開始..."
sam deploy \
  --config-env "$ENV" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "KintoneBaseUrl=$KINTONE_BASE_URL" \
    "KintoneTalentApiToken=$KINTONE_TALENT_API_TOKEN" \
    "KintoneJobApiToken=$KINTONE_JOB_API_TOKEN" \
    "KintoneRecommendationApiToken=$KINTONE_RECOMMENDATION_API_TOKEN" \
    "KintoneTalentAppId=$KINTONE_TALENT_APP_ID" \
    "KintoneJobAppId=$KINTONE_JOB_APP_ID" \
    "KintoneRecommendationAppId=$KINTONE_RECOMMENDATION_APP_ID" \
    "DatabaseUrl=$DATABASE_URL"

echo ""
echo "=== デプロイ完了 ==="
