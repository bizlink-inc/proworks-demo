"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailChangePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const userId = searchParams.get("userId");

  useEffect(() => {
    const verifyEmailChange = async () => {
      if (!token || !email || !userId) {
        setStatus("error");
        setMessage("無効なリンクです。");
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email-change?token=${token}&email=${encodeURIComponent(email)}&userId=${userId}`);
        
        if (response.ok) {
          setStatus("success");
          setMessage("メールアドレスの変更が完了しました。");
          // 3秒後にログインページにリダイレクト
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
        } else {
          const error = await response.json();
          setStatus("error");
          setMessage(error.message || "メールアドレスの変更に失敗しました。");
        }
      } catch (error) {
        setStatus("error");
        setMessage("メールアドレスの変更に失敗しました。");
      }
    };

    verifyEmailChange();
  }, [token, email, userId, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">メールアドレス変更中...</CardTitle>
            <CardDescription>
              メールアドレスの変更を処理しています。しばらくお待ちください。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">変更完了</CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800">
                新しいメールアドレスでログインしてください。
              </p>
              <p className="text-xs text-green-600 mt-2">
                3秒後に自動的にログインページに移動します...
              </p>
            </div>
            <Link href="/auth/signin" className="block">
              <Button className="w-full">今すぐログインページへ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">エラー</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-800">
              リンクが無効か、有効期限が切れている可能性があります。
            </p>
          </div>
          <div className="space-y-2">
            <Link href="/me" className="block">
              <Button className="w-full">マイページに戻る</Button>
            </Link>
            <Link href="/auth/signin" className="block">
              <Button variant="outline" className="w-full">ログインページへ</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
