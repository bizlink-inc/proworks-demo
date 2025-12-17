/**
 * テキスト抽出機能のテストスクリプト
 * 
 * テストファイルを読み込んで、テキスト抽出を実行し、結果を出力します。
 * 
 * 実行方法:
 * npm run test:text-extraction
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractTextFromFile } from '../lib/kintone/services/text-extraction';

// テストファイルのパス
const TEST_FILES_DIR = path.join(__dirname, '../test-file');
const TEST_FILES = [
  {
    name: 'Backend_Engineer_Resume_sample.pdf',
    type: 'PDF',
  },
  {
    name: 'Frontend_Engineer_Resume_sample.xlsx',
    type: 'Excel',
  },
  {
    name: 'Infrastructure_Engineer_Resume_sample.docx',
    type: 'Word',
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
 * テキスト抽出のテストを実行
 */
const testTextExtraction = async () => {
  console.log('🧪 テキスト抽出機能のテストを開始します\n');
  console.log('='.repeat(80));
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const testFile of TEST_FILES) {
    const filePath = path.join(TEST_FILES_DIR, testFile.name);
    
    console.log(`📄 テストファイル: ${testFile.name} (${testFile.type})`);
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
      // ファイルを読み込む
      console.log('   📥 ファイルを読み込み中...');
      const fileBuffer = fs.readFileSync(filePath);
      console.log(`   ✅ ファイル読み込み成功 (${formatFileSize(fileBuffer.length)})`);

      // テキスト抽出を実行
      console.log('   🔍 テキスト抽出を実行中...');
      const startTime = Date.now();
      const extractedText = await extractTextFromFile(fileBuffer, testFile.name);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 結果を表示
      console.log(`   ✅ テキスト抽出成功 (${duration}ms)`);
      console.log(`   📊 抽出文字数: ${extractedText.length}文字`);
      console.log('');

      // 抽出されたテキストを表示（最初の500文字）
      console.log('   📝 抽出されたテキスト（最初の500文字）:');
      console.log('   ' + '-'.repeat(76));
      const previewText = extractedText.length > 500 
        ? extractedText.substring(0, 500) + '...'
        : extractedText;
      const lines = previewText.split('\n');
      lines.forEach((line, index) => {
        if (index < 20) { // 最大20行まで表示
          console.log(`   ${line}`);
        }
      });
      if (lines.length > 20) {
        console.log(`   ... (残り ${lines.length - 20} 行)`);
      }
      console.log('   ' + '-'.repeat(76));
      console.log('');

      successCount++;
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
  console.log(`📁 合計: ${TEST_FILES.length}件`);
  console.log('='.repeat(80));

  // 終了コード
  if (failCount > 0) {
    console.log('\n⚠️  一部のテストが失敗しました');
    process.exit(1);
  } else {
    console.log('\n🎉 すべてのテストが成功しました！');
    process.exit(0);
  }
};

// スクリプトを実行
testTextExtraction().catch((error) => {
  console.error('❌ 予期しないエラーが発生しました:', error);
  process.exit(1);
});

