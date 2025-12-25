/**
 * 通知機能テストスクリプト
 *
 * 担当者おすすめ・AIマッチの通知（アプリ内通知 + メール通知）をテストするためのスクリプト。
 * 山田太郎（seed_user_001）を対象に、推薦レコードの作成・更新を行い、
 * 担当者おすすめ設定またはAIマッチを実行します。
 *
 * ⚠️ 重要: このスクリプトはNext.jsサーバー（npm run dev）経由でAPIを呼び出します。
 *          メールのログはこのスクリプトではなく、npm run devのコンソールに出力されます。
 *
 * 使用方法:
 *   npm run test:notification              # 両方実行（担当者おすすめ + AIマッチ）
 *   npm run test:notification -- --staff   # 担当者おすすめのみ
 *   npm run test:notification -- --ai      # AIマッチのみ
 *
 * 前提条件:
 *   - npm run dev でNext.jsサーバーが起動していること
 *   - シードデータが投入済みであること
 *   - 山田太郎（seed_user_001）が存在すること
 */

// 対象ユーザー情報
const YAMADA_AUTH_USER_ID = "seed_user_001";

// コマンドライン引数のパース
const args = process.argv.slice(2);
const runStaffRecommend = args.length === 0 || args.includes("--staff");
const runAIMatch = args.length === 0 || args.includes("--ai");

// モード判定
const getMode = (): "staff" | "ai" | "both" => {
  if (runStaffRecommend && runAIMatch) return "both";
  if (runStaffRecommend) return "staff";
  return "ai";
};

/**
 * メイン処理
 */
const main = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("🔔 通知機能テストスクリプト");
  console.log("=".repeat(80));
  console.log(`📋 対象ユーザー: 山田太郎 (${YAMADA_AUTH_USER_ID})`);
  console.log(`📋 実行モード: ${runStaffRecommend ? "担当者おすすめ " : ""}${runAIMatch ? "AIマッチ" : ""}`);
  console.log("");
  console.log("⚠️  注意: メールのログは npm run dev のコンソールに出力されます");
  console.log("");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/test/notification`;

  console.log(`📌 APIエンドポイント: ${apiUrl}`);
  console.log("-".repeat(40));

  try {
    const mode = getMode();

    console.log(`📡 APIを呼び出し中...`);
    console.log("");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode,
        talentAuthUserId: YAMADA_AUTH_USER_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API呼び出しに失敗しました: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`
      );
    }

    const result = await response.json();

    console.log("=".repeat(80));
    console.log("🎉 通知テスト完了！");
    console.log("=".repeat(80));
    console.log("");
    console.log("📋 結果:");
    console.log(`   人材: ${result.talent.name} (${result.talent.email})`);
    console.log(`   案件: ${result.job.title} (ID: ${result.job.id})`);
    console.log(`   推薦レコードID: ${result.recommendationId}`);
    console.log("");
    console.log("📋 確認方法:");
    console.log("  1. アプリ内通知: ブラウザで http://localhost:3000 にアクセスし、");
    console.log("     山田太郎でログインして通知ベルを確認してください。");
    console.log("");
    console.log("  2. メール通知: npm run dev のコンソールに出力されています。");
    console.log("     （このターミナルではなく、別ターミナルのdevサーバーを確認）");
    console.log("");
    console.log(`📌 対象案件URL: ${baseUrl}/?jobId=${result.job.id}`);
    console.log("");

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("");
      console.error("💡 ヒント: npm run dev でNext.jsサーバーが起動しているか確認してください。");
    }

    process.exit(1);
  }
};

// 実行
main().catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
