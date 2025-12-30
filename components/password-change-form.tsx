"use client"

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FormSection } from "@/components/ui/form-section";
import { SupportTag } from "@/components/ui/support-tag";
import { signOut } from "@/lib/auth-client";

export const PasswordChangeForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "エラー",
        description: "新しいパスワードと確認用パスワードが一致しません。",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "エラー",
        description: "新しいパスワードは6文字以上である必要があります。",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.message || "パスワード変更に失敗しました。");
      }

      toast({
        title: "パスワード変更完了",
        description: "セキュリティのため、再度ログインしてください。",
      });

      // セキュリティのため、パスワード変更後はログアウトしてログイン画面へリダイレクト
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "パスワード変更に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormSection title="パスワード変更" description="セキュリティのため、定期的にパスワードを変更することをおすすめします。">
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
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
          <Input
            id="newPassword"
            type="password"
            placeholder="新しいパスワードを入力 (6文字以上)"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
            required
            minLength={6}
            className="w-full"
          />
          <p className="text-xs text-[var(--pw-text-gray)] mt-1">6文字以上で入力してください</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="新しいパスワードを再入力"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
            minLength={6}
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
          {loading ? "変更中..." : "パスワードを変更する"}
        </Button>
      </form>
    </FormSection>
  );
};

