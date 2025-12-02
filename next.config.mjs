/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cloud Run デプロイ用：スタンドアロン出力を有効化
  // これにより、最小限のファイルだけで本番環境が動作する
  output: 'standalone',
}

export default nextConfig
