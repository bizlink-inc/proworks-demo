import { getAllJobs, getJobById, clearJobCache } from '@/lib/kintone/services/job'
import * as client from '@/lib/kintone/client'

jest.mock('@/lib/kintone/client')

const mockCreateJobClient = client.createJobClient as jest.MockedFunction<typeof client.createJobClient>
const mockGetAppIds = client.getAppIds as jest.MockedFunction<typeof client.getAppIds>

describe('Job Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // キャッシュをクリア
    clearJobCache()
    mockGetAppIds.mockReturnValue({
      talent: 1,
      job: 2,
      application: 3,
    } as any)
  })

  const mockJobRecord = {
    $id: { value: '123' },
    案件名: { value: 'React開発者募集' },
    案件特徴: { value: '新規プロジェクト' },
    職種_ポジション: { value: 'フロントエンドエンジニア' },
    概要: { value: 'React/TypeScriptでのWeb開発' },
    環境: { value: 'React, TypeScript, Next.js' },
    備考: { value: 'リモート可能' },
    必須スキル: { value: 'React, JavaScript' },
    尚可スキル: { value: 'TypeScript, Next.js' },
    勤務地エリア: { value: '東京' },
    最寄駅: { value: '渋谷駅' },
    下限h: { value: '160' },
    上限h: { value: '200' },
    案件期間: { value: '3ヶ月〜' },
    掲載単価: { value: '800,000' },
    面談回数: { value: '2回' },
  }

  describe('getAllJobs', () => {
    it('すべての案件を正常に取得できる', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [mockJobRecord, mockJobRecord],
          }),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      const result = await getAllJobs()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('123')
      expect(result[0].title).toBe('React開発者募集')
      expect(mockClientInstance.record.getRecords).toHaveBeenCalledWith({
        app: 2,
        query: expect.stringContaining('募集ステータス'),
        fields: expect.any(Array),
      })
    })

    it('案件が0件の場合は空配列を返す', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({ records: [] }),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      const result = await getAllJobs()

      expect(result).toHaveLength(0)
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockRejectedValue(new Error('kintone API Error')),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      await expect(getAllJobs()).rejects.toThrow('kintone API Error')
    })
  })

  describe('getJobById', () => {
    it('IDで案件詳細を正常に取得できる', async () => {
      const mockClientInstance = {
        record: {
          getRecord: jest.fn().mockResolvedValue({
            record: mockJobRecord,
          }),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      const result = await getJobById('123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('123')
      expect(result?.title).toBe('React開発者募集')
      expect(result?.position).toBe('フロントエンドエンジニア')
      expect(mockClientInstance.record.getRecord).toHaveBeenCalledWith({
        app: 2,
        id: '123',
      })
    })

    it('存在しない案件IDはnullを返す', async () => {
      const mockClientInstance = {
        record: {
          getRecord: jest.fn().mockRejectedValue(new Error('Record not found')),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      const result = await getJobById('non-existent')

      expect(result).toBeNull()
    })

    it('kintoneエラー時はnullを返す', async () => {
      const mockClientInstance = {
        record: {
          getRecord: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }

      mockCreateJobClient.mockReturnValue(mockClientInstance as any)

      const result = await getJobById('123')

      expect(result).toBeNull()
    })
  })

})

