# ============================================
# Stage 1: 依存関係のインストール
# ============================================
FROM node:20-alpine AS deps

# 必要なシステムパッケージをインストール
RUN apk add --no-cache libc6-compat

WORKDIR /app

# package.json と lock ファイルをコピー
COPY package.json package-lock.json* ./

# 依存関係をインストール
RUN npm ci --legacy-peer-deps

# ============================================
# Stage 2: アプリケーションのビルド
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数を設定（ビルド時に必要なもの）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js アプリをビルド
RUN npm run build

# ============================================
# Stage 3: 本番用イメージ
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# セキュリティのため非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 環境変数を設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ファイルの所有者を変更
RUN chown -R nextjs:nodejs /app

# 非rootユーザーに切り替え
USER nextjs

# ポート設定
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"]

