"use client";

/**
 * 管理者ログインページ
 * /admin/login
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const AdminLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }

      // ダッシュボードへリダイレクト
      router.push("/admin/dashboard");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--pw-button-primary)] rounded-xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ProWorks
              </h1>
              <p className="text-[var(--pw-button-primary)] text-sm font-medium">
                Admin Console
              </p>
            </div>
          </div>
          <p className="text-[var(--pw-text-light-gray)] text-sm">
            案件マッチング管理システム
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[var(--pw-text-primary)] mb-6 text-center">
            管理者ログイン
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-[var(--pw-alert-error-bg)] border border-[var(--pw-alert-error)] rounded-lg p-3">
                <p className="text-[var(--pw-alert-error)] text-sm text-center">
                  {error}
                </p>
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--pw-text-gray)] mb-2"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-3 border border-[var(--pw-border-gray)] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[var(--pw-button-primary)] focus:border-transparent
                         text-[var(--pw-text-primary)] placeholder:text-[var(--pw-text-light-gray)]
                         transition-all duration-200"
              />
            </div>

            {/* パスワード */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--pw-text-gray)] mb-2"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-[var(--pw-border-gray)] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[var(--pw-button-primary)] focus:border-transparent
                         text-[var(--pw-text-primary)] placeholder:text-[var(--pw-text-light-gray)]
                         transition-all duration-200"
              />
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--pw-button-primary)] text-white font-semibold rounded-lg
                       hover:bg-[#5aa3bc] focus:outline-none focus:ring-2 focus:ring-[var(--pw-button-primary)] focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </form>

          {/* ヒント */}
          <div className="mt-6 pt-6 border-t border-[var(--pw-border-lighter)]">
            <p className="text-xs text-[var(--pw-text-light-gray)] text-center">
              デモ用認証情報
            </p>
            <div className="mt-2 bg-[var(--pw-bg-light-blue)] rounded-lg p-3">
              <p className="text-xs text-[var(--pw-text-gray)] font-mono text-center">
                admin@example.com / admin123
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-[var(--pw-text-light-gray)] mt-6">
          © 2025 ProWorks. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;

