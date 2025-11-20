"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FormSection } from "@/components/ui/form-section";
import { SupportTag } from "@/components/ui/support-tag";
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
      <FormSection>
      <div className="space-y-6">
          <div className="bg-[var(--pw-alert-success-bg)] border border-[var(--pw-alert-success)] rounded-lg p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-[var(--pw-alert-success)] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
          </div>
            <p className="font-semibold mb-2" style={{ color: "var(--pw-alert-success)", fontSize: "var(--pw-text-md)" }}>
              確認メールを送信しました
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--pw-text-gray)" }}>
            新しいメールアドレス（<strong>{formData.newEmail}</strong>）に確認メールを送信しました。
          </p>
            <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
            メール内のリンクをクリックして、メールアドレスの変更を完了してください。
          </p>
        </div>

          <div className="bg-[var(--pw-alert-info-bg)] border border-[var(--pw-button-primary)] rounded-lg p-4">
            <p className="text-sm mb-2 font-semibold" style={{ color: "var(--pw-text-primary)" }}>
              ご注意：
          </p>
            <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: "var(--pw-text-gray)" }}>
            <li>確認リンクの有効期限は1時間です</li>
            <li>メールが届かない場合は、迷惑メールフォルダをご確認ください</li>
            <li>確認が完了するまで、現在のメールアドレスが有効です</li>
          </ul>
        </div>

        <Button
          onClick={() => setStep("form")}
            variant="pw-outline"
          className="w-full"
        >
          戻る
        </Button>
      </div>
      </FormSection>
    );
  }

  return (
    <FormSection title="メールアドレス変更" description="セキュリティのため、現在のパスワードを入力してください。新しいメールアドレスに確認メールが送信されます。">
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="currentPassword">現在のパスワード</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
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
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="newEmail">新しいメールアドレス</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
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
          variant="pw-primary"
        disabled={loading}
          className="w-full"
          style={{ fontSize: "var(--pw-text-md)" }}
      >
          {loading ? "送信中..." : "確認メールを送信する"}
      </Button>
    </form>
    </FormSection>
  );
};

