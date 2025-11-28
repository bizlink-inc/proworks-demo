"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { X, FileText, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onUploadSuccess: (file: {
    fileKey: string;
    fileName: string;
    fileSize: number;
    contentType: string;
  }) => void;
  maxFiles?: number;
  currentFileCount?: number;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  maxFiles = 10,
  currentFileCount = 0,
  disabled = false,
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ファイル形式チェック
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return "対応していないファイル形式です。PDF、Word形式のファイルをアップロードしてください。";
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "ファイルサイズが10MBを超えています。";
    }

    if (currentFileCount + uploadingFiles.length >= maxFiles) {
      return `ファイル数の上限（${maxFiles}個）に達しています。`;
    }

    return null;
  };

  // ファイルアップロード処理
  const uploadFile = async (file: File) => {
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: "uploading",
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // XMLHttpRequestを使用して進捗を追跡
      const xhr = new XMLHttpRequest();

      // 進捗更新
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, progress } : f
            )
          );
        }
      });

      // アップロード完了
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploadingFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, status: "success", progress: 100 } : f
            )
          );
          
          onUploadSuccess({
            fileKey: response.fileKey,
            fileName: response.fileName,
            fileSize: response.fileSize,
            contentType: response.contentType,
          });

          // 成功後、少し待ってからリストから削除
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.file !== file));
          }, 2000);

          toast({
            title: "アップロード完了",
            description: `${file.name} のアップロードが完了しました。`,
          });
        } else {
          throw new Error(`アップロードに失敗しました (${xhr.status})`);
        }
      });

      // エラーハンドリング
      xhr.addEventListener("error", () => {
        throw new Error("ネットワークエラーが発生しました");
      });

      xhr.open("POST", "/api/files/upload");
      xhr.send(formData);

    } catch (error: any) {
      console.error("ファイルアップロードエラー:", error);
      
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file 
            ? { ...f, status: "error", error: error.message || "アップロードに失敗しました" }
            : f
        )
      );

      toast({
        title: "アップロードエラー",
        description: error.message || "ファイルのアップロードに失敗しました。",
        variant: "destructive",
      });
    }
  };

  // ファイル選択処理
  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "ファイルエラー",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
        return;
      }
      uploadFile(file);
    });
  }, [currentFileCount, uploadingFiles.length, maxFiles]);

  // ファイル選択ボタンクリック
  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // アップロード中ファイルの削除
  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  return (
    <div className="space-y-3">
      {/* シンプルなファイル選択エリア */}
      <div className="flex items-center gap-4">
        <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
          ※アップロード可能形式：PDF / Word (.doc, .docx)（最大10MB）
        </p>
      </div>
      
      <button
        type="button"
        disabled={disabled}
        onClick={handleFileSelect}
        className={`
          inline-flex items-center px-4 py-2 border rounded-[var(--pw-radius-sm)] text-sm transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
        `}
        style={{
          borderColor: "var(--pw-button-primary)",
          color: "var(--pw-button-primary)",
          backgroundColor: "transparent",
          }}
        >
          ファイルを選択
      </button>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
          }
        }}
        className="hidden"
      />

      {/* アップロード中ファイル一覧 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">アップロード中</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(uploadingFile.file.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                
                {uploadingFile.status === "uploading" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(uploadingFile.file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {uploadingFile.status === "uploading" && (
                <div className="space-y-1">
                  <Progress value={uploadingFile.progress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {uploadingFile.progress}% 完了
                  </p>
                </div>
              )}
              
              {uploadingFile.status === "success" && (
                <div className="flex items-center space-x-1 text-green-600">
                  <span className="text-sm">✅ アップロード完了</span>
                </div>
              )}
              
              {uploadingFile.status === "error" && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{uploadingFile.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
