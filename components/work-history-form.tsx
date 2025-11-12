"use client"

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import type { Talent } from "@/lib/kintone/types";
import { DROPDOWN_OPTIONS } from "@/lib/kintone/fieldMapping";

type WorkHistoryFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

export const WorkHistoryForm = ({ user, onUpdate }: WorkHistoryFormProps) => {
  const [formData, setFormData] = useState({
    skills: user.skills || "",
    experience: user.experience || "",
    desiredWorkDays: user.desiredWorkDays || "",
    desiredCommute: user.desiredCommute || "",
    portfolioUrl: user.portfolioUrl || "",
    resumeFiles: user.resumeFiles || [],
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // プロフィール情報を更新（ファイル情報も含む）
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: formData.skills,
          experience: formData.experience,
          desiredWorkDays: formData.desiredWorkDays,
          desiredCommute: formData.desiredCommute,
          portfolioUrl: formData.portfolioUrl,
          resumeFiles: formData.resumeFiles,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        toast({
          title: "保存しました",
          description: "職歴・スキル情報を更新しました。",
        });
      } else {
        const error = await res.json();
        throw new Error(error.message || "更新に失敗しました");
      }
    } catch (error: any) {
      console.error("職歴情報更新エラー:", error);
      toast({
        title: "エラー",
        description: error.message || "保存に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="desiredWorkDays">希望勤務日数</Label>
          <select
            id="desiredWorkDays"
            value={formData.desiredWorkDays}
            onChange={(e) =>
              setFormData({ ...formData, desiredWorkDays: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Label htmlFor="desiredCommute">希望出社頻度</Label>
          <select
            id="desiredCommute"
            value={formData.desiredCommute}
            onChange={(e) =>
              setFormData({ ...formData, desiredCommute: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div>
        <Label htmlFor="resume">経歴書アップロード</Label>
        <div className="space-y-4">
          {/* ファイル一覧表示 */}
          <FileList
            files={formData.resumeFiles}
            onFileDeleted={(fileKey) => {
              const updatedFiles = formData.resumeFiles.filter(file => file.fileKey !== fileKey);
              setFormData({ ...formData, resumeFiles: updatedFiles });
            }}
            disabled={loading}
          />
          
          {/* ファイルアップロード */}
          <FileUpload
            onUploadSuccess={(file) => {
              const newFile = {
                fileKey: file.fileKey,
                name: file.fileName,
                size: file.fileSize,
                contentType: file.contentType,
              };
              setFormData({ 
                ...formData, 
                resumeFiles: [...formData.resumeFiles, newFile] 
              });
            }}
            maxFiles={10}
            currentFileCount={formData.resumeFiles.length}
            disabled={loading}
          />
        </div>
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
