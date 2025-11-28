#!/bin/bash

# =====================================================
# Kintone フィールド管理スクリプト
# =====================================================
# 
# 使用方法:
#   ./manage-fields.sh <command> <app_name> [options]
#
# コマンド:
#   get     - 現在のフィールド定義を取得
#   add     - fieldsToAddのフィールドを追加
#   deploy  - 変更をデプロイ（本番反映）
#   status  - デプロイ状況を確認
#
# アプリ名:
#   recommendation - 推薦DB
#   talent         - 人材DB
#   job            - 案件DB
#   application    - 応募履歴DB
#
# オプション:
#   --env=production  - 本番環境を使用（デフォルト: development）
#
# =====================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
SCHEMAS_DIR="$SCRIPT_DIR/schemas"

# デフォルト環境
ENV="development"

# 引数解析
COMMAND=""
APP_NAME=""

for arg in "$@"; do
    case $arg in
        --env=*)
            ENV="${arg#*=}"
            shift
            ;;
        get|add|deploy|status)
            COMMAND="$arg"
            ;;
        recommendation|talent|job|application)
            APP_NAME="$arg"
            ;;
        *)
            ;;
    esac
done

# 引数チェック
if [ -z "$COMMAND" ] || [ -z "$APP_NAME" ]; then
    echo "使用方法: $0 <command> <app_name> [--env=production]"
    echo ""
    echo "コマンド: get, add, deploy, status"
    echo "アプリ: recommendation, talent, job, application"
    exit 1
fi

# 設定読み込み
get_config() {
    python3 << EOF
import json
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
env_config = config.get('$ENV', {})
app_config = env_config.get('apps', {}).get('$APP_NAME', {})
print(f"{env_config.get('baseUrl', '')}|{app_config.get('appId', '')}|{app_config.get('token', '')}")
EOF
}

CONFIG=$(get_config)
BASE_URL=$(echo "$CONFIG" | cut -d'|' -f1)
APP_ID=$(echo "$CONFIG" | cut -d'|' -f2)
API_TOKEN=$(echo "$CONFIG" | cut -d'|' -f3)

if [ -z "$BASE_URL" ] || [ -z "$APP_ID" ] || [ -z "$API_TOKEN" ]; then
    echo "❌ 設定が見つかりません: $ENV / $APP_NAME"
    exit 1
fi

echo "=========================================="
echo "🔧 Kintone フィールド管理"
echo "=========================================="
echo "環境: $ENV"
echo "アプリ: $APP_NAME (ID: $APP_ID)"
echo "コマンド: $COMMAND"
echo "=========================================="

# コマンド実行
case $COMMAND in
    get)
        echo ""
        echo "📋 現在のフィールドを取得中..."
        
        RESPONSE=$(curl -s "$BASE_URL/k/v1/app/form/fields.json" \
            -X GET \
            -H "X-Cybozu-API-Token: $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"app\": $APP_ID}")
        
        # エラーチェック
        if echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); exit(0 if 'properties' in d else 1)" 2>/dev/null; then
            # スキーマファイルを更新
            SCHEMA_FILE="$SCHEMAS_DIR/$APP_NAME.json"
            
            python3 << EOF
import json

response = json.loads('''$RESPONSE''')

# 既存のスキーマファイルがあれば読み込む
try:
    with open('$SCHEMA_FILE', 'r', encoding='utf-8') as f:
        existing = json.load(f)
    fields_to_add = existing.get('fieldsToAdd', {})
except:
    fields_to_add = {}

output = {
    "_comment": "$APP_NAME のフィールド定義",
    "_updatedAt": "$(date +%Y-%m-%d)",
    "revision": response.get("revision"),
    "currentFields": response.get("properties", {}),
    "fieldsToAdd": fields_to_add
}

with open('$SCHEMA_FILE', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ フィールド定義を保存しました: $SCHEMA_FILE")
print(f"   リビジョン: {response.get('revision')}")
print(f"   フィールド数: {len(response.get('properties', {}))}")
EOF
        else
            echo "❌ エラー: $RESPONSE"
            exit 1
        fi
        ;;
        
    add)
        echo ""
        echo "📝 フィールドを追加中..."
        
        SCHEMA_FILE="$SCHEMAS_DIR/$APP_NAME.json"
        
        if [ ! -f "$SCHEMA_FILE" ]; then
            echo "❌ スキーマファイルが見つかりません: $SCHEMA_FILE"
            exit 1
        fi
        
        # fieldsToAddを取得してAPIに送信
        FIELDS_TO_ADD=$(python3 << EOF
import json
with open('$SCHEMA_FILE', 'r', encoding='utf-8') as f:
    schema = json.load(f)
fields = schema.get('fieldsToAdd', {})
if not fields:
    print('{}')
else:
    print(json.dumps(fields, ensure_ascii=False))
EOF
)
        
        if [ "$FIELDS_TO_ADD" = "{}" ]; then
            echo "⚠️ 追加するフィールドがありません"
            exit 0
        fi
        
        RESPONSE=$(curl -s "$BASE_URL/k/v1/preview/app/form/fields.json" \
            -X POST \
            -H "X-Cybozu-API-Token: $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"app\": $APP_ID, \"properties\": $FIELDS_TO_ADD}")
        
        if echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); exit(0 if 'revision' in d else 1)" 2>/dev/null; then
            REVISION=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('revision', ''))")
            echo "✅ フィールド追加成功（リビジョン: $REVISION）"
            echo ""
            echo "⚠️ 変更を反映するには deploy コマンドを実行してください:"
            echo "   $0 deploy $APP_NAME"
        else
            echo "❌ エラー: $RESPONSE"
            exit 1
        fi
        ;;
        
    deploy)
        echo ""
        echo "🚀 変更をデプロイ中..."
        
        RESPONSE=$(curl -s "$BASE_URL/k/v1/preview/app/deploy.json" \
            -X POST \
            -H "X-Cybozu-API-Token: $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"apps\": [{\"app\": $APP_ID}]}")
        
        if [ "$RESPONSE" = "{}" ]; then
            echo "✅ デプロイを開始しました"
            echo ""
            echo "📋 デプロイ状況を確認するには:"
            echo "   $0 status $APP_NAME"
        else
            echo "❌ エラー: $RESPONSE"
            exit 1
        fi
        ;;
        
    status)
        echo ""
        echo "📊 デプロイ状況を確認中..."
        
        RESPONSE=$(curl -s "$BASE_URL/k/v1/preview/app/deploy.json" \
            -X GET \
            -H "X-Cybozu-API-Token: $API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"apps\": [$APP_ID]}")
        
        python3 << EOF
import json
response = json.loads('''$RESPONSE''')
apps = response.get('apps', [])
for app in apps:
    app_id = app.get('app')
    status = app.get('status')
    status_ja = {
        'PROCESSING': '処理中',
        'SUCCESS': '成功',
        'FAIL': '失敗',
        'CANCEL': 'キャンセル'
    }.get(status, status)
    print(f"アプリID: {app_id} - ステータス: {status_ja}")
EOF
        ;;
        
    *)
        echo "❌ 不明なコマンド: $COMMAND"
        exit 1
        ;;
esac

echo ""
echo "=========================================="



