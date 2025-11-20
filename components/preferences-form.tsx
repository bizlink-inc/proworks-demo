"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FormSection } from "@/components/ui/form-section";
import { SupportTag } from "@/components/ui/support-tag";
import type { Talent } from "@/lib/kintone/types";
import { DROPDOWN_OPTIONS } from "@/lib/kintone/fieldMapping";

type PreferencesFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

export const PreferencesForm = ({ user, onUpdate }: PreferencesFormProps) => {
  const [formData, setFormData] = useState({
    availableFrom: user.availableFrom || "",
    desiredRate: user.desiredRate || "",
    desiredWorkDays: user.desiredWorkDays || "",
    desiredCommute: user.desiredCommute || "",
    desiredWorkStyle: user.desiredWorkStyle || [],
    desiredWork: user.desiredWork || "",
    ngCompanies: user.ngCompanies || "",
    otherRequests: user.otherRequests || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const workStyleOptions = ["リモート", "ハイブリッド", "常駐"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        toast({
          title: "保存しました",
          description: "希望条件を更新しました。",
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

  const toggleWorkStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      desiredWorkStyle: prev.desiredWorkStyle.includes(style)
        ? prev.desiredWorkStyle.filter((s) => s !== style)
        : [...prev.desiredWorkStyle, style],
    }));
  };

  return (
    <FormSection title="希望条件" description="あなたの希望する働き方や条件を入力してください">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="availableFrom">稼働可能時期</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <Input
            id="availableFrom"
            type="date"
            value={formData.availableFrom}
            onChange={(e) =>
              setFormData({ ...formData, availableFrom: e.target.value })
            }
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="desiredRate">希望単価（月額・万円単位）</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <Input
            id="desiredRate"
            type="number"
            placeholder="例: 60"
            value={formData.desiredRate}
            onChange={(e) =>
              setFormData({ ...formData, desiredRate: e.target.value })
            }
          />
          <p className="text-xs text-[var(--pw-text-gray)] mt-1">万円単位で入力してください（60 = 60万円）</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="desiredWorkDays">希望勤務日数</Label>
              <SupportTag variant="optional">任意</SupportTag>
            </div>
            <select
              id="desiredWorkDays"
              value={formData.desiredWorkDays}
              onChange={(e) =>
                setFormData({ ...formData, desiredWorkDays: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-[var(--pw-radius-sm)] focus:outline-none focus:ring-0"
              style={{
                borderColor: "var(--pw-border-gray)",
                fontSize: "var(--pw-text-sm)",
              }}
            >
              <option value="">選択してください</option>
              {DROPDOWN_OPTIONS.DESIRED_WORK_DAYS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="desiredCommute">希望出社頻度</Label>
              <SupportTag variant="optional">任意</SupportTag>
            </div>
            <select
              id="desiredCommute"
              value={formData.desiredCommute}
              onChange={(e) =>
                setFormData({ ...formData, desiredCommute: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-[var(--pw-radius-sm)] focus:outline-none focus:ring-0"
              style={{
                borderColor: "var(--pw-border-gray)",
                fontSize: "var(--pw-text-sm)",
              }}
            >
              <option value="">選択してください</option>
              {DROPDOWN_OPTIONS.DESIRED_COMMUTE.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>希望勤務スタイル</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <div className="space-y-2">
            {workStyleOptions.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={`workstyle-${style}`}
                  checked={formData.desiredWorkStyle.includes(style)}
                  onCheckedChange={() => toggleWorkStyle(style)}
                />
                <Label
                  htmlFor={`workstyle-${style}`}
                  className="cursor-pointer"
                >
                  {style}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="desiredWork">希望案件・作業内容</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <Textarea
            id="desiredWork"
            placeholder="希望する案件の種類や作業内容を記載してください"
            rows={4}
            value={formData.desiredWork}
            onChange={(e) =>
              setFormData({ ...formData, desiredWork: e.target.value })
            }
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="ngCompanies">NG企業</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <Textarea
            id="ngCompanies"
            placeholder="参画を希望しない企業があれば記載してください"
            rows={3}
            value={formData.ngCompanies}
            onChange={(e) =>
              setFormData({ ...formData, ngCompanies: e.target.value })
            }
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="otherRequests">その他要望</Label>
            <SupportTag variant="optional">任意</SupportTag>
          </div>
          <Textarea
            id="otherRequests"
            placeholder="その他のご要望があれば記載してください"
            rows={3}
            value={formData.otherRequests}
            onChange={(e) =>
              setFormData({ ...formData, otherRequests: e.target.value })
            }
          />
        </div>

        <Button
          type="submit"
          variant="pw-primary"
          disabled={loading}
          style={{ fontSize: "var(--pw-text-md)" }}
        >
          {loading ? "保存中..." : "希望条件を更新する"}
        </Button>
      </form>
    </FormSection>
  );
};
