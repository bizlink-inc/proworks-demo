"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CenteredLayout } from "@/components/layouts";
import { PWAlert } from "@/components/ui/pw-alert";
import { CheckCircle } from "lucide-react";

export default function EmailChangedPage() {
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
          次回ログイン時は、新しいメールアドレスをご使用ください。
        </p>
      </PWAlert>

      <div className="pt-4 space-y-2">
        <Link href="/me" className="block">
          <Button variant="pw-primary" className="w-full">
            マイページへ
          </Button>
        </Link>
        <Link href="/" className="block">
          <Button variant="pw-outline" className="w-full">
            トップページへ
          </Button>
        </Link>
      </div>
    </CenteredLayout>
  );
}

