"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

export const EmailChangeForm = () => {
  const [step, setStep] = useState<"form" | "email-sent">("form");
  const [formData, setFormData] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.currentPassword || !formData.newEmail) {
      toast({
        title: "エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      });
      return;
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.newEmail)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newEmail: formData.newEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "メールアドレス変更に失敗しました。");
      }

      setStep("email-sent");
      
      // フォームをリセット
      setFormData({
        currentPassword: "",
        newEmail: "",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "メールアドレス変更に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "email-sent") {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold mb-2 text-green-800">確認メールを送信しました</p>
          <p className="text-sm text-green-800 mb-4">
            新しいメールアドレス（<strong>{formData.newEmail}</strong>）に確認メールを送信しました。
          </p>
          <p className="text-sm text-green-800">
            メール内のリンクをクリックして、メールアドレスの変更を完了してください。
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>ご注意：</strong>
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>確認リンクの有効期限は1時間です</li>
            <li>メールが届かない場合は、迷惑メールフォルダをご確認ください</li>
            <li>確認が完了するまで、現在のメールアドレスが有効です</li>
          </ul>
        </div>

        <Button
          onClick={() => setStep("form")}
          variant="outline"
          className="w-full"
        >
          戻る
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-semibold mb-1 text-blue-800">メールアドレスの変更</p>
        <p className="text-sm text-blue-800">
          セキュリティのため、現在のパスワードを入力してください。新しいメールアドレスに確認メールが送信されます。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentPassword">現在のパスワード</Label>
        <Input
          id="currentPassword"
          type="password"
          placeholder="現在のパスワードを入力"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newEmail">新しいメールアドレス</Label>
        <Input
          id="newEmail"
          type="email"
          placeholder="新しいメールアドレスを入力"
          value={formData.newEmail}
          onChange={(e) =>
            setFormData({ ...formData, newEmail: e.target.value })
          }
          required
          className="w-full"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? "送信中..." : "確認メールを送信"}
      </Button>
    </form>
  );
};

