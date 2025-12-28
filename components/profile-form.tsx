"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePostalCode } from "@/hooks/use-postal-code";
import { FieldRow } from "@/components/ui/field-row";
import type { Talent } from "@/lib/kintone/types";

type ProfileFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

export const ProfileForm = ({ user, onUpdate }: ProfileFormProps) => {
  // nullを空文字列に変換してformDataを初期化
  const [formData, setFormData] = useState({
    ...user,
    lastName: user.lastName || "",
    firstName: user.firstName || "",
    lastNameKana: user.lastNameKana || "",
    firstNameKana: user.firstNameKana || "",
    email: user.email || "",
    birthDate: user.birthDate || "",
    phone: user.phone || "",
    postalCode: user.postalCode || "",
    address: user.address || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { fetchAddress, isLoading: isLoadingAddress } = usePostalCode();

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, postalCode: value });

    // ハイフンを除去して7桁かチェック
    const cleanCode = value.replace(/-/g, '');
    if (cleanCode.length === 7 && /^\d+$/.test(cleanCode)) {
      const address = await fetchAddress(value);
      if (address) {
        setFormData(prev => ({
          ...prev,
          postalCode: value,
          address: address.fullAddress
        }));
      }
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="rounded-[var(--pw-radius-sm)] shadow-sm"
        style={{
          backgroundColor: "var(--pw-bg-white)",
          border: "1px solid var(--pw-border-lighter)",
        }}
      >
        <div className="px-6 py-5">
          <h2
            className="font-semibold"
            style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-primary)" }}
          >
            基本情報
          </h2>
          <p
            className="mt-2"
            style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}
          >
            あなたの基本情報を入力してください
          </p>
        </div>

        <div className="mx-6" style={{ borderTop: "1px solid var(--pw-border-lighter)" }} />

        <div className="px-6">
            <FieldRow
              label="姓・名"
              required
              isEmpty={!formData.lastName || !formData.firstName}
              className="border-t-0"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="lastName"
                  placeholder="姓"
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
                <Input
                  id="firstName"
                  placeholder="名"
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
            </FieldRow>

            <FieldRow label="姓（フリガナ）・名（フリガナ）">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="lastNameKana"
                  placeholder="ヤマダ"
                  value={formData.lastNameKana || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastNameKana: e.target.value })
                  }
                />
                <Input
                  id="firstNameKana"
                  placeholder="タロウ"
                  value={formData.firstNameKana || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, firstNameKana: e.target.value })
                  }
                />
              </div>
            </FieldRow>

            <FieldRow
              label="メールアドレス"
              required
              isEmpty={!formData.email}
            >
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </FieldRow>

            <FieldRow label="生年月日">
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </FieldRow>

            <FieldRow label="電話番号">
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </FieldRow>

            <FieldRow label="郵便番号">
              <div className="flex gap-2 items-center">
                <Input
                  id="postalCode"
                  placeholder="123-4567"
                  value={formData.postalCode || ""}
                  onChange={handlePostalCodeChange}
                />
                {isLoadingAddress && (
                  <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}>
                    検索中...
                  </span>
                )}
              </div>
            </FieldRow>

            <FieldRow label="住所">
              <Input
                id="address"
                placeholder="東京都渋谷区..."
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </FieldRow>

            <div className="flex justify-center py-6">
              <Button
                type="submit"
                variant="pw-primary"
                disabled={loading}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                {loading ? "保存中..." : "プロフィールを更新する"}
              </Button>
            </div>
          </div>
        </div>
    </form>
  );
};
