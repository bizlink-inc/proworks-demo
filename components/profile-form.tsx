"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FormSection } from "@/components/ui/form-section";
import { SupportTag } from "@/components/ui/support-tag";
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
          lastNameKana: formData.lastNameKana,
          firstNameKana: formData.firstNameKana,
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
    <FormSection title="基本情報" description="あなたの基本情報を入力してください">
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
            <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="lastName">姓</Label>
              <SupportTag variant="required">必須</SupportTag>
            </div>
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
            <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="firstName">名</Label>
              <SupportTag variant="required">必須</SupportTag>
            </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
            <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="lastNameKana">姓（フリガナ）</Label>
              <SupportTag variant="optional">任意</SupportTag>
            </div>
          <Input
            id="lastNameKana"
            placeholder="ヤマダ"
            value={formData.lastNameKana}
            onChange={(e) =>
              setFormData({ ...formData, lastNameKana: e.target.value })
            }
          />
        </div>
        <div>
            <div className="flex items-center gap-2 mb-2">
          <Label htmlFor="firstNameKana">名（フリガナ）</Label>
              <SupportTag variant="optional">任意</SupportTag>
            </div>
          <Input
            id="firstNameKana"
            placeholder="タロウ"
            value={formData.firstNameKana}
            onChange={(e) =>
              setFormData({ ...formData, firstNameKana: e.target.value })
            }
          />
        </div>
      </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="email">メールアドレス</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
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
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="birthDate">生年月日</Label>
            <SupportTag variant="required">必須</SupportTag>
          </div>
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
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="phone">電話番号</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
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
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="postalCode">郵便番号</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
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
          <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="address">住所</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
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
          variant="pw-primary"
        disabled={loading}
          style={{ fontSize: "var(--pw-text-md)" }}
      >
          {loading ? "保存中..." : "プロフィールを更新する"}
      </Button>
    </form>
    </FormSection>
  );
};
