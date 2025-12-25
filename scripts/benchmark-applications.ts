/**
 * /applications ページのパフォーマンスベンチマーク
 * 各APIエンドポイントの応答時間を計測
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface BenchmarkResult {
  endpoint: string;
  duration: number;
  status: number;
  dataSize?: number;
}

async function measureEndpoint(endpoint: string, options?: RequestInit): Promise<BenchmarkResult> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    const duration = performance.now() - start;
    let dataSize: number | undefined;
    try {
      const data = await res.json();
      dataSize = JSON.stringify(data).length;
    } catch {
      // ignore
    }
    return { endpoint, duration, status: res.status, dataSize };
  } catch (error) {
    return { endpoint, duration: performance.now() - start, status: 0 };
  }
}

async function runBenchmark() {
  console.log('='.repeat(60));
  console.log('/applications ページ パフォーマンスベンチマーク');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');

  // 注意: このスクリプトは認証が必要なエンドポイントを直接呼べないため、
  // 実際の計測はブラウザのDevToolsで行う必要がある
  
  console.log('📝 ブラウザDevToolsでの計測手順:');
  console.log('1. Chrome DevTools > Network タブを開く');
  console.log('2. "Disable cache" をチェック');
  console.log('3. /applications ページにアクセス');
  console.log('4. 以下のAPIの応答時間を確認:');
  console.log('   - /api/me');
  console.log('   - /api/applications/me');
  console.log('   - /api/recommended-jobs (応募0件の場合)');
  console.log('');
  console.log('目標: 各API 200ms以下、ページ全体 1秒以内');
}

runBenchmark();
