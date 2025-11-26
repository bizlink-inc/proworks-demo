# Kintone フィールド管理

このディレクトリでは、Kintone アプリのフィールド定義を管理し、開発環境・本番環境間での同期を行います。

## ディレクトリ構成

```
scripts/kintone-fields/
├── README.md                    # このファイル
├── config.json                  # 環境設定（appID, token）
├── schemas/                     # フィールド定義JSON
│   ├── recommendation.json      # 推薦DB
│   ├── talent.json              # 人材DB（将来用）
│   ├── job.json                 # 案件DB（将来用）
│   └── application.json         # 応募履歴DB（将来用）
└── manage-fields.sh             # フィールド管理スクリプト
```

## 使用方法

### 1. 現在のフィールドを取得

```bash
npm run kintone:fields:get -- recommendation
```

または直接実行：

```bash
./scripts/kintone-fields/manage-fields.sh get recommendation
```

### 2. フィールドを追加

```bash
npm run kintone:fields:add -- recommendation
```

または直接実行：

```bash
./scripts/kintone-fields/manage-fields.sh add recommendation
```

### 3. 変更をデプロイ

```bash
npm run kintone:fields:deploy -- recommendation
```

または直接実行：

```bash
./scripts/kintone-fields/manage-fields.sh deploy recommendation
```

## 環境設定

`config.json` で環境ごとの設定を管理します：

```json
{
  "development": {
    "baseUrl": "https://xxx.cybozu.com",
    "apps": {
      "recommendation": { "appId": 97, "token": "xxx" },
      "talent": { "appId": 81, "token": "xxx" },
      "job": { "appId": 85, "token": "xxx" },
      "application": { "appId": 84, "token": "xxx" }
    }
  },
  "production": {
    "baseUrl": "https://xxx.cybozu.com",
    "apps": {
      "recommendation": { "appId": null, "token": null }
    }
  }
}
```

## フィールド定義の更新手順

### 新しいフィールドを追加する場合

1. `schemas/{app}.json` の `fieldsToAdd` に新しいフィールドを追加
2. `npm run kintone:fields:add -- {app}` を実行
3. `npm run kintone:fields:deploy -- {app}` を実行
4. `npm run kintone:fields:get -- {app}` で最新状態を取得・保存

### 本番環境に反映する場合

1. `config.json` の `production` セクションを設定
2. 環境変数 `KINTONE_ENV=production` を設定
3. 上記コマンドを実行

## 注意事項

- フィールドの削除はAPIではサポートされていません（Kintone管理画面で手動削除）
- フィールドコードの変更は新規追加→データ移行→旧フィールド削除の手順が必要
- デプロイ前に必ずバックアップを取ること

