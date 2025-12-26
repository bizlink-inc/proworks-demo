/**
 * ファイルからテキストを抽出するサービス
 * 
 * 対応形式:
 * - PDF (.pdf)
 * - Word (.docx)
 * - Excel (.xlsx)
 */

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * PDFファイルからテキストを抽出
 */
const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    // pdf-parseはCommonJSモジュールなので、動的インポートを使用
    const pdfParseModule = await import('pdf-parse');
    // pdf-parse 2.xではPDFParseクラスを使用
    const { PDFParse } = pdfParseModule;
    
    if (typeof PDFParse === 'function') {
      // PDFParseクラスのインスタンスを作成
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text || '';
    } else {
      // フォールバック: 直接関数として使用を試行
      const pdf = (pdfParseModule as any).default || pdfParseModule;
      if (typeof pdf === 'function') {
        const data = await pdf(buffer);
        return data.text || '';
      }
      throw new Error('pdf-parseの関数またはクラスが見つかりません');
    }
  } catch (error) {
    console.error('PDFテキスト抽出エラー:', error);
    // より詳細なエラー情報を出力
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
    }
    throw new Error('PDFファイルからのテキスト抽出に失敗しました');
  }
};

/**
 * Word (.docx)ファイルからテキストを抽出
 */
const extractTextFromWord = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Wordテキスト抽出エラー:', error);
    throw new Error('Wordファイルからのテキスト抽出に失敗しました');
  }
};

/**
 * Excel (.xlsx)ファイルからテキストを抽出
 * 全シートから抽出し、セル内のテキストを改行で結合
 */
const extractTextFromExcel = async (buffer: Buffer): Promise<string> => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const textParts: string[] = [];

    // 全シートをループ処理
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      // 各行を処理
      sheetData.forEach((row: any) => {
        if (Array.isArray(row)) {
          // セル内の値をフィルタリング（空文字列を除外）
          const cellValues = row
            .filter((cell: any) => cell !== null && cell !== undefined && cell !== '')
            .map((cell: any) => String(cell).trim());
          
          if (cellValues.length > 0) {
            // セル内のテキストを改行で結合
            textParts.push(cellValues.join('\n'));
          }
        }
      });
    });

    return textParts.join('\n\n');
  } catch (error) {
    console.error('Excelテキスト抽出エラー:', error);
    throw new Error('Excelファイルからのテキスト抽出に失敗しました');
  }
};

/**
 * ファイル名から拡張子を取得
 */
const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.substring(lastDotIndex).toLowerCase();
};

/**
 * ファイル形式を判定
 */
const detectFileType = (fileName: string, contentType?: string): 'pdf' | 'docx' | 'xlsx' | 'unknown' => {
  const extension = getFileExtension(fileName);

  // 拡張子から判定
  if (extension === '.pdf') {
    return 'pdf';
  }
  if (extension === '.docx') {
    return 'docx';
  }
  if (extension === '.xlsx') {
    return 'xlsx';
  }

  // MIME Typeから判定（拡張子が取得できない場合）
  if (contentType) {
    if (contentType.includes('pdf')) {
      return 'pdf';
    }
    if (contentType.includes('wordprocessingml') || contentType.includes('docx')) {
      return 'docx';
    }
    if (contentType.includes('spreadsheetml') || contentType.includes('xlsx')) {
      return 'xlsx';
    }
  }

  return 'unknown';
};

/**
 * ファイルからテキストを抽出（メイン関数）
 * 
 * @param buffer ファイルのBuffer
 * @param fileName ファイル名（拡張子判定に使用）
 * @param contentType MIME Type（オプション、拡張子が取得できない場合に使用）
 * @returns 抽出されたテキスト
 */
export const extractTextFromFile = async (
  buffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<string> => {
  const fileType = detectFileType(fileName, contentType);

  switch (fileType) {
    case 'pdf':
      return await extractTextFromPDF(buffer);
    case 'docx':
      return await extractTextFromWord(buffer);
    case 'xlsx':
      return await extractTextFromExcel(buffer);
    default:
      throw new Error(`対応していないファイル形式です: ${fileName}`);
  }
};

