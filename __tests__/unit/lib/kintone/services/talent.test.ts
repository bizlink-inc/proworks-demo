import { getTalentByAuthUserId, createTalent, updateTalent } from '@/lib/kintone/services/talent'
import * as client from '@/lib/kintone/client'

// モック
jest.mock('@/lib/kintone/client')
jest.mock('@/lib/kintone/services/file', () => ({
  getFileInfoFromKintone: jest.fn(),
}))

const mockCreateTalentClient = client.createTalentClient as jest.MockedFunction<typeof client.createTalentClient>
const mockGetAppIds = client.getAppIds as jest.MockedFunction<typeof client.getAppIds>

describe('Talent Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAppIds.mockReturnValue({
      talent: 1,
      job: 2,
      application: 3,
    } as any)
  })

  describe('getTalentByAuthUserId', () => {
    it('auth_user_idでタレント情報を正常に取得できる', async () => {
      const mockRecord = {
        $id: { value: '123' },
        auth_user_id: { value: 'user-456' },
        姓: { value: '山田' },
        名: { value: '太郎' },
        氏名: { value: '山田太郎' },
        セイ: { value: 'ヤマダ' },
        メイ: { value: 'タロウ' },
        メールアドレス: { value: 'yamada@example.com' },
        生年月日: { value: '1990-01-01' },
        郵便番号: { value: '100-0001' },
        住所: { value: '東京都千代田区' },
        電話番号: { value: '09012345678' },
        言語_ツール: { value: 'JavaScript, TypeScript, React' },
        主な実績_PR_職務経歴: { value: '様々なWeb開発' },
        職務経歴書データ: { value: [] },
        ポートフォリオリンク: { value: 'https://portfolio.example.com' },
        稼働可能時期: { value: '2025-01-01' },
        希望単価_月額: { value: '800,000' },
        希望勤務日数: { value: '5日' },
        希望出社頻度: { value: 'リモート中心' },
        希望勤務スタイル: { value: 'フリーランス' },
        希望案件_作業内容: { value: 'Web開発' },
        NG企業: { value: '' },
        その他要望: { value: '' },
      }

      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [mockRecord],
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await getTalentByAuthUserId('user-456')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('123')
      expect(result?.authUserId).toBe('user-456')
      expect(result?.lastName).toBe('山田')
      expect(result?.firstName).toBe('太郎')
      expect(result?.email).toBe('yamada@example.com')
      expect(mockClientInstance.record.getRecords).toHaveBeenCalledWith({
        app: 1,
        query: 'auth_user_id = "user-456"',
      })
    })

    it('存在しないauth_user_idはnullを返す', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [],
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await getTalentByAuthUserId('non-existent')

      expect(result).toBeNull()
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockRejectedValue(new Error('kintone API Error')),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await expect(getTalentByAuthUserId('user-456')).rejects.toThrow('kintone API Error')
    })

    it('職務経歴書データが空の場合は空の配列を返す', async () => {
      const mockRecord = {
        $id: { value: '123' },
        auth_user_id: { value: 'user-456' },
        姓: { value: '山田' },
        名: { value: '太郎' },
        氏名: { value: '山田太郎' },
        セイ: { value: 'ヤマダ' },
        メイ: { value: 'タロウ' },
        メールアドレス: { value: 'yamada@example.com' },
        生年月日: { value: '1990-01-01' },
        郵便番号: { value: '100-0001' },
        住所: { value: '東京都千代田区' },
        電話番号: { value: '09012345678' },
        言語_ツール: { value: 'JavaScript' },
        主な実績_PR_職務経歴: { value: 'Web開発' },
        職務経歴書データ: { value: null },
        ポートフォリオリンク: { value: '' },
        稼働可能時期: { value: '2025-01-01' },
        希望単価_月額: { value: '800,000' },
        希望勤務日数: { value: '5日' },
        希望出社頻度: { value: 'リモート中心' },
        希望勤務スタイル: { value: 'フリーランス' },
        希望案件_作業内容: { value: 'Web開発' },
        NG企業: { value: '' },
        その他要望: { value: '' },
      }

      const mockClientInstance = {
        record: {
          getRecords: jest.fn().mockResolvedValue({
            records: [mockRecord],
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await getTalentByAuthUserId('user-456')

      expect(result?.resumeFiles).toEqual([])
    })
  })

  describe('createTalent', () => {
    it('新しいタレント情報を正常に作成できる', async () => {
      const mockClientInstance = {
        record: {
          addRecord: jest.fn().mockResolvedValue({
            id: '789',
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await createTalent({
        authUserId: 'user-456',
        lastName: '山田',
        firstName: '太郎',
        email: 'yamada@example.com',
        phone: '09012345678',
        birthDate: '1990-01-01',
      })

      expect(result).toBe('789')
      expect(mockClientInstance.record.addRecord).toHaveBeenCalled()
    })

    it('必須フィールドが空の場合、メールアドレスから氏名を生成', async () => {
      const mockClientInstance = {
        record: {
          addRecord: jest.fn().mockResolvedValue({
            id: '789',
          }),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      const result = await createTalent({
        authUserId: 'user-456',
        lastName: '',
        firstName: '',
        email: 'yamada@example.com',
        phone: '09012345678',
        birthDate: '1990-01-01',
      })

      expect(result).toBe('789')
      // addRecordの呼び出しで氏名がメールアドレスから生成されることを確認
      const callArgs = mockClientInstance.record.addRecord.mock.calls[0][0]
      expect(callArgs.record.氏名.value).toBe('yamada')
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          addRecord: jest.fn().mockRejectedValue(new Error('Failed to create record')),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await expect(
        createTalent({
          authUserId: 'user-456',
          lastName: '山田',
          firstName: '太郎',
          email: 'yamada@example.com',
          phone: '09012345678',
          birthDate: '1990-01-01',
        })
      ).rejects.toThrow('Failed to create record')
    })
  })

  describe('updateTalent', () => {
    it('タレント情報を正常に更新できる', async () => {
      const mockClientInstance = {
        record: {
          updateRecord: jest.fn().mockResolvedValue({}),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await updateTalent('123', {
        lastName: '鈴木',
        firstName: '花子',
      })

      const callArgs = mockClientInstance.record.updateRecord.mock.calls[0][0]
      expect(callArgs.app).toBe(1)
      expect(callArgs.id).toBe('123')
      expect(callArgs.record.姓.value).toBe('鈴木')
      expect(callArgs.record.名.value).toBe('花子')
    })

    it('部分的なフィールド更新ができる', async () => {
      const mockClientInstance = {
        record: {
          updateRecord: jest.fn().mockResolvedValue({}),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await updateTalent('123', {
        email: 'newemail@example.com',
      })

      const callArgs = mockClientInstance.record.updateRecord.mock.calls[0][0]
      expect(callArgs.app).toBe(1)
      expect(callArgs.id).toBe('123')
      expect(callArgs.record.メールアドレス.value).toBe('newemail@example.com')
      // 他のフィールドが含まれていないことを確認
      expect(Object.keys(callArgs.record)).toEqual(['メールアドレス'])
    })

    it('kintoneエラー時はエラーをスロー', async () => {
      const mockClientInstance = {
        record: {
          updateRecord: jest.fn().mockRejectedValue(new Error('Update failed')),
        },
      }

      mockCreateTalentClient.mockReturnValue(mockClientInstance as any)

      await expect(updateTalent('123', { lastName: '鈴木' })).rejects.toThrow('Update failed')
    })
  })
})

