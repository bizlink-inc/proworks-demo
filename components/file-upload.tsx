"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, AlertCircle } from "lucide-react";

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
  const [isDragOver, setIsDragOver] = useState(false);
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

  // ドラッグ&ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

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
    <div className="space-y-4">
      {/* ドラッグ&ドロップエリア */}
      <div
        className={`
          border-2 border-dashed rounded-[var(--pw-radius-sm)] p-6 text-center transition-colors
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        style={{
          borderColor: "var(--pw-border-light)",
          backgroundColor: isDragOver ? "#fff" : "var(--pw-bg-light-blue)"
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <Upload 
          className="mx-auto h-12 w-12 mb-4"
          style={{ color: "var(--pw-border-primary)" }}
        />
        <p 
          className="text-lg font-medium mb-2"
          style={{ color: "var(--pw-text-primary)" }}
        >
          ファイルをドラッグ&ドロップ
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--pw-text-gray)" }}>
          または、クリックしてファイルを選択
        </p>
        <div className="text-xs space-y-1" style={{ color: "var(--pw-text-gray)" }}>
          <p>対応形式: PDF, Word (.doc, .docx)</p>
          <p>最大サイズ: 10MB</p>
          <p>最大ファイル数: {maxFiles}個 (現在: {currentFileCount}個)</p>
        </div>
        
        <Button 
          type="button" 
          variant="pw-outline" 
          className="mt-4"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
        >
          ファイルを選択
        </Button>
      </div>

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
