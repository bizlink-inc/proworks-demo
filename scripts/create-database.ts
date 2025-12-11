/**
 * RDSデータベース作成スクリプト
 */
import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

const createDatabase = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL環境変数が設定されていません");
  }

  // postgresデータベースに接続するためのURLを作成
  const postgresUrl = databaseUrl.replace(/\/[^\/]+$/, "/postgres");
  
  console.log("📦 データベース作成スクリプトを実行します");
  console.log(`   接続先: ${postgresUrl.replace(/:[^:@]+@/, ":****@")}`);
  
  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: postgresUrl.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // データベースが存在するか確認
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'proworks'"
    );
    
    if (dbCheck.rows.length > 0) {
      console.log("✅ データベース 'proworks' は既に存在します");
      client.release();
      await pool.end();
      return;
    }
    
    // データベースを作成
    await client.query("CREATE DATABASE proworks");
    console.log("✅ データベース 'proworks' を作成しました");
    
    client.release();
    await pool.end();
  } catch (error: any) {
    console.error("❌ エラーが発生しました:", error.message);
    await pool.end();
    throw error;
  }
};

createDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});

