// テスト用案件データ

export const activeJob = {
  id: "1",
  案件名: "React開発案件",
  概要: "ECサイトのフロントエンド開発",
  職種_ポジション: ["フロントエンドエンジニア"],
  スキル: ["React", "TypeScript", "Next.js"],
  必須スキル: "React経験3年以上",
  尚可スキル: "TypeScript経験",
  勤務地エリア: "東京都",
  最寄駅: "渋谷駅",
  掲載単価: "800000",
  リモート可否: "フルリモート",
  募集ステータス: "募集中",
  案件特徴: ["長期案件", "スキルアップ"],
  面談回数: "1回",
  作成日時: new Date().toISOString(),
}

export const closedJob = {
  id: "2",
  案件名: "終了済み案件",
  概要: "この案件は終了しています",
  職種_ポジション: ["バックエンドエンジニア"],
  スキル: ["Java", "Spring"],
  募集ステータス: "クローズ",
  作成日時: new Date().toISOString(),
}

export const remoteJob = {
  id: "3",
  案件名: "フルリモート案件",
  概要: "完全在宅勤務可能な案件",
  職種_ポジション: ["エンジニア"],
  スキル: ["Python", "Django"],
  リモート可否: "フルリモート",
  募集ステータス: "募集中",
  作成日時: new Date().toISOString(),
}

export const hybridJob = {
  id: "4",
  案件名: "リモート併用案件",
  概要: "週2出社の案件",
  職種_ポジション: ["エンジニア"],
  スキル: ["Go", "Kubernetes"],
  リモート可否: "リモート併用",
  募集ステータス: "募集中",
  作成日時: new Date().toISOString(),
}

export const onsiteJob = {
  id: "5",
  案件名: "常駐案件",
  概要: "オフィス常駐の案件",
  職種_ポジション: ["エンジニア"],
  スキル: ["C#", ".NET"],
  リモート可否: "常駐",
  募集ステータス: "募集中",
  作成日時: new Date().toISOString(),
}

// 検索テスト用のデータセット
export const searchTestJobs = [
  {
    id: "10",
    案件名: "React TypeScript案件",
    スキル: ["React", "TypeScript"],
    募集ステータス: "募集中",
  },
  {
    id: "11",
    案件名: "Vue.js案件",
    スキル: ["Vue.js", "JavaScript"],
    募集ステータス: "募集中",
  },
  {
    id: "12",
    案件名: "Angular案件",
    スキル: ["Angular", "TypeScript"],
    募集ステータス: "募集中",
  },
]
