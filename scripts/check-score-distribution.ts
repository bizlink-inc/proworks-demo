import { config } from 'dotenv';
config({ path: '.env.local' });

import { KintoneRestAPIClient } from '@kintone/rest-api-client';

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_BASE_URL,
  auth: { apiToken: process.env.KINTONE_RECOMMENDATION_API_TOKEN },
});

async function main() {
  const records = await client.record.getAllRecords({
    app: process.env.KINTONE_RECOMMENDATION_APP_ID,
  });

  const scoreCounts: Record<number, number> = {};
  for (const record of records) {
    const score = Number(record['適合スコア']?.value || 0);
    scoreCounts[score] = (scoreCounts[score] || 0) + 1;
  }

  console.log('========================================');
  console.log('推薦レコード スコア分布');
  console.log('========================================');
  console.log('総レコード数:', records.length);
  console.log('----------------------------------------');
  
  const sortedScores = Object.keys(scoreCounts).map(Number).sort((a, b) => b - a);
  for (const score of sortedScores) {
    console.log(`スコア ${score}点: ${scoreCounts[score]}件`);
  }
  console.log('========================================');
}

main();
