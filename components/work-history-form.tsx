"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Talent } from "@/lib/kintone/types";

type WorkHistoryFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

export const WorkHistoryForm = ({ user, onUpdate }: WorkHistoryFormProps) => {
  const [formData, setFormData] = useState({
    skills: user.skills || "",
    experience: user.experience || "",
    portfolioUrl: user.portfolioUrl || "",
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 添付ファイルがある場合はアップロード
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadRes = await fetch("/api/talents/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("ファイルのアップロードに失敗しました");
        }
      }

      // プロフィール情報を更新
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
          description: "職歴・スキル情報を更新しました。",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="skills">言語・ツールの経験</Label>
        <Textarea
          id="skills"
          placeholder="JavaScript, TypeScript, React, Next.js, Python, AWS など"
          rows={4}
          value={formData.skills}
          onChange={(e) =>
            setFormData({ ...formData, skills: e.target.value })
          }
        />
        <p className="text-xs text-gray-500 mt-1">
          使用経験のある言語やツールを記載してください
        </p>
      </div>

      <div>
        <Label htmlFor="experience">主な実績・PR・職務経歴</Label>
        <Textarea
          id="experience"
          placeholder="これまでの実績や職務経歴を記載してください"
          rows={8}
          value={formData.experience}
          onChange={(e) =>
            setFormData({ ...formData, experience: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="resume">経歴書アップロード</Label>
        <Input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        <p className="text-xs text-gray-500 mt-1">
          PDF、Word形式のファイルをアップロードできます
        </p>
        {user.resumeFiles && user.resumeFiles.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            現在のファイル: {user.resumeFiles[0].name}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="portfolioUrl">ポートフォリオ・GitHubのURL</Label>
        <Input
          id="portfolioUrl"
          type="url"
          placeholder="https://github.com/username"
          value={formData.portfolioUrl}
          onChange={(e) =>
            setFormData({ ...formData, portfolioUrl: e.target.value })
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
