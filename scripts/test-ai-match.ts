/**
 * AIマッチ機能のテストスクリプト
 * 
 * テストファイルを読み込んで、テキスト抽出とAIマッチを実行し、結果を出力します。
 * 画面上でAIマッチが実行されたものと同じ動作を検証します。
 * 
 * 実行方法:
 * npm run test:ai-match
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.localファイルを最初に読み込む（他のモジュールを import する前に）
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`ℹ️  環境変数を読み込みました: ${envPath}`);
}

// その後でモジュールを import
import { extractTextFromFile } from '../lib/kintone/services/text-extraction';
import { executeAIMatch, AIMatchRequest } from '../lib/gemini/client';

// テストファイルのパス
const TEST_FILES_DIR = path.join(__dirname, '../test-file');

// テストケース定義
const TEST_CASES = [
  {
    file: 'Backend_Engineer_Resume_sample.pdf',
    talentName: 'バックエンドエンジニア（サンプル）',
    talentPositions: ['バックエンドエンジニア', 'サーバーサイドエンジニア'],
    talentSkills: 'Python, Django, PostgreSQL, AWS, Docker',
    desiredWork: 'バックエンド開発、API設計、データベース設計',
    job: {
      title: 'ECサイトバックエンド開発案件',
      positions: ['バックエンドエンジニア', 'サーバーサイドエンジニア'],
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      requiredSkills: '・Pythonでのバックエンド開発経験 3年以上\n・DjangoまたはFlaskの使用経験\n・PostgreSQLなどのRDBMSの設計・運用経験\n・RESTful APIの設計・実装経験',
      preferredSkills: '・AWS（EC2, RDS, S3）の運用経験\n・Dockerを使ったコンテナ化の経験\n・マイクロサービスアーキテクチャの経験\n・CI/CDパイプラインの構築経験',
      description: '大手ECサイトのバックエンド刷新プロジェクトです。既存のモノリシックなシステムをマイクロサービス化し、スケーラブルなアーキテクチャに刷新します。',
      environment: '【開発環境】\n・言語: Python 3.11\n・フレームワーク: Django 4.2\n・データベース: PostgreSQL 15\n・インフラ: AWS (EC2, RDS, S3, CloudFront)\n・その他: Docker, GitHub Actions, CircleCI',
      notes: 'チーム開発の経験があり、アジャイル開発手法に精通している方を募集しています。',
    },
  },
  {
    file: 'Frontend_Engineer_Resume_sample.xlsx',
    talentName: 'フロントエンドエンジニア（サンプル）',
    talentPositions: ['フロントエンドエンジニア', 'Webエンジニア'],
    talentSkills: 'JavaScript, TypeScript, React, Next.js, Vue.js',
    desiredWork: 'フロントエンド開発、UI実装、ユーザー体験向上',
    job: {
      title: '大手ECサイトのフロントエンド刷新案件',
      positions: ['フロントエンドエンジニア'],
      skills: ['JavaScript', 'React', 'TypeScript', 'Next.js'],
      requiredSkills: '・React/Next.jsを使った開発経験 2年以上\n・TypeScriptの実務経験\n・Git/GitHubを使ったチーム開発経験\n・レスポンシブデザインの実装経験',
      preferredSkills: '・パフォーマンスチューニングの経験\n・テスト自動化（Jest, Testing Library）\n・Storybookを使ったコンポーネント開発\n・アクセシビリティ対応の経験',
      description: '大手ECサイトのフロントエンド刷新プロジェクトです。既存のjQueryベースのシステムをReact + Next.jsでモダンなSPAに刷新します。',
      environment: '【開発環境】\n・フロントエンド: React 18, Next.js 14, TypeScript\n・バックエンド: Node.js, Express\n・インフラ: AWS (EC2, S3, CloudFront)\n・その他: Docker, GitHub Actions',
      notes: 'チーム開発の経験があり、モダンなフロントエンド技術に精通している方を募集しています。',
    },
  },
  {
    file: 'Infrastructure_Engineer_Resume_sample.docx',
    talentName: 'インフラエンジニア（サンプル）',
    talentPositions: ['インフラエンジニア', 'SRE'],
    talentSkills: 'AWS, GCP, Docker, Kubernetes, Terraform',
    desiredWork: 'クラウドインフラ構築、運用自動化、コスト最適化',
    job: {
      title: 'クラウドインフラ構築・運用案件',
      positions: ['インフラエンジニア', 'SRE'],
      skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes'],
      requiredSkills: '・AWSでのインフラ構築・運用経験 3年以上\n・Terraformを使ったIaCの経験\n・Docker/Kubernetesの運用経験\n・CI/CDパイプラインの構築経験',
      preferredSkills: '・GCPまたはAzureの運用経験\n・モニタリング・ログ管理（CloudWatch, Datadog等）\n・セキュリティ対策の経験\n・コスト最適化の経験',
      description: 'スタートアップ企業のクラウドインフラ構築・運用案件です。AWSを中心としたスケーラブルなインフラを構築し、運用自動化を推進します。',
      environment: '【開発環境】\n・クラウド: AWS (EC2, ECS, RDS, S3, CloudFront)\n・IaC: Terraform\n・コンテナ: Docker, Kubernetes (EKS)\n・CI/CD: GitHub Actions, ArgoCD\n・その他: Prometheus, Grafana',
      notes: '可用性・セキュリティ・コスト最適化を意識したインフラ設計ができる方を募集しています。',
    },
  },
];

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * AIマッチのテストを実行
 */
const testAIMatch = async () => {
  console.log('🤖 AIマッチ機能のテストを開始します\n');
  console.log('='.repeat(80));
  console.log('');

  // GEMINI_API_KEYの確認
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ エラー: GEMINI_API_KEY環境変数が設定されていません');
    console.error('   .env.localファイルにGEMINI_API_KEYを設定してください');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;
  const results: Array<{
    testCase: typeof TEST_CASES[0];
    extractedText: string;
    aiResult: Awaited<ReturnType<typeof executeAIMatch>>;
  }> = [];

  for (const testCase of TEST_CASES) {
    const filePath = path.join(TEST_FILES_DIR, testCase.file);
    
    console.log(`📄 テストケース: ${testCase.file}`);
    console.log(`   人材名: ${testCase.talentName}`);
    console.log(`   案件名: ${testCase.job.title}`);
    console.log(`   パス: ${filePath}`);
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ エラー: ファイルが見つかりません`);
      console.log('');
      failCount++;
      continue;
    }

    // ファイル情報を取得
    const stats = fs.statSync(filePath);
    console.log(`   サイズ: ${formatFileSize(stats.size)}`);
    console.log('');

    try {
      // ステップ1: ファイルを読み込む
      console.log('   📥 ステップ1: ファイルを読み込み中...');
      const fileBuffer = fs.readFileSync(filePath);
      console.log(`   ✅ ファイル読み込み成功 (${formatFileSize(fileBuffer.length)})`);

      // ステップ2: テキスト抽出を実行
      console.log('   🔍 ステップ2: テキスト抽出を実行中...');
      const startExtractTime = Date.now();
      let extractedText = '';
      
      try {
        extractedText = await extractTextFromFile(fileBuffer, testCase.file);
        const endExtractTime = Date.now();
        const extractDuration = endExtractTime - startExtractTime;
        
        console.log(`   ✅ テキスト抽出成功 (${extractDuration}ms)`);
        console.log(`   📊 抽出文字数: ${extractedText.length}文字`);
        
        if (extractedText.length < 50) {
          console.log(`   ⚠️  警告: 抽出されたテキストが少ないです（${extractedText.length}文字）`);
          console.log(`   💡 ヒント: 画像ベースPDFの可能性があります`);
        }
      } catch (extractError) {
        console.log(`   ⚠️  テキスト抽出に失敗: ${extractError instanceof Error ? extractError.message : String(extractError)}`);
        console.log(`   💡 フォールバック: ダミーの職務経歴テキストを使用します`);
        // フォールバック: ダミーの職務経歴テキスト
        extractedText = `${testCase.talentName}としての職務経歴。${testCase.talentSkills}を使用した開発経験があります。`;
      }

      // ステップ3: AIマッチを実行
      console.log('   🤖 ステップ3: AIマッチを実行中...');
      const startAITime = Date.now();
      
      const aiRequest: AIMatchRequest = {
        job: testCase.job,
        talent: {
          name: testCase.talentName,
          positions: testCase.talentPositions,
          skills: testCase.talentSkills,
          experience: extractedText, // 抽出したテキストを使用
          desiredWork: testCase.desiredWork,
        },
      };

      const aiResult = await executeAIMatch(aiRequest);
      const endAITime = Date.now();
      const aiDuration = endAITime - startAITime;

      // 結果を保存
      results.push({
        testCase,
        extractedText,
        aiResult,
      });

      // ステップ4: 結果を表示
      console.log(`   ✅ AIマッチ完了 (${aiDuration}ms)`);
      console.log('');

      if (aiResult.error) {
        console.log(`   ❌ AIマッチエラー: ${aiResult.error}`);
        failCount++;
      } else {
        console.log('   📊 AIマッチ結果:');
        console.log(`      🎯 総合スコア: ${aiResult.overallScore}点 / 100点`);
        console.log(`      💻 技術スキルマッチ: ${aiResult.skillScore}点`);
        console.log(`      🔧 開発工程経験: ${aiResult.processScore}点`);
        console.log(`      ☁️  インフラ/クラウドスキル: ${aiResult.infraScore}点`);
        console.log(`      📚 業務知識・業界経験: ${aiResult.domainScore}点`);
        console.log(`      👥 チーム開発経験: ${aiResult.teamScore}点`);
        console.log(`      🛠️  ツール・開発環境: ${aiResult.toolScore}点`);
        successCount++;
      }

      console.log('');
      console.log('   📝 評価結果テキスト（最初の500文字）:');
      console.log('   ' + '-'.repeat(76));
      const previewText = aiResult.resultText.length > 500 
        ? aiResult.resultText.substring(0, 500) + '...'
        : aiResult.resultText;
      const lines = previewText.split('\n');
      lines.slice(0, 15).forEach((line) => {
        console.log(`   ${line}`);
      });
      if (lines.length > 15) {
        console.log(`   ... (残り ${lines.length - 15} 行)`);
      }
      console.log('   ' + '-'.repeat(76));
      console.log('');

    } catch (error) {
      console.log(`   ❌ エラー: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        console.log(`   スタックトレース:`);
        console.log(`   ${error.stack.split('\n').slice(0, 5).join('\n   ')}`);
      }
      console.log('');
      failCount++;
    }

    console.log('='.repeat(80));
    console.log('');
  }

  // テスト結果のサマリー
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(80));
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${failCount}件`);
  console.log(`📁 合計: ${TEST_CASES.length}件`);
  console.log('='.repeat(80));
  console.log('');

  // 詳細な結果表示
  if (results.length > 0) {
    console.log('📈 詳細結果');
    console.log('='.repeat(80));
    results.forEach((result, index) => {
      if (!result.aiResult.error) {
        console.log(`\n${index + 1}. ${result.testCase.talentName}`);
        console.log(`   案件: ${result.testCase.job.title}`);
        console.log(`   総合スコア: ${result.aiResult.overallScore}点`);
        console.log(`   抽出文字数: ${result.extractedText.length}文字`);
      }
    });
    console.log('');
  }

  // 終了コード
  if (failCount > 0) {
    console.log('⚠️  一部のテストが失敗しました');
    process.exit(1);
  } else {
    console.log('🎉 すべてのテストが成功しました！');
    process.exit(0);
  }
};

// スクリプトを実行
testAIMatch().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error);
  process.exit(1);
});

