import {
  uploadFileToKintone,
  downloadFileFromKintone,
  getFileInfoFromKintone,
  getFileTypeIcon,
  formatFileSize,
} from '@/lib/kintone/services/file'
import * as client from '@/lib/kintone/client'

jest.mock('@/lib/kintone/client')

const mockCreateTalentClient = client.createTalentClient as jest.MockedFunction<typeof client.createTalentClient>

describe('File Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('uploadFileToKintone', () => {
    it('PDFファイルを正常にアップロードできる', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      const mockClientInstance = {
        file: {
          uploadFile: jest.fn().mockResolvedValue({
            fileKey: 'file-key-123',
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await uploadFileToKintone(mockFile)

      expect(result.fileKey).toBe('file-key-123')
      expect(result.fileName).toBe('test.pdf')
      expect(result.contentType).toBe('application/pdf')
    })

    it('Wordファイル（.docx）を正常にアップロードできる', async () => {
      const mockFile = new File(['test content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      const mockClientInstance = {
        file: {
          uploadFile: jest.fn().mockResolvedValue({
            fileKey: 'file-key-456',
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await uploadFileToKintone(mockFile)

      expect(result.fileKey).toBe('file-key-456')
      expect(result.fileName).toBe('test.docx')
    })

    it('対応していないファイル形式はエラーをスロー', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      mockCreateTalentClient.mockReturnValue({} as any)

      await expect(uploadFileToKintone(mockFile)).rejects.toThrow('対応していないファイル形式です')
    })

    it('10MBを超えるファイルはエラーをスロー', async () => {
      const largeSize = 11 * 1024 * 1024 // 11MB
      const mockFile = new File([new ArrayBuffer(largeSize)], 'large.pdf', { type: 'application/pdf' })

      // ファイルサイズをモック
      Object.defineProperty(mockFile, 'size', { value: largeSize })

      mockCreateTalentClient.mockReturnValue({} as any)

      await expect(uploadFileToKintone(mockFile)).rejects.toThrow('ファイルサイズが10MBを超えています')
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

      const mockClientInstance = {
        file: {
          uploadFile: jest.fn().mockRejectedValue(new Error('Upload failed')),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await expect(uploadFileToKintone(mockFile)).rejects.toThrow('Upload failed')
    })
  })

  describe('downloadFileFromKintone', () => {
    it('ファイルを正常にダウンロードできる', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' })

      const mockClientInstance = {
        file: {
          downloadFile: jest.fn().mockResolvedValue({
            data: mockBlob,
            headers: {
              'content-disposition': 'attachment; filename="test.pdf"',
              'content-type': 'application/pdf',
            },
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await downloadFileFromKintone('file-key-123')

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.fileName).toBe('test.pdf')
    })

    it('Content-Dispositionヘッダーがない場合はデフォルト名を使用', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' })

      const mockClientInstance = {
        file: {
          downloadFile: jest.fn().mockResolvedValue({
            data: mockBlob,
            headers: {
              'content-type': 'application/pdf',
            },
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await downloadFileFromKintone('file-key-123')

      expect(result.fileName).toBe('download')
    })

    it('Bufferデータを正常にBlobに変換できる', async () => {
      const mockBuffer = Buffer.from('file content')

      const mockClientInstance = {
        file: {
          downloadFile: jest.fn().mockResolvedValue({
            data: mockBuffer,
            headers: {
              'content-disposition': 'attachment; filename="test.pdf"',
              'content-type': 'application/pdf',
            },
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await downloadFileFromKintone('file-key-123')

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        file: {
          downloadFile: jest.fn().mockRejectedValue(new Error('Download failed')),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await expect(downloadFileFromKintone('file-key-123')).rejects.toThrow('Download failed')
    })
  })

  describe('getFileInfoFromKintone', () => {
    it('複数のファイル情報を取得できる', async () => {
      const mockClientInstance = {
        file: {
          downloadFile: jest.fn().mockResolvedValue({
            data: new Blob(['content']),
            headers: {
              'content-disposition': 'attachment; filename="test.pdf"',
              'content-length': '1024',
              'content-type': 'application/pdf',
            },
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await getFileInfoFromKintone(['key-1', 'key-2'])

      expect(result).toHaveLength(2)
      expect(result[0].fileKey).toBe('key-1')
      expect(result[0].name).toBe('test.pdf')
      expect(result[0].size).toBe(1024)
    })

    it('空の配列を渡すと空の配列を返す', async () => {
      const result = await getFileInfoFromKintone([])

      expect(result).toHaveLength(0)
    })

    it('エラーが発生したファイルは除外される', async () => {
      const mockClientInstance = {
        file: {
          downloadFile: jest
            .fn()
            .mockResolvedValueOnce({
              data: new Blob(['content']),
              headers: {
                'content-disposition': 'attachment; filename="test1.pdf"',
                'content-length': '1024',
                'content-type': 'application/pdf',
              },
            })
            .mockRejectedValueOnce(new Error('File not found'))
            .mockResolvedValueOnce({
              data: new Blob(['content']),
              headers: {
                'content-disposition': 'attachment; filename="test2.pdf"',
                'content-length': '2048',
                'content-type': 'application/pdf',
              },
            }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await getFileInfoFromKintone(['key-1', 'key-2', 'key-3'])

      expect(result).toHaveLength(2)
      expect(result[0].fileKey).toBe('key-1')
      expect(result[1].fileKey).toBe('key-3')
    })
  })

  describe('getFileTypeIcon', () => {
    it('PDFはPDFアイコンを返す', () => {
      const icon = getFileTypeIcon('application/pdf')
      expect(icon).toBe('📄')
    })

    it('Wordはドキュメントアイコンを返す', () => {
      const icon = getFileTypeIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      expect(icon).toBe('📝')
    })

    it('その他のファイルはクリップアイコンを返す', () => {
      const icon = getFileTypeIcon('text/plain')
      expect(icon).toBe('📎')
    })
  })

  describe('formatFileSize', () => {
    it('0バイトは"0 B"を返す', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('バイトを正しくフォーマット', () => {
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('複数の単位を正しく計算', () => {
      expect(formatFileSize(2560)).toBe('2.5 KB')
      expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB')
    })
  })
})

