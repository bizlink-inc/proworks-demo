import {
  getApplicationsByAuthUserId,
  createApplication,
  checkDuplicateApplication,
} from '@/lib/kintone/services/application'
import * as client from '@/lib/kintone/client'

jest.mock('@/lib/kintone/client')

const mockCreateApplicationClient = client.createApplicationClient as jest.MockedFunction<typeof client.createApplicationClient>
const mockGetAppIds = client.getAppIds as jest.MockedFunction<typeof client.getAppIds>

describe('Application Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAppIds.mockReturnValue({
      talent: 1,
      job: 2,
      application: 3,
    } as any)
  })

  const mockApplicationRecord = {
    $id: { value: '123' },
    auth_user_id: { value: 'user-456' },
    案件ID: { value: 'job-789' },
    案件名: { value: 'React開発者募集' },
    対応状況: { value: '応募済み' },
    作成日時: { value: '2025-01-01T10:00:00Z' },
  }

  describe('getApplicationsByAuthUserId', () => {
    it('auth_user_idで応募履歴を取得できる', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [mockApplicationRecord, mockApplicationRecord],
          }),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      const result = await getApplicationsByAuthUserId('user-456')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('123')
      expect(result[0].authUserId).toBe('user-456')
      expect(result[0].jobId).toBe('job-789')
      expect(result[0].status).toBe('応募済み')
      expect(mockClientInstance.record.getRecords).toHaveBeenCalledWith({
        app: 3,
        query: 'auth_user_id = "user-456"',
      })
    })

    it('応募履歴が0件の場合は空配列を返す', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [],
          }),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      const result = await getApplicationsByAuthUserId('user-456')

      expect(result).toHaveLength(0)
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockRejectedValue(new Error('kintone API Error')),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      await expect(getApplicationsByAuthUserId('user-456')).rejects.toThrow('kintone API Error')
    })
  })

  describe('createApplication', () => {
    it('新しい応募を作成できる', async () => {
      const mockClientInstance = {
        record: {
          addRecord: jest.fn().mockResolvedValue({
            id: '789',
          }),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      const result = await createApplication({
        authUserId: 'user-456',
        jobId: 'job-789',
      })

      expect(result).toBe('789')
      const callArgs = mockClientInstance.record.addRecord.mock.calls[0][0]
      expect(callArgs.app).toBe(3)
      expect(callArgs.record.auth_user_id.value).toBe('user-456')
      expect(callArgs.record.案件ID.value).toBe('job-789')
      expect(callArgs.record.対応状況.value).toBe('応募済み')
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          addRecord: jest.fn().mockRejectedValue(new Error('Failed to create application')),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      await expect(
        createApplication({
          authUserId: 'user-456',
          jobId: 'job-789',
        })
      ).rejects.toThrow('Failed to create application')
    })
  })

  describe('checkDuplicateApplication', () => {
    it('重複がある場合はtrueを返す', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [mockApplicationRecord],
          }),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      const result = await checkDuplicateApplication('user-456', 'job-789')

      expect(result).toBe(true)
      expect(mockClientInstance.record.getRecords).toHaveBeenCalledWith({
        app: 3,
        query: 'auth_user_id = "user-456" and 案件ID = "job-789"',
      })
    })

    it('重複がない場合はfalseを返す', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [],
          }),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      const result = await checkDuplicateApplication('user-456', 'job-999')

      expect(result).toBe(false)
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockRejectedValue(new Error('Duplicate check failed')),
        },
      }

      mockCreateApplicationClient.mockReturnValue(mockClientInstance as any)

      await expect(checkDuplicateApplication('user-456', 'job-789')).rejects.toThrow('Duplicate check failed')
    })
  })
})

