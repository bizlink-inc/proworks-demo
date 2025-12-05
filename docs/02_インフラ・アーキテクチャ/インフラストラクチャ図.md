# PROWORKS インフラ構成図（GCP）

## サイトマップ × インフラ構成

```mermaid
graph TD
    subgraph WP["🟢 WordPress（Compute Engine）"]
        FP["🟨 フロントページ"]
        FP --> MEDIA["メディアコンテンツ"]
        FP --> CORP["企業ページ"]
        FP --> FRONT_JOBS["フロント案件/ログイン"]
        MEDIA --> M1["キャリアとスキル"]
        MEDIA --> M2["ビジネス知識"]
        MEDIA --> M3["みんなの声"]
        MEDIA --> M4["PRO WORKSニュース"]
        MEDIA --> M5["ライフ"]
        MEDIA --> M6["AI・テクノロジー"]
        CORP --> CONTACT["問い合わせ・資料請求"]
    end

    subgraph NJ["🔴 Next.js（Cloud Run）"]
        FRONT_JOBS --> REG["新規登録"]
        FRONT_JOBS --> LOGINSC["ログイン画面"]
        REG --> MAIL["メール送信"]
        MAIL --> MP1["マイページ"]
        LOGINSC --> JOBS["案件一覧"]
        JOBS --> MP2["マイページ"]
        JOBS --> APPLIED["応募済み案件"]
        MP1 --> PROFILE["プロフィール"]
        MP1 --> CAREER["職歴・資格"]
        MP1 --> PREF["希望条件"]
    end

    NJ --> PG["🟡 Cloud SQL PostgreSQL"]
    NJ --> Kintone["🔵 kintone"]

    style FP fill:#E5A12B,color:#fff
```

---

## インフラ構成（シンプル版）

```mermaid
graph TD
    User["👥 ユーザー"]
    User --> LB["⚙️ Load Balancer"]
    LB --> WP["🟢 Compute Engine<br/>WordPress"]
    LB --> NJ["🔴 Cloud Run<br/>Next.js"]
    NJ --> PG["🟡 Cloud SQL PostgreSQL"]
    NJ --> Kintone["🔵 kintone"]

    style WP fill:#34A853,color:#fff
    style NJ fill:#EA4335,color:#fff
```

---

## 担当範囲

| 領域          | サービス                           | 内容                                                        |
| ------------- | ---------------------------------- | ----------------------------------------------------------- |
| **WordPress** | Compute Engine (MySQL 内蔵)        | フロント LP・フロント案件・メディア・企業ページ・問い合わせ |
| **Next.js**   | Cloud Run + Cloud SQL (PostgreSQL) | 新規登録・ログイン・案件一覧・マイページ・応募              |
| **kintone**   | SaaS                               | 案件マスタ・人材マスタ・応募履歴                            |
