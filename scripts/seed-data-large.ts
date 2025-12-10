/**
 * 大規模シードデータ（セット3）
 * 50人の人材 × 50件の案件
 * 
 * カテゴリ構成：
 * - フロントエンド: 10人 × 10案件
 * - バックエンド: 10人 × 10案件
 * - インフラ/クラウド: 10人 × 10案件
 * - モバイル: 10人 × 10案件
 * - データ/AI: 10人 × 10案件
 */

// 日本の名前データ
const FIRST_NAMES = [
  "太郎", "一郎", "健太", "大輔", "翔太", "拓也", "直樹", "和也", "誠", "亮",
  "花子", "美咲", "さくら", "陽子", "真由", "裕子", "明美", "香織", "恵", "綾",
  "隆", "浩二", "勇気", "智也", "康介", "雄一", "慎吾", "達也", "秀樹", "正樹",
  "由美", "麻衣", "彩香", "優子", "理恵", "奈々", "愛", "瞳", "舞", "遥",
  "修", "剛", "豊", "学", "博", "進", "守", "武", "清", "昭"
];

const LAST_NAMES = [
  "田中", "佐藤", "鈴木", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "清水", "山崎",
  "森", "池田", "橋本", "阿部", "石川", "前田", "藤田", "小川", "岡田", "村上",
  "長谷川", "近藤", "石井", "斎藤", "坂本", "遠藤", "青木", "藤井", "西村", "福田",
  "太田", "三浦", "岡本", "松田", "中野", "原田", "小野", "竹内", "金子", "和田"
];

// カタカナ変換用マップ
const KATAKANA_MAP: Record<string, string> = {
  "田中": "タナカ", "佐藤": "サトウ", "鈴木": "スズキ", "高橋": "タカハシ", "伊藤": "イトウ",
  "渡辺": "ワタナベ", "山本": "ヤマモト", "中村": "ナカムラ", "小林": "コバヤシ", "加藤": "カトウ",
  "吉田": "ヨシダ", "山田": "ヤマダ", "佐々木": "ササキ", "山口": "ヤマグチ", "松本": "マツモト",
  "井上": "イノウエ", "木村": "キムラ", "林": "ハヤシ", "清水": "シミズ", "山崎": "ヤマザキ",
  "森": "モリ", "池田": "イケダ", "橋本": "ハシモト", "阿部": "アベ", "石川": "イシカワ",
  "前田": "マエダ", "藤田": "フジタ", "小川": "オガワ", "岡田": "オカダ", "村上": "ムラカミ",
  "長谷川": "ハセガワ", "近藤": "コンドウ", "石井": "イシイ", "斎藤": "サイトウ", "坂本": "サカモト",
  "遠藤": "エンドウ", "青木": "アオキ", "藤井": "フジイ", "西村": "ニシムラ", "福田": "フクダ",
  "太田": "オオタ", "三浦": "ミウラ", "岡本": "オカモト", "松田": "マツダ", "中野": "ナカノ",
  "原田": "ハラダ", "小野": "オノ", "竹内": "タケウチ", "金子": "カネコ", "和田": "ワダ",
  "太郎": "タロウ", "一郎": "イチロウ", "健太": "ケンタ", "大輔": "ダイスケ", "翔太": "ショウタ",
  "拓也": "タクヤ", "直樹": "ナオキ", "和也": "カズヤ", "誠": "マコト", "亮": "リョウ",
  "花子": "ハナコ", "美咲": "ミサキ", "さくら": "サクラ", "陽子": "ヨウコ", "真由": "マユ",
  "裕子": "ユウコ", "明美": "アケミ", "香織": "カオリ", "恵": "メグミ", "綾": "アヤ",
  "隆": "タカシ", "浩二": "コウジ", "勇気": "ユウキ", "智也": "トモヤ", "康介": "コウスケ",
  "雄一": "ユウイチ", "慎吾": "シンゴ", "達也": "タツヤ", "秀樹": "ヒデキ", "正樹": "マサキ",
  "由美": "ユミ", "麻衣": "マイ", "彩香": "アヤカ", "優子": "ユウコ", "理恵": "リエ",
  "奈々": "ナナ", "愛": "アイ", "瞳": "ヒトミ", "舞": "マイ", "遥": "ハルカ",
  "修": "オサム", "剛": "ツヨシ", "豊": "ユタカ", "学": "マナブ", "博": "ヒロシ",
  "進": "ススム", "守": "マモル", "武": "タケシ", "清": "キヨシ", "昭": "アキラ"
};

// カテゴリ別スキルセット
const SKILL_SETS = {
  frontend: {
    skills: ["React", "Vue.js", "Angular", "Next.js", "TypeScript", "JavaScript", "Sass / SCSS", "Tailwind CSS", "Material UI", "Chakra UI"],
    tools: ["Git", "GitHub", "Figma", "Jest", "Cypress", "Webpack", "Vite"],
    positions: ["フロントエンドエンジニア", "UI / UXデザイナー"],
    keywords: ["React", "Vue.js", "TypeScript", "JavaScript", "フロントエンド", "UI", "コンポーネント", "SPA"]
  },
  backend: {
    skills: ["Python", "Java", "Go", "Node.js", "PHP", "Ruby", "Django", "Spring Boot", "FastAPI", "Laravel", "PostgreSQL", "MySQL"],
    tools: ["Docker", "Git", "GitHub", "Redis", "Nginx"],
    positions: ["バックエンドエンジニア", "システムエンジニア (SE)"],
    keywords: ["API", "バックエンド", "サーバー", "データベース", "Python", "Java", "Go"]
  },
  infrastructure: {
    skills: ["AWS", "Google Cloud (GCP)", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible", "Linux (RHEL, CentOS, Ubuntu)", "Nginx", "Jenkins"],
    tools: ["Git", "GitHub", "Prometheus", "Grafana"],
    positions: ["インフラエンジニア", "クラウドエンジニア", "SRE (サイト信頼性エンジニア)"],
    keywords: ["AWS", "GCP", "Azure", "インフラ", "クラウド", "Kubernetes", "Docker", "CI/CD"]
  },
  mobile: {
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Dart", "Firebase", "TypeScript", "Xcode", "Android Studio"],
    tools: ["Git", "GitHub", "Figma", "Firebase"],
    positions: ["モバイル/アプリエンジニア"],
    keywords: ["iOS", "Android", "モバイル", "アプリ", "React Native", "Flutter", "Swift", "Kotlin"]
  },
  data: {
    skills: ["Python", "BigQuery", "TensorFlow", "PyTorch", "Pandas", "Scikit-learn", "Apache Spark", "Snowflake", "Redshift", "R言語"],
    tools: ["Git", "GitHub", "Jupyter", "Airflow"],
    positions: ["データサイエンティスト", "データアナリスト", "AI / MLエンジニア", "データベースエンジニア"],
    keywords: ["データ", "機械学習", "AI", "ML", "Python", "BigQuery", "分析", "ETL"]
  }
};

// 勤務地エリア
const LOCATIONS = ["東京都渋谷区", "東京都港区", "東京都千代田区", "東京都新宿区", "東京都品川区", "大阪府大阪市", "神奈川県横浜市", "愛知県名古屋市", "福岡県福岡市", "京都府京都市"];

// 最寄り駅
const STATIONS = ["渋谷駅", "六本木駅", "大手町駅", "新宿駅", "品川駅", "梅田駅", "横浜駅", "名古屋駅", "博多駅", "京都駅"];

// ランダム選択ヘルパー
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomPicks = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// 開発環境用の作成日時を生成する関数
// 過去N日前の日時を生成（1週間以内の場合はnewタグがつく）
const generateDevCreatedAt = (daysAgo: number): string => {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // kintoneのDATETIME形式: YYYY-MM-DDTHH:mm:ssZ
  return targetDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// 人材データ生成
const generateTalents = () => {
  const talents: any[] = [];
  const categories = ["frontend", "backend", "infrastructure", "mobile", "data"] as const;
  
  let index = 1;
  
  for (const category of categories) {
    const skillSet = SKILL_SETS[category];
    
    for (let i = 0; i < 10; i++) {
      const lastName = LAST_NAMES[(index - 1) % LAST_NAMES.length];
      const firstName = FIRST_NAMES[(index - 1) % FIRST_NAMES.length];
      const fullName = `${lastName} ${firstName}`;
      const email = `seed_talent_${String(index).padStart(3, "0")}@example.com`;
      
      // スキルセットをランダムに選択（メインスキル多め）
      const mainSkills = randomPicks(skillSet.skills, 5 + Math.floor(Math.random() * 3));
      const subSkills = randomPicks(skillSet.tools, 2 + Math.floor(Math.random() * 2));
      const allSkills = [...mainSkills, ...subSkills];
      
      // 他カテゴリのスキルを少し混ぜる（バラツキ用）
      const otherCategories = categories.filter(c => c !== category);
      const otherCategory = randomPick(otherCategories);
      const otherSkills = randomPicks(SKILL_SETS[otherCategory].skills, Math.floor(Math.random() * 2));
      allSkills.push(...otherSkills);
      
      const experience = generateExperience(category, fullName, mainSkills);
      const desiredWork = generateDesiredWork(category, mainSkills);
      
      talents.push({
        auth_user_id: `seed_user_${String(index).padStart(3, "0")}`,
        姓: lastName,
        名: firstName,
        氏名: fullName,
        セイ: KATAKANA_MAP[lastName] || "カナ",
        メイ: KATAKANA_MAP[firstName] || "カナ",
        メールアドレス: email,
        電話番号: `090-${String(1000 + index).slice(-4)}-${String(1000 + index * 2).slice(-4)}`,
        生年月日: `${1985 + Math.floor(Math.random() * 10)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`,
        郵便番号: `${100 + Math.floor(Math.random() * 100)}-${String(1000 + Math.floor(Math.random() * 9000)).slice(0, 4)}`,
        住所: `${randomPick(LOCATIONS)}${1 + Math.floor(Math.random() * 10)}-${1 + Math.floor(Math.random() * 10)}-${1 + Math.floor(Math.random() * 10)}`,
        言語_ツール: allSkills.join(", "),
        主な実績_PR_職務経歴: experience,
        ポートフォリオリンク: "",
        稼働可能時期: `2025-12-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`,
        希望単価_月額: 60 + Math.floor(Math.random() * 30),
        希望勤務日数: randomPick(["週4", "週5"]),
        希望出社頻度: randomPick(["週1", "週2", "週3", "なし"]),
        希望勤務スタイル: randomPicks(["リモート", "ハイブリッド", "常駐"], 1 + Math.floor(Math.random() * 2)),
        希望案件_作業内容: desiredWork,
        NG企業: "特になし",
        その他要望: randomPick(["リモート中心希望", "フレックス希望", "長期案件希望", "スキルアップできる環境希望"]),
      });
      
      index++;
    }
  }
  
  return talents;
};

// 経歴生成
const generateExperience = (category: string, name: string, skills: string[]): string => {
  const categoryTitles: Record<string, string> = {
    frontend: "フロントエンドエンジニア",
    backend: "バックエンドエンジニア",
    infrastructure: "インフラエンジニア",
    mobile: "モバイルエンジニア",
    data: "データエンジニア"
  };
  
  const years = 3 + Math.floor(Math.random() * 8);
  const skillList = skills.slice(0, 5).join(", ");
  
  return `【経歴概要】
${categoryTitles[category]}として${years}年の実務経験があります。
${skillList}を中心とした開発が得意です。

【主なプロジェクト】
・大手企業向けシステム開発プロジェクト（${skills[0]} + ${skills[1] || skills[0]}）
・新規サービスの立ち上げプロジェクト
・既存システムのリプレイス・モダナイゼーション

【アピールポイント】
・${skills[0]}を使った開発経験豊富
・チーム開発・レビュー経験あり
・要件定義から運用まで一貫して対応可能`;
};

// 希望案件生成
const generateDesiredWork = (category: string, skills: string[]): string => {
  const skillList = skills.slice(0, 3);
  return `・${skillList[0]}を使った開発案件
・${skillList[1] || skillList[0]}での開発
・新規サービスの立ち上げ
・技術選定やアーキテクチャ設計`;
};

// 案件データ生成
const generateJobs = () => {
  const jobs: any[] = [];
  const categories = ["frontend", "backend", "infrastructure", "mobile", "data"] as const;
  
  const categoryJobTemplates: Record<string, { titles: string[], descriptions: string[] }> = {
    frontend: {
      titles: [
        "大手ECサイトのフロントエンド刷新",
        "SaaS管理画面のUI/UX改善",
        "コンポーネントライブラリ構築",
        "Webアプリケーション新規開発",
        "レガシーシステムのReact移行",
        "デザインシステム構築",
        "ダッシュボード開発",
        "ポータルサイトリニューアル",
        "フロントエンド基盤整備",
        "Webパフォーマンス改善"
      ],
      descriptions: ["モダンなフロントエンド開発", "UI/UXの改善", "コンポーネント設計"]
    },
    backend: {
      titles: [
        "金融系API開発",
        "ECサイトバックエンド構築",
        "マイクロサービス化プロジェクト",
        "決済システム開発",
        "認証基盤構築",
        "バッチ処理システム開発",
        "REST API設計・開発",
        "GraphQL API構築",
        "レガシーシステムリプレイス",
        "パフォーマンスチューニング"
      ],
      descriptions: ["バックエンドAPI開発", "データベース設計", "システム設計"]
    },
    infrastructure: {
      titles: [
        "AWS基盤構築",
        "GCPインフラ設計",
        "Kubernetes導入",
        "CI/CDパイプライン構築",
        "インフラ自動化",
        "クラウド移行プロジェクト",
        "監視基盤構築",
        "セキュリティ強化",
        "SRE業務",
        "コスト最適化"
      ],
      descriptions: ["クラウドインフラ構築", "自動化・効率化", "運用改善"]
    },
    mobile: {
      titles: [
        "フィンテックアプリ開発",
        "ヘルスケアアプリ開発",
        "ECアプリ新規開発",
        "SNSアプリ開発",
        "業務アプリ開発",
        "クロスプラットフォーム移行",
        "ネイティブアプリリニューアル",
        "プッシュ通知基盤構築",
        "アプリパフォーマンス改善",
        "UI/UXリニューアル"
      ],
      descriptions: ["モバイルアプリ開発", "iOS/Android対応", "クロスプラットフォーム開発"]
    },
    data: {
      titles: [
        "データ基盤構築",
        "ML基盤開発",
        "レコメンドエンジン開発",
        "分析ダッシュボード構築",
        "ETLパイプライン構築",
        "リアルタイム分析基盤",
        "データウェアハウス設計",
        "AI機能開発",
        "予測モデル開発",
        "データ品質管理基盤"
      ],
      descriptions: ["データ基盤構築", "機械学習モデル開発", "分析基盤構築"]
    }
  };
  
  let index = 1;
  
  for (const category of categories) {
    const skillSet = SKILL_SETS[category];
    const templates = categoryJobTemplates[category];
    
    for (let i = 0; i < 10; i++) {
      const title = templates.titles[i];
      const locationIndex = (index - 1) % LOCATIONS.length;
      
      // メインスキルを選択
      const mainSkills = randomPicks(skillSet.skills, 3 + Math.floor(Math.random() * 2));
      
      // 案件特徴をランダムに選択
      const features = randomPicks([
        "長期案件", "リモート併用可", "上流工程参画", "最新技術導入",
        "大手直案件", "高単価案件", "フルリモート可", "アジャイル開発"
      ], 3 + Math.floor(Math.random() * 3));
      
      jobs.push({
        案件名: title,
        ルックアップ: `株式会社サンプル${index}`,
        職種_ポジション: skillSet.positions.slice(0, 1 + Math.floor(Math.random() * (skillSet.positions.length - 1))),
        スキル: mainSkills,
        概要: generateJobDescription(category, title, mainSkills),
        環境: generateJobEnvironment(mainSkills),
        必須スキル: generateRequiredSkills(mainSkills),
        尚可スキル: generatePreferredSkills(skillSet),
        勤務地エリア: LOCATIONS[locationIndex],
        最寄駅: STATIONS[locationIndex],
        下限h: 140 + Math.floor(Math.random() * 20),
        上限h: 180,
        掲載単価: 65 + Math.floor(Math.random() * 25),
        MAX単価: 80 + Math.floor(Math.random() * 20),
        案件期間: randomPick(["3ヶ月〜", "6ヶ月〜", "12ヶ月〜", "長期"]),
        参画時期: `2025-12-${String(1 + Math.floor(Math.random() * 28)).padStart(2, "0")}`,
        面談回数: randomPick(["1回", "2回", "3回"]),
        案件特徴: features,
        ラジオボタン: "募集中",
        ラジオボタン_0: "有",
        商流: randomPick(["直", "元請け"]),
        契約形態: "準委任",
        リモート: randomPick(["可", "条件付き可"]),
        外国籍: randomPick(["可", "不可"]),
        募集人数: 1 + Math.floor(Math.random() * 3),
        // 最初の10件は1週間以内（newタグがつく）、残りは8-58日前
        作成日時_開発環境: generateDevCreatedAt(index <= 10 ? Math.floor(Math.random() * 6) + 1 : 8 + Math.floor(Math.random() * 50)),
      });
      
      index++;
    }
  }
  
  return jobs;
};

// 案件概要生成
const generateJobDescription = (category: string, title: string, skills: string[]): string => {
  return `${title}プロジェクトです。
${skills.slice(0, 2).join(", ")}を使った開発を行います。

・チーム開発の経験がある方を募集
・モダンな技術スタックで開発
・裁量を持って開発を進められる環境`;
};

// 開発環境生成
const generateJobEnvironment = (skills: string[]): string => {
  return `【開発環境】
・主要技術: ${skills.slice(0, 3).join(", ")}
・バージョン管理: Git/GitHub
・コミュニケーション: Slack, Teams
・タスク管理: Jira, Backlog`;
};

// 必須スキル生成
const generateRequiredSkills = (skills: string[]): string => {
  return `・${skills[0]}の実務経験 2年以上
・${skills[1] || skills[0]}の経験
・Gitを使ったチーム開発経験
・コードレビュー経験`;
};

// 尚可スキル生成
const generatePreferredSkills = (skillSet: typeof SKILL_SETS.frontend): string => {
  const additionalSkills = randomPicks(skillSet.skills, 2);
  return `・${additionalSkills[0]}の経験
・${additionalSkills[1]}の経験
・アジャイル開発の経験
・大規模システムの開発経験`;
};

// Better Authユーザー生成
// seed_user_001 は yamada 用に予約されているため、002 から開始
const generateAuthUsers = (talents: any[]) => {
  return talents.map((talent, index) => ({
    id: `seed_user_${String(index + 2).padStart(3, "0")}`,
    name: talent.氏名,
    email: talent.メールアドレス,
    password: "password123",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

// シードデータ生成
export const seedData3 = (() => {
  const talents = generateTalents();
  const authUsers = generateAuthUsers(talents);
  const jobs = generateJobs();
  
  // 応募履歴（各カテゴリの最初の人材が最初の案件に応募）
  // IDは002から開始（001はyamada用）
  const applications = [
    { auth_user_id: "seed_user_002", jobIndex: 0, 対応状況: "応募済み" },
    { auth_user_id: "seed_user_012", jobIndex: 10, 対応状況: "面談調整中" },
    { auth_user_id: "seed_user_022", jobIndex: 20, 対応状況: "案件参画" },
    { auth_user_id: "seed_user_032", jobIndex: 30, 対応状況: "応募済み" },
    { auth_user_id: "seed_user_042", jobIndex: 40, 対応状況: "面談調整中" },
  ];
  
  // 推薦データは recommend:create で自動生成するので空
  const recommendations: { talentIndex: number; jobIndex: number; score: number }[] = [];
  
  return {
    authUsers,
    talents,
    jobs,
    applications,
    recommendations,
  };
})();

// データ統計を表示
export const showSeedData3Stats = () => {
  console.log("\n📊 シードデータ3の統計:");
  console.log(`  👤 Better Authユーザー: ${seedData3.authUsers.length}件`);
  console.log(`  👨‍💼 人材: ${seedData3.talents.length}件`);
  console.log(`  💼 案件: ${seedData3.jobs.length}件`);
  console.log(`  📝 応募履歴: ${seedData3.applications.length}件`);
  console.log("\n📂 カテゴリ内訳:");
  console.log("  フロントエンド: 10人 × 10案件");
  console.log("  バックエンド: 10人 × 10案件");
  console.log("  インフラ/クラウド: 10人 × 10案件");
  console.log("  モバイル: 10人 × 10案件");
  console.log("  データ/AI: 10人 × 10案件");
};

