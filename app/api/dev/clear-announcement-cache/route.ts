import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 開発用: お知らせのキャッシュクリアページ
 * ブラウザでこのURLにアクセスすると、ローカルストレージをクリアしてトップページにリダイレクトします。
 */
export async function GET() {
  // 開発環境のみ許可
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "このエンドポイントは開発環境でのみ使用できます" },
      { status: 403 }
    );
  }

  // HTMLを返して、クライアント側でローカルストレージをクリアしてからリダイレクト
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>キャッシュクリア中...</title>
</head>
<body>
  <p>お知らせのキャッシュをクリア中...</p>
  <script>
    const prefix = "proworks_announcement_dismissed_";
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log("✅ " + keysToRemove.length + "件のキャッシュをクリアしました");
    
    // トップページにリダイレクト
    window.location.href = "/";
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

