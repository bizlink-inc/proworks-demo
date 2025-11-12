"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, FileText, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileInfo {
  fileKey: string;
  name: string;
  size: number;
  contentType: string;
}

interface FileListProps {
  files: FileInfo[];
  onFileDeleted: (fileKey: string) => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onFileDeleted,
  disabled = false,
}) => {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // ファイル形式のアイコンを取得
  const getFileIcon = (contentType: string): string => {
    if (contentType.includes('pdf')) {
      return '📄'; // PDF
    } else if (contentType.includes('word') || contentType.includes('document')) {
      return '📝'; // Word
    }
    return '📎'; // その他
  };

  // ファイルダウンロード
  const handleDownload = async (file: FileInfo) => {
    if (disabled || downloadingFiles.has(file.fileKey)) return;

    setDownloadingFiles(prev => new Set(prev).add(file.fileKey));

    try {
      console.log("📥 ファイルダウンロード開始:", file.name);

      const response = await fetch(`/api/files/download?fileKey=${encodeURIComponent(file.fileKey)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "ダウンロードに失敗しました");
      }

      // ファイルをBlobとして取得
      const blob = await response.blob();
      
      // ダウンロード用のリンクを作成
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      // クリーンアップ
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("✅ ファイルダウンロード成功:", file.name);

      toast({
        title: "ダウンロード完了",
        description: `${file.name} のダウンロードが完了しました。`,
      });

    } catch (error: any) {
      console.error("❌ ファイルダウンロードエラー:", error);
      
      toast({
        title: "ダウンロードエラー",
        description: error.message || "ファイルのダウンロードに失敗しました。",
        variant: "destructive",
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.fileKey);
        return newSet;
      });
    }
  };

  // ファイル削除
  const handleDelete = async (file: FileInfo) => {
    if (disabled || deletingFiles.has(file.fileKey)) return;

    setDeletingFiles(prev => new Set(prev).add(file.fileKey));

    try {
      console.log("🗑️ ファイル削除開始:", file.name);

      const response = await fetch(`/api/files/delete?fileKey=${encodeURIComponent(file.fileKey)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "削除に失敗しました");
      }

      console.log("✅ ファイル削除成功:", file.name);

      onFileDeleted(file.fileKey);

      toast({
        title: "削除完了",
        description: `${file.name} が削除されました。`,
      });

    } catch (error: any) {
      console.error("❌ ファイル削除エラー:", error);
      
      toast({
        title: "削除エラー",
        description: error.message || "ファイルの削除に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.fileKey);
        return newSet;
      });
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>アップロードされたファイルはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        アップロード済みファイル ({files.length}個)
      </h4>
      
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.fileKey}
            className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-lg">{getFileIcon(file.contentType)}</span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* ダウンロードボタン */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || downloadingFiles.has(file.fileKey)}
                onClick={() => handleDownload(file)}
              >
                {downloadingFiles.has(file.fileKey) ? (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>取得中</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>ダウンロード</span>
                  </div>
                )}
              </Button>

              {/* 削除ボタン */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || deletingFiles.has(file.fileKey)}
                  >
                    {deletingFiles.has(file.fileKey) ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        <span>削除中</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Trash2 className="h-3 w-3" />
                        <span>削除</span>
                      </div>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ファイルを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      「{file.name}」を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(file)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
