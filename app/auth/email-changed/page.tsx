"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function EmailChangedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">メールアドレス変更完了</CardTitle>
          <CardDescription>
            メールアドレスが正常に変更されました。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-800 mb-2">
              メールアドレスの変更が完了しました。
            </p>
            <p className="text-sm text-green-800">
              次回ログイン時は、新しいメールアドレスをご使用ください。
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Link href="/me" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                マイページへ
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                トップページへ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

