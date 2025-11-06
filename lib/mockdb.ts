// モックデータベース（in-memory）

export type User = {
  id: string
  email: string
  password: string
  lastName: string
  firstName: string
  lastNameKana: string
  firstNameKana: string
  birthdate: string
  phone?: string
  address?: string
}

export type Job = {
  id: string
  title: string
  description: string
  skills: string[]
  unitPrice: { min: number; max: number; unit: "JPY/m" | "JPY/h" }
  location: "Remote" | "Tokyo" | "Osaka" | string
  isNew: boolean
  company: { id: string; name: string }
  contractType: string
  requiredSkills: string[]
  preferredSkills: string[]
  workingHours: string
}

export type Application = {
  id: string
  jobId: string
  userId: string
  status: "回答待ち" | "応募終了" | "面談調整中" | "契約締結"
  appliedAt: string
}

// ユーザーデータ（2名）
export const users: User[] = [
  {
    id: "u1",
    email: "1test@test.com",
    password: "1234",
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "ヤマダ",
    firstNameKana: "タロウ",
    birthdate: "1990-05-15",
    phone: "090-1234-5678",
    address: "東京都渋谷区1-2-3",
  },
  {
    id: "u2",
    email: "2test@test.com",
    password: "1234",
    lastName: "佐藤",
    firstName: "花子",
    lastNameKana: "サトウ",
    firstNameKana: "ハナコ",
    birthdate: "1992-08-20",
    phone: "080-9876-5432",
    address: "大阪府大阪市北区4-5-6",
  },
]

// 案件データ（30件）
export const jobs: Job[] = Array.from({ length: 30 }, (_, i) => {
  const id = `job${i + 1}`
  const locations = ["Remote", "Tokyo", "Osaka"]
  const companies = [
    { id: "c1", name: "株式会社テックソリューション" },
    { id: "c2", name: "株式会社クラウドシステムズ" },
    { id: "c3", name: "株式会社デジタルイノベーション" },
    { id: "c4", name: "株式会社エンタープライズ開発" },
    { id: "c5", name: "株式会社モバイルアプリ" },
  ]

  return {
    id,
    title: `${["フロントエンド", "バックエンド", "フルスタック", "インフラ", "データサイエンス"][i % 5]}エンジニア募集 #${i + 1}`,
    description: `プロジェクト概要：大規模Webアプリケーションの開発に携わっていただきます。最新技術を活用し、ユーザー体験の向上を目指します。`,
    skills: ["React", "TypeScript", "Next.js", "Node.js", "AWS"].slice(0, (i % 3) + 2),
    unitPrice: {
      min: 600000 + i * 10000,
      max: 800000 + i * 10000,
      unit: "JPY/m",
    },
    location: locations[i % 3],
    isNew: i < 5,
    company: companies[i % 5],
    contractType: "業務委託",
    requiredSkills: ["React", "TypeScript"],
    preferredSkills: ["Next.js", "GraphQL"],
    workingHours: "週5日、リモート可",
  }
})

// 応募データ（u1のみ1件）
export const applications: Application[] = [
  {
    id: "app1",
    jobId: "job1",
    userId: "u1",
    status: "回答待ち",
    appliedAt: new Date("2025-01-15T10:30:00").toISOString(),
  },
]
