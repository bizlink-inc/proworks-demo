#!/bin/bash

# テストユーザーでログイン
EMAIL="${1:-test@example.com}"
PASSWORD="${2:-test1234}"

echo "🔐 ログインテスト実行中..."
echo "Email: $EMAIL"

# サインインAPIを叩く
RESPONSE=$(curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$RESPONSE" | grep -q "user"; then
  echo "✅ ログイン成功！"
  echo ""
  echo "Cookieが保存されました: cookies.txt"
  echo ""
  echo "ブラウザでこのCookieを使用するには："
  echo "1. ブラウザの開発者ツールを開く"
  echo "2. Application > Cookies > localhost:3000"
  echo "3. 以下のCookieをコピー＆ペースト"
  echo ""
  cat cookies.txt
else
  echo "❌ ログイン失敗"
  echo "$RESPONSE"
fi

