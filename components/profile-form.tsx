"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Talent } from "@/lib/kintone/types";

type ProfileFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

export const ProfileForm = ({ user, onUpdate }: ProfileFormProps) => {
  const [formData, setFormData] = useState(user);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: formData.lastName,
          firstName: formData.firstName,
          fullName: `${formData.lastName} ${formData.firstName}`,
          fullNameKana: formData.fullNameKana,
          email: formData.email,
          birthDate: formData.birthDate,
          postalCode: formData.postalCode,
          address: formData.address,
          phone: formData.phone,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        toast({
          title: "保存しました",
          description: "プロフィール情報を更新しました。",
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastName">姓</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="firstName">名</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="fullNameKana">フリガナ</Label>
        <Input
          id="fullNameKana"
          placeholder="ヤマダ タロウ"
          value={formData.fullNameKana}
          onChange={(e) =>
            setFormData({ ...formData, fullNameKana: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="birthDate">生年月日</Label>
        <Input
          id="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={(e) =>
            setFormData({ ...formData, birthDate: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">電話番号</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="090-1234-5678"
          value={formData.phone || ""}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="postalCode">郵便番号</Label>
        <Input
          id="postalCode"
          placeholder="123-4567"
          value={formData.postalCode || ""}
          onChange={(e) =>
            setFormData({ ...formData, postalCode: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="address">住所</Label>
        <Input
          id="address"
          placeholder="東京都渋谷区..."
          value={formData.address || ""}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? "保存中..." : "保存"}
      </Button>
    </form>
  );
};
