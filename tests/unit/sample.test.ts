import { describe, it, expect } from "vitest"

describe("テスト環境の動作確認", () => {
  it("基本的なテストが動作すること", () => {
    expect(1 + 1).toBe(2)
  })

  it("文字列のテストが動作すること", () => {
    expect("Hello World").toContain("World")
  })

  it("オブジェクトのテストが動作すること", () => {
    const user = { name: "テスト太郎", email: "test@example.com" }
    expect(user).toEqual({ name: "テスト太郎", email: "test@example.com" })
  })

  it("非同期テストが動作すること", async () => {
    const result = await Promise.resolve("success")
    expect(result).toBe("success")
  })
})
