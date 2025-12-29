/**
 * 統合テスト用シードデータ作成・削除
 * テスト用のKintoneレコードを管理
 */

import {
  createTalentClient,
  createJobClient,
  createApplicationClient,
  getAppIds,
} from "@/lib/kintone/client"
import { TALENT_FIELDS, JOB_FIELDS, APPLICATION_FIELDS } from "@/lib/kintone/fieldMapping"
import { TEST_PREFIX } from "./kintone-setup"

// テストデータの型定義
interface TestTalent {
  authUserId: string
  lastName: string
  firstName: string
  email: string
  phone: string
  birthDate: string
  recordId?: string
}

interface TestJob {
  title: string
  recordId?: string
}

interface TestApplication {
  authUserId: string
  jobId: string
  status: string
  recordId?: string
}

// 作成済みテストデータを追跡（クリーンアップ用）
const createdRecords = {
  talents: [] as { id: string; appId: string }[],
  jobs: [] as { id: string; appId: string }[],
  applications: [] as { id: string; appId: string }[],
}

/**
 * テスト用人材レコードを作成
 */
export const createTestTalent = async (data: TestTalent): Promise<string> => {
  const client = createTalentClient()
  const appId = getAppIds().talent

  const fullName = `${data.lastName} ${data.firstName}`.trim()

  const response = await client.record.addRecord({
    app: appId,
    record: {
      [TALENT_FIELDS.AUTH_USER_ID]: { value: data.authUserId },
      [TALENT_FIELDS.LAST_NAME]: { value: data.lastName },
      [TALENT_FIELDS.FIRST_NAME]: { value: data.firstName },
      [TALENT_FIELDS.FULL_NAME]: { value: fullName },
      [TALENT_FIELDS.EMAIL]: { value: data.email },
      [TALENT_FIELDS.PHONE]: { value: data.phone },
      [TALENT_FIELDS.BIRTH_DATE]: { value: data.birthDate },
    },
  })

  createdRecords.talents.push({ id: response.id, appId })
  console.log(`✅ テスト用人材レコード作成: ID=${response.id}, auth_user_id=${data.authUserId}`)

  return response.id
}

/**
 * テスト用案件レコードを作成
 * Kintoneの必須フィールドを全て設定
 * ※シードデータと同じフォーマットを使用
 */
export const createTestJob = async (data: TestJob): Promise<string> => {
  const client = createJobClient()
  const appId = getAppIds().job

  const response = await client.record.addRecord({
    app: appId,
    record: {
      案件名: { value: data.title },
      職種_ポジション: { value: ["バックエンドエンジニア"] },
      スキル: { value: ["TypeScript", "Node.js"] },
      概要: { value: "統合テスト用案件の概要です。" },
      環境: { value: "TypeScript, Node.js, AWS" },
      必須スキル: { value: "TypeScript経験3年以上" },
      尚可スキル: { value: "AWS経験あれば尚可" },
      勤務地エリア: { value: "東京都渋谷区" },
      最寄駅: { value: "渋谷駅" },
      下限h: { value: 140 },
      上限h: { value: 180 },
      掲載単価: { value: 70 },
      MAX単価: { value: 80 },
      案件期間: { value: "長期" },
      参画時期: { value: "2025-02-01" },
      面談回数: { value: "1回" },
      案件特徴: { value: ["フルリモート可", "長期案件"] },
      ラジオボタン: { value: "募集中" },
      ラジオボタン_0: { value: "有" },
      商流: { value: "二次請け" },
      契約形態: { value: "準委任" },
      リモート可否: { value: "フルリモート" },
      外国籍: { value: "不可" },
      募集人数: { value: 1 },
    },
  })

  createdRecords.jobs.push({ id: response.id, appId })
  console.log(`✅ テスト用案件レコード作成: ID=${response.id}, 案件名=${data.title}`)

  return response.id
}

/**
 * テスト用応募レコードを作成（直接Kintoneに作成）
 */
export const createTestApplication = async (data: TestApplication): Promise<string> => {
  const client = createApplicationClient()
  const appId = getAppIds().application

  const response = await client.record.addRecord({
    app: appId,
    record: {
      [APPLICATION_FIELDS.AUTH_USER_ID]: { value: data.authUserId },
      [APPLICATION_FIELDS.JOB_ID]: { value: data.jobId },
      [APPLICATION_FIELDS.STATUS]: { value: data.status },
    },
  })

  createdRecords.applications.push({ id: response.id, appId })
  console.log(`✅ テスト用応募レコード作成: ID=${response.id}`)

  return response.id
}

/**
 * Kintoneから人材レコードを直接取得（検証用）
 */
export const getTalentFromKintone = async (authUserId: string) => {
  const client = createTalentClient()
  const appId = getAppIds().talent

  const response = await client.record.getRecords({
    app: appId,
    query: `${TALENT_FIELDS.AUTH_USER_ID} = "${authUserId}" limit 1`,
  })

  if (response.records.length === 0) {
    return null
  }

  const record = response.records[0]
  return {
    id: record.$id.value as string,
    authUserId: record[TALENT_FIELDS.AUTH_USER_ID].value as string,
    lastName: record[TALENT_FIELDS.LAST_NAME].value as string,
    firstName: record[TALENT_FIELDS.FIRST_NAME].value as string,
    email: record[TALENT_FIELDS.EMAIL].value as string,
    phone: record[TALENT_FIELDS.PHONE].value as string,
    skills: record[TALENT_FIELDS.SKILLS].value as string,
  }
}

/**
 * Kintoneから応募レコードを直接取得（検証用）
 */
export const getApplicationFromKintone = async (recordId: string) => {
  const client = createApplicationClient()
  const appId = getAppIds().application

  try {
    const response = await client.record.getRecord({
      app: appId,
      id: recordId,
    })

    const record = response.record
    return {
      id: record.$id.value as string,
      authUserId: record[APPLICATION_FIELDS.AUTH_USER_ID].value as string,
      jobId: record[APPLICATION_FIELDS.JOB_ID].value as string,
      status: record[APPLICATION_FIELDS.STATUS].value as string,
    }
  } catch {
    return null
  }
}

/**
 * auth_user_idで応募レコードを検索（検証用）
 */
export const findApplicationsByAuthUserId = async (authUserId: string) => {
  const client = createApplicationClient()
  const appId = getAppIds().application

  const response = await client.record.getRecords({
    app: appId,
    query: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${authUserId}"`,
  })

  return response.records.map((record) => ({
    id: record.$id.value as string,
    authUserId: record[APPLICATION_FIELDS.AUTH_USER_ID].value as string,
    jobId: record[APPLICATION_FIELDS.JOB_ID].value as string,
    status: record[APPLICATION_FIELDS.STATUS].value as string,
  }))
}

/**
 * 既存の案件IDを取得（シードデータで作成済みの案件を使用）
 */
export const getExistingJobIds = async (): Promise<{ jobAId: string; jobBId: string }> => {
  const client = createJobClient()
  const appId = getAppIds().job

  const response = await client.record.getRecords({
    app: appId,
    query: `募集ステータス in ("募集中") limit 2`,
    fields: ["$id"],
  })

  if (response.records.length < 2) {
    throw new Error("テストに必要な案件が見つかりません。シードデータを作成してください。")
  }

  return {
    jobAId: response.records[0].$id.value as string,
    jobBId: response.records[1].$id.value as string,
  }
}

/**
 * デフォルトのテストデータを作成
 * ※案件は既存のものを使用（シードデータで作成済み）
 */
export const createDefaultTestData = async () => {
  const timestamp = Date.now()
  const testUserId = `${TEST_PREFIX}user-${timestamp}`

  // テスト用人材を作成
  const talentId = await createTestTalent({
    authUserId: testUserId,
    lastName: "テスト",
    firstName: "太郎",
    email: `${TEST_PREFIX}${timestamp}@example.com`,
    phone: "090-0000-0000",
    birthDate: "1990-01-01",
  })

  // 既存の案件を使用
  const { jobAId, jobBId } = await getExistingJobIds()
  console.log(`   既存案件を使用: A=${jobAId}, B=${jobBId}`)

  return {
    testUserId,
    talentId,
    jobAId,
    jobBId,
  }
}

/**
 * 作成したテストデータの追跡情報を取得
 */
export const getCreatedRecords = () => createdRecords

/**
 * 追跡情報にレコードを追加（API経由で作成した場合）
 */
export const trackCreatedApplication = (recordId: string) => {
  createdRecords.applications.push({ id: recordId, appId: getAppIds().application })
}
