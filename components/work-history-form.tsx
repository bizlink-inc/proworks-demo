"use client"

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import { SupportTag } from "@/components/ui/support-tag";
import type { Talent } from "@/lib/kintone/types";

type WorkHistoryFormProps = {
  user: Talent;
  onUpdate: (user: Talent) => void;
};

const FieldSection = ({
  label,
  required = false,
  isEmpty = false,
  children,
}: {
  label: string;
  required?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <section className="py-6">
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-3">
          {required && <SupportTag>必須</SupportTag>}
          <div>
            <p
              className="font-semibold"
              style={{ fontSize: "var(--pw-text-md)", color: "var(--pw-text-primary)" }}
            >
              {label}
            </p>
          </div>
        </div>
        {required && isEmpty && (
          <p style={{ fontSize: "var(--pw-text-xs)", color: "var(--pw-alert-error)" }}>
            ※未入力です
          </p>
        )}
      </div>
      {children}
    </section>
  );
};

export const WorkHistoryForm = ({ user, onUpdate }: WorkHistoryFormProps) => {
  const [formData, setFormData] = useState({
    skills: user.skills || "",
    experience: user.experience || "",
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
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
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
            これまでの実務経験と取得資格について
          </h2>
        </div>

        <div className="mx-6" style={{ borderTop: "1px solid var(--pw-border-lighter)" }} />

        <div className="px-6">
          <FieldSection label="言語・ツールの経験" required isEmpty={!formData.skills}>
        <Textarea
          id="skills"
          placeholder="JavaScript, TypeScript, React, Next.js, Python, AWS など"
          rows={4}
          value={formData.skills}
          onChange={(e) =>
            setFormData({ ...formData, skills: e.target.value })
          }
        />
            <p className="text-xs mt-2" style={{ color: "var(--pw-text-gray)" }}>
          使用経験のある言語やツールを記載してください
        </p>
          </FieldSection>

          <FieldSection label="主な実績・PR・職務経歴" required isEmpty={!formData.experience}>
        <Textarea
          id="experience"
              placeholder="職務経歴・実績・アピールポイントなどをできるだけ具体的にご入力ください。"
          rows={8}
          value={formData.experience}
          onChange={(e) =>
            setFormData({ ...formData, experience: e.target.value })
          }
        />
          </FieldSection>

          <FieldSection label="経歴書アップロード">
        <div className="space-y-4">
          <FileList
            files={formData.resumeFiles}
            onFileDeleted={(fileKey) => {
              const updatedFiles = formData.resumeFiles.filter(file => file.fileKey !== fileKey);
              setFormData({ ...formData, resumeFiles: updatedFiles });
            }}
            disabled={loading}
          />
          
          <FileUpload
            onUploadSuccess={(file) => {
              const newFile = {
                fileKey: file.fileKey,
                name: file.fileName,
                size: file.fileSize,
                contentType: file.contentType,
              };
              // 1ファイルのみなので、既存ファイルを置き換える
              setFormData({ 
                ...formData, 
                resumeFiles: [newFile] 
              });
            }}
            maxFiles={1}
            currentFileCount={formData.resumeFiles.length}
            disabled={loading}
          />
        </div>
          </FieldSection>

          <FieldSection label="ポートフォリオ・GitHubのURL">
        <Input
          id="portfolioUrl"
          type="url"
          placeholder="https://github.com/username"
          value={formData.portfolioUrl}
          onChange={(e) =>
            setFormData({ ...formData, portfolioUrl: e.target.value })
          }
        />
          </FieldSection>

          <div className="flex justify-center py-6">
            <Button
              type="submit"
              variant="pw-primary"
              disabled={loading}
              style={{ fontSize: "var(--pw-text-md)" }}
            >
              {loading ? "保存中..." : "職歴・資格を更新する"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
