import { createTalentClient } from "../client";

export interface FileUploadResult {
  fileKey: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface FileInfo {
  fileKey: string;
  name: string;
  size: number;
  contentType: string;
}

/**
 * kintoneにファイルをアップロードする
 */
export const uploadFileToKintone = async (
  file: File
): Promise<FileUploadResult> => {
  const client = createTalentClient();

  try {
    // ファイル形式チェック
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];
    
    // 拡張子でもチェック（MIME Typeが正しく設定されていない場合に備える）
    const allowedExtensions = ['.pdf', '.docx', '.xlsx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      throw new Error('対応していないファイル形式です。PDF、Word (.docx)、Excel (.xlsx) 形式のファイルをアップロードしてください。');
    }

    // ファイルサイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('ファイルサイズが10MBを超えています。');
    }

    console.log('📤 kintoneファイルアップロード開始:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // FormDataを作成
    const formData = new FormData();
    formData.append('file', file);

    // kintone REST APIでファイルをアップロード
    // Node.js環境ではFileオブジェクトではなくBufferを使用
    let fileData: Buffer | File;
    if (typeof window === 'undefined') {
      // Node.js環境
      fileData = Buffer.from(await file.arrayBuffer());
    } else {
      // ブラウザ環境
      fileData = file;
    }

    const response = await client.file.uploadFile({
      file: {
        name: file.name,
        data: fileData,
      },
    });

    console.log('✅ kintoneファイルアップロード成功:', response.fileKey);

    return {
      fileKey: response.fileKey,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    };
  } catch (error) {
    console.error('❌ kintoneファイルアップロードエラー:', error);
    throw error;
  }
};

/**
 * kintoneからファイルをダウンロードする
 */
export const downloadFileFromKintone = async (
  fileKey: string
): Promise<{ blob: Blob; fileName: string }> => {
  const client = createTalentClient();

  try {
    console.log('📥 kintoneファイルダウンロード開始:', fileKey);

    // kintone SDKのdownloadFileはArrayBufferを返すが、
    // 内部的には{data, headers}構造を持つ場合がある
    const rawResponse = await client.file.downloadFile({
      fileKey,
    });

    console.log('✅ kintoneファイルダウンロード成功:', fileKey);

    // レスポンスの型を判定
    // kintone SDKの型定義はArrayBufferだが、実際には{data, headers}の場合がある
    const response = rawResponse as unknown as {
      data?: ArrayBuffer | Blob | Buffer | string;
      headers?: Record<string, string>;
    } | ArrayBuffer;

    let fileData: ArrayBuffer | Blob | Buffer | string;
    let headers: Record<string, string> | undefined;

    if (response instanceof ArrayBuffer) {
      // 直接ArrayBufferの場合
      fileData = response;
      headers = undefined;
    } else if (response && typeof response === 'object' && 'data' in response) {
      // {data, headers}構造の場合
      fileData = response.data || new ArrayBuffer(0);
      headers = response.headers;
    } else {
      // その他の場合
      fileData = rawResponse as ArrayBuffer;
      headers = undefined;
    }

    // レスポンスからファイル名を取得（Content-Dispositionヘッダーから）
    let fileName = 'download';
    const contentDisposition = headers?.['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    // Content-Typeを取得
    const contentType = headers?.['content-type'] || 'application/octet-stream';

    // dataをBlob形式に変換
    let blobData: Blob;
    if (fileData instanceof Blob) {
      blobData = fileData;
    } else if (Buffer.isBuffer(fileData)) {
      // BufferをUint8Arrayに変換してBlobを作成
      blobData = new Blob([new Uint8Array(fileData)], { type: contentType });
    } else if (typeof fileData === 'string') {
      blobData = new Blob([fileData], { type: contentType });
    } else if (fileData instanceof ArrayBuffer) {
      blobData = new Blob([fileData], { type: contentType });
    } else {
      // その他の形式（ArrayBufferView等）
      blobData = new Blob([fileData as BlobPart], { type: contentType });
    }

    return {
      blob: blobData,
      fileName,
    };
  } catch (error) {
    console.error('❌ kintoneファイルダウンロードエラー:', error);
    throw error;
  }
};

/**
 * ファイル情報を取得する（kintoneレコードから）
 */
export const getFileInfoFromKintone = async (
  fileKeys: string[]
): Promise<FileInfo[]> => {
  if (!fileKeys || fileKeys.length === 0) {
    return [];
  }

  try {
    console.log('📋 kintoneファイル情報取得開始:', fileKeys);

    // 各ファイルキーの情報を取得
    const fileInfoPromises = fileKeys.map(async (fileKey) => {
      try {
        // kintoneのファイル情報取得APIは存在しないため、
        // ダウンロードAPIを使用してヘッダー情報のみ取得
        const client = createTalentClient();
        const rawResponse = await client.file.downloadFile({
          fileKey,
        });

        // レスポンスの型を判定
        const response = rawResponse as unknown as {
          data?: ArrayBuffer | Blob | Buffer | string;
          headers?: Record<string, string>;
        } | ArrayBuffer;

        let headers: Record<string, string> | undefined;
        if (response instanceof ArrayBuffer) {
          headers = undefined;
        } else if (response && typeof response === 'object' && 'headers' in response) {
          headers = response.headers;
        } else {
          headers = undefined;
        }

        // ファイル名をContent-Dispositionから取得
        let fileName = 'unknown';
        const contentDisposition = headers?.['content-disposition'];
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1].replace(/['"]/g, '');
          }
        }

        // ファイルサイズをContent-Lengthから取得
        const contentLength = headers?.['content-length'];
        const fileSize = contentLength ? parseInt(contentLength, 10) : 0;

        // Content-Typeを取得
        const contentType = headers?.['content-type'] || 'application/octet-stream';

        return {
          fileKey,
          name: fileName,
          size: fileSize,
          contentType,
        };
      } catch (error) {
        console.error(`❌ ファイル情報取得エラー (${fileKey}):`, error);
        // エラーが発生したファイルは除外
        return null;
      }
    });

    const results = await Promise.all(fileInfoPromises);
    const validResults = results.filter((result): result is FileInfo => result !== null);

    console.log('✅ kintoneファイル情報取得成功:', validResults.length, '件');
    return validResults;
  } catch (error) {
    console.error('❌ kintoneファイル情報取得エラー:', error);
    throw error;
  }
};

/**
 * ファイル形式の判定
 */
export const getFileTypeIcon = (contentType: string): string => {
  if (contentType.includes('pdf')) {
    return '📄'; // PDF
  } else if (contentType.includes('word') || contentType.includes('document')) {
    return '📝'; // Word
  }
  return '📎'; // その他
};

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
