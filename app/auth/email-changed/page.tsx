"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CenteredLayout } from "@/components/layouts";
import { PWAlert } from "@/components/ui/pw-alert";
import { CheckCircle } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export default function EmailChangedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // カウントダウン
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3秒後にログアウトしてログイン画面へリダイレクト
    const redirectTimer = setTimeout(async () => {
      await signOut();
      router.push("/auth/signin");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <CenteredLayout showFooter={false}>
      <div className="text-center mb-6">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "#e8f5f0" }}
        >
          <CheckCircle
            className="w-8 h-8"
            style={{ color: "var(--pw-alert-success)" }}
          />
        </div>
        <h1
          className="font-bold mb-2"
          style={{
            fontSize: "var(--pw-text-2xl)",
            color: "var(--pw-text-primary)"
          }}
        >
          メールアドレス変更完了
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          メールアドレスが正常に変更されました。
        </p>
      </div>

      <PWAlert variant="success">
        <p className="mb-2">
          メールアドレスの変更が完了しました。
        </p>
        <p>
          セキュリティのため、新しいメールアドレスで再度ログインしてください。
        </p>
      </PWAlert>

      <div className="pt-4 text-center">
        <p
          style={{
            fontSize: "var(--pw-text-sm)",
            color: "var(--pw-text-gray)"
          }}
        >
          {countdown}秒後にログイン画面へ移動します...
        </p>
      </div>
    </CenteredLayout>
  );
}

