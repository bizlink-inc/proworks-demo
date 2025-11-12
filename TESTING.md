# テスト戦略とドキュメント

## 📋 概要

このプロジェクトではユニットテストを実装しています。開発環境で自動化されたテストを実行することで、手動での画面操作による確認を減らし、効率的に品質を保証できます。

---

## 🧪 テストの種類と現状

### 実装済み: ユニットテスト

- **対象**: kintoneサービス層、ユーティリティ関数
- **ツール**: Jest
- **カバレッジ**: 79.68%（lib以下のコード）

#### テスト対象モジュール

| モジュール | 対象 | テスト件数 | カバレッジ |
|-----------|------|----------|----------|
| `lib/kintone/services/talent.ts` | 人材情報CRUD | 10テスト | 63.54% |
| `lib/kintone/services/job.ts` | 案件情報取得 | 6テスト | 69.69% |
| `lib/kintone/services/application.ts` | 応募履歴管理 | 8テスト | 100% |
| `lib/kintone/services/file.ts` | ファイル操作 | 18テスト | 93.33% |
| `lib/utils.ts` | ユーティリティ | 5テスト | 100% |
| **合計** | | **47テスト** | **79.68%** |

---

## 🚀 テスト実行方法

### すべてのテストを実行

```bash
npm test
```

### ウォッチモード（ファイル変更時に自動実行）

```bash
npm run test:watch
```

### カバレッジレポート生成

```bash
npm run test:coverage
```

### 特定のテストファイルだけを実行

```bash
# タレントサービステスト
npm test -- --testPathPattern=talent

# ファイルサービステスト
npm test -- --testPathPattern=file

# アプリケーションサービステスト
npm test -- --testPathPattern=application
```

### 特定のテストケースだけを実行

```bash
# "PDFファイル"という名前のテストだけ実行
npm test -- --testNamePattern="PDFファイル"
```

---

## 📂 テストファイル構成

```
proworks-app/
├── __tests__/
│   └── unit/
│       ├── lib/
│       │   ├── kintone/
│       │   │   └── services/
│       │   │       ├── talent.test.ts       (人材情報テスト)
│       │   │       ├── job.test.ts          (案件情報テスト)
│       │   │       ├── application.test.ts  (応募履歴テスト)
│       │   │       └── file.test.ts         (ファイル操作テスト)
│       │   └── utils.test.ts                (ユーティリティテスト)
│       └── integration/
│           └── api/                         (今後実装予定)
├── jest.config.js
└── jest.setup.js
```

---

## ✅ テストケース一覧

### 1. 人材情報サービス (`getTalentByAuthUserId`, `createTalent`, `updateTalent`)

- ✅ auth_user_idで人材情報を正常に取得
- ✅ 存在しないユーザーはnull返却
- ✅ kintoneエラー時はエラースロー
- ✅ 職務経歴書データが空の場合は空配列返却
- ✅ 新しい人材情報を正常に作成
- ✅ 空フィールドの場合、メールアドレスから氏名を生成
- ✅ 人材情報を正常に更新
- ✅ 部分的なフィールド更新が可能
- ✅ 更新時のkintoneエラー処理

### 2. 案件情報サービス (`getAllJobs`, `getJobById`)

- ✅ すべての案件を正常に取得
- ✅ 案件が0件の場合は空配列返却
- ✅ IDで案件詳細を正常に取得
- ✅ 存在しない案件IDはnullを返す
- ✅ 取得エラー時の例外処理

### 3. 応募履歴サービス (`createApplication`, `checkDuplicateApplication`, `getApplicationsByAuthUserId`)

- ✅ 新しい応募を作成
- ✅ 重複チェック機能
- ✅ auth_user_idで応募履歴を取得
- ✅ エラー時の例外処理

### 4. ファイルサービス (`uploadFileToKintone`, `downloadFileFromKintone`, `formatFileSize`, etc)

- ✅ PDFファイルのアップロード
- ✅ Wordファイル（.docx）のアップロード
- ✅ 対応していないファイル形式の拒否
- ✅ 10MBを超えるファイルの拒否
- ✅ ファイルのダウンロード
- ✅ Bufferデータの正常な変換
- ✅ ファイル情報の取得
- ✅ エラーが発生したファイルの除外処理
- ✅ ファイルサイズのフォーマット

### 5. ユーティリティ (`cn` - Tailwind CSS class utility)

- ✅ 複数クラス名の結合
- ✅ 条件付きクラス追加
- ✅ Tailwind CSSクラスのマージ
- ✅ 配列でのクラス指定
- ✅ オブジェクトでの条件付きクラス指定

---

## 📊 テストカバレッジレポート

最後に実行したカバレッジレポート：

```
lib/kintone/services:
  ├── application.ts: 100% (完全カバー)
  ├── file.ts:        93.33%
  ├── talent.ts:      63.54%
  └── job.ts:         69.69%

lib:
  └── utils.ts:       100% (完全カバー)
```

### カバレッジレポートの詳細を確認

```bash
npm run test:coverage
# HTMLレポートが `coverage/` ディレクトリに生成されます
```

---

## 🔄 テスト開発のワークフロー

### 1. 新機能を実装する場合

```bash
# テストを先に書く（TDD）
npm test -- --watch

# テストを見ながら実装を進める
# コード変更が自動でテストを再実行
```

### 2. 既存機能を修正する場合

```bash
# 該当するテストファイルを実行
npm test -- --testPathPattern=talent

# 修正後、すべてのテストが通ることを確認
npm test
```

### 3. リファクタリング時

```bash
# カバレッジを確認してから開始
npm run test:coverage

# リファクタリング後、テストが通ることを確認
npm test
```

---

## 🛠️ よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `npm test` | すべてのテストを実行 |
| `npm run test:watch` | ウォッチモードで実行 |
| `npm run test:coverage` | カバレッジレポート生成 |
| `npm test -- --testPathPattern=talent` | 特定ファイルのテスト実行 |
| `npm test -- --testNamePattern="作成"` | 特定テストケース実行 |
| `npm test -- --bail` | 最初のエラーで停止 |

---

## 📝 今後のテスト実装予定

### Phase 2: 統合テスト（Integration Tests）

APIエンドポイント全体のテスト：
- `app/api/auth/**` - 認証API
- `app/api/me/**` - ユーザー情報API
- `app/api/files/**` - ファイル操作API
- `app/api/applications/**` - 応募API

### Phase 3: E2Eテスト（End-to-End Tests）

実ブラウザでのユーザー操作シミュレーション：
- 新規登録からマイページ訪問までの全フロー
- ファイルアップロード→ダウンロード→削除
- 案件への応募まで

---

## 🐛 トラブルシューティング

### Q: テストが「Cannot find module」エラーで失敗する

```bash
# node_modules を再インストール
npm install --legacy-peer-deps

# キャッシュをクリア
npm test -- --clearCache
```

### Q: ウォッチモードが動作しない

```bash
# ファイルウォッチャーの上限を増やす（macOS）
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

# または npm test を再実行
npm run test:watch
```

### Q: テストが遅い

```bash
# 特定のテストファイルだけを実行
npm test -- --testPathPattern=talent

# または並列実行で高速化
npm test -- --maxWorkers=4
```

---

## 📚 関連ドキュメント

- [Jest公式ドキュメント](https://jestjs.io/)
- [Testing Library ドキュメント](https://testing-library.com/)
- [プロジェクトREADME](./README.md)

---

## ✨ ベストプラクティス

### 1. テストは独立させる

各テストは他のテストに依存しないようにしましょう。`beforeEach`でセットアップします。

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### 2. わかりやすいテスト名を使う

```typescript
// ❌ 悪い例
it('works', () => {})

// ✅ 良い例
it('auth_user_idで人材情報を正常に取得できる', () => {})
```

### 3. モックは必ずセットアップ

```typescript
beforeEach(() => {
  mockGetAppIds.mockReturnValue({
    talent: 1,
    job: 2,
    application: 3,
  } as any)
})
```

### 4. エラーケースも必ずテストする

```typescript
it('kintoneエラー時はエラーをスロー', async () => {
  mockClient.mockRejectedValue(new Error('API Error'))
  await expect(functionCall()).rejects.toThrow()
})
```

---

**このテスト環境により、変更に自信を持ってコードをリファクタリングできます！** 🎉

