/**
 * kintone案件DBフィールドの選択肢マッピング
 * npm run get-fields で取得した値をそのまま定義
 */
export const JOB_FIELD_OPTIONS = {
  職種_ポジション: [
    "フロントエンドエンジニア", "QAエンジニア / テスター", "システムエンジニア (SE)",
    "モバイル/アプリエンジニア", "ネットワークエンジニア", "データサイエンティスト",
    "PM (プロジェクトマネージャー)", "ゲームエンジニア", "組み込み・制御エンジニア",
    "AI / MLエンジニア", "UI / UXデザイナー", "Webディレクター", "業務系コンサルタント",
    "データアナリスト", "データベースエンジニア", "Webデザイナー", "VPoE / CTO / テックリード",
    "バックエンドエンジニア", "SRE (サイト信頼性エンジニア)", "サーバーエンジニア",
    "プリセールス", "PL (プロジェクトリーダー)", "ITコンサルタント",
    "PMO (プロジェクト管理支援)", "セキュリティエンジニア", "インフラエンジニア",
    "SAPコンサルタント", "クラウドエンジニア", "その他"
  ] as const,
  スキル: [
    "UiPath", "Windows Server", "Shell/Bash", "PostgreSQL", "人事/給与", "Check Point",
    "PyTorch", "Docker", "MySQL", "Adjust / AppsFlyer", "Flutter", "Smarty", "PowerShell",
    "Rust", "会計", "Playwright", "Apache", "JCL", "C言語", "Symfony", "Magento", "Cisco",
    "Struts", "Zend Framework", "ARM", "SD-WAN", "C#", "Hugging Face", "Shopify", "マイクロサービス",
    "Adobe Analytics", "Webflow", "スクラム", "Sinatra", "Terraform", "Solidity", "Tornado",
    "Backlog", "TensorFlow", "Java", "Firebase", "R言語", "Express", "COBOL", "LangChain",
    "Appium", "SQL Server", "医療", "Figma", "Bulma", "Jetson", "Svelte / SvelteKit", "Cypress",
    "VMware", "HubSpot", "Juniper", "Oracle Database", "ITRON", "WPF", "WordPress", "Snowflake",
    "ウォーターフォール", "Power Automate / Power Apps", "Entity Framework", "Visual Studio",
    "Google Cloud (GCP)", "FlutterFlow", "Redshift", "OpenAI API", "CodeIgniter",
    "JSF (JavaServer Faces) / JSP", "OutSystems", "F5 / BIG-IP", "MongoDB", "Arduino",
    "Material UI", "Raspberry Pi", "GitHub", "Laravel", "Sass / SCSS", "PL/I", "JUnit",
    "JavaScript", "Electron", "Bootstrap", "AWS", "Salesforce", "Jest", "C++", "アジャイル",
    "BLE (Bluetooth Low Energy)", "Scikit-learn", "WinActor", "EC-CUBE", "FastAPI", "React Native",
    "Photoshop", "MQTT", "Nginx", "Eclipse", "Go", "Google Tag Manager (GTM)", "PyTest", "VBA",
    "Movable Type", "IPSec / VPN", "OSPF / BGP", "AppSheet", "NestJS", "テスト駆動開発(TDD)",
    "BigQuery", "DynamoDB", "Perl", "Hyperledger Fabric", "Drupal", "IIS", "Ruby on Rails",
    "Swift", "Xamarin", "VB.NET", "Xcode", "Adalo", "IntelliJ IDEA", "Next.js", "After Effects",
    "GitHub Actions", "Ethereum", "PHP", "Objective-C", "Teams", "Android Studio", "Alpine.js",
    "GitLab", "Nuxt.js", "Tailwind CSS", "Kotlin", "Palo Alto", "FortiGate", "Django", "CI/CD",
    "ASP.NET", "LlamaIndex", "RTOS", "Canva", "BizRobo!", "RSpec", "Redmine", "Spring Boot",
    "Bubble", "Selenium", "NFT", "Python", "z/OS", "Azure", "Gatsby", "Google Analytics 4 (GA4)",
    "Node.js", "UNIX", "Jenkins", "Vue.js", "DevOps", "Git", "Unity", "Slack", "Illustrator",
    "Ansible", "Dart", "Chakra UI", "Adobe XD", "RPG", "Linux (RHEL, CentOS, Ubuntu)", "Angular",
    "金融", "TypeScript", "Zoom", "CakePHP", "Yamaha", "Ruby", "CircleCI", "Flask", "Scala",
    "AS/400 (IBM i)", "Redis", "React", "Jira", "kintone", "Prompt Engineering", "jQuery",
    "Seasar2", "物流", "Pandas", "Active Directory (AD)", "その他", "Kubernetes"
  ] as const,
  案件特徴: [
    "安定稼働", "週3日～OK", "グローバル案件", "即日参画OK", "自社サービス案件", "リーダー募集",
    "金融系プロジェクト", "若手活躍中", "大規模開発", "短期案件", "大手直案件", "アジャイル開発",
    "支払いサイト短め", "上流工程参画", "1人称対応可", "スタートアップ", "新規開発案件",
    "官公庁関連", "チーム開発", "フルスタック歓迎", "常駐案件", "ベテラン歓迎", "面談1回",
    "高単価案件", "商社グループ案件", "最新技術導入", "服装自由", "長期案件", "リモート併用可",
    "フルリモート可", "スキル見合い単価", "PMO・リーダー案件", "クラウド環境（AWS／Azure／GCP）",
    "副業OK"
  ] as const,
} as const;
