import { beforeAll, afterAll, afterEach, vi } from "vitest"

// 環境変数を設定
process.env.NODE_ENV = "test"
// MOCK_EXTERNAL_SERVICES はコマンドラインから設定されていない場合のみデフォルト値を設定
// 統合テストでは MOCK_EXTERNAL_SERVICES=false で実行するため、上書きしない
if (process.env.MOCK_EXTERNAL_SERVICES === undefined) {
  process.env.MOCK_EXTERNAL_SERVICES = "true"
}

// グローバルなモック設定
beforeAll(() => {
  // console.log を抑制（必要に応じてコメントアウト）
  // vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  // 各テスト後にモックをリセット
  vi.clearAllMocks()
})

afterAll(() => {
  // すべてのテスト後にモックを復元
  vi.restoreAllMocks()
})
