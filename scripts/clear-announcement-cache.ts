/**
 * お知らせのローカルストレージキャッシュをクリアするスクリプト
 * 
 * 使用方法:
 *   npm run cache:clear:announcements
 * 
 * このコマンドを実行すると、ブラウザでキャッシュクリアページが開き、
 * 自動的にキャッシュがクリアされてトップページにリダイレクトされます。
 */

import { exec } from "child_process";
import { platform } from "os";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CLEAR_CACHE_URL = `${APP_URL}/api/dev/clear-announcement-cache`;

const openBrowser = (url: string) => {
  const os = platform();
  let command: string;

  if (os === "darwin") {
    // macOS
    command = `open "${url}"`;
  } else if (os === "win32") {
    // Windows
    command = `start "${url}"`;
  } else {
    // Linux
    command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error("❌ ブラウザを開けませんでした:", error);
      console.log(`\n💡 以下のURLをブラウザで開いてください:`);
      console.log(`   ${url}\n`);
    }
  });
};

console.log("\n🗑️  お知らせのキャッシュをクリアします\n");
console.log(`📡 ブラウザでキャッシュクリアページを開きます...`);
console.log(`   URL: ${CLEAR_CACHE_URL}\n`);

openBrowser(CLEAR_CACHE_URL);

console.log("✅ ブラウザが開きました。");
console.log("   キャッシュがクリアされ、自動的にトップページにリダイレクトされます。\n");

