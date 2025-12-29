// モック定義のエクスポート
export * from "./kintone"
export * from "./ses"
export * from "./slack"

import { setupKintoneMocks } from "./kintone"
import { setupSESMocks, setupEmailMocks } from "./ses"
import { setupSlackMocks, setupFetchMock } from "./slack"

// すべてのモックをセットアップ
export const setupAllMocks = () => {
  setupKintoneMocks()
  setupSESMocks()
  setupEmailMocks()
  setupSlackMocks()
  const restoreFetch = setupFetchMock()

  return () => {
    restoreFetch()
  }
}
