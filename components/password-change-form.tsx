"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const PasswordChangeForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "エラー",
        description: "新しいパスワードが一致しません。",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "エラー",
        description: "パスワードは6文字以上である必要があります。",
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
        throw new Error(error.message || "パスワード変更に失敗しました");
      }

      toast({
        title: "成功",
        description: "パスワードを変更しました。",
      });

      // フォームをリセット
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">パスワードの変更</p>
        <p className="text-xs">
          セキュリティのため、定期的にパスワードを変更することをおすすめします。
        </p>
      </div>

      <div>
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
        />
      </div>

      <div>
        <Label htmlFor="newPassword">新しいパスワード</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="新しいパスワードを入力（6文字以上）"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          required
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
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
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  );
};

