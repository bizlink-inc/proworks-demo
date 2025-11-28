"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PWInput } from "@/components/ui/pw-input"
import { ChevronDown, ChevronUp, X, Search } from "lucide-react"

// フィルターの型定義
export type JobFilters = {
  query: string
  sort: string
  remote: string[] // 可, 不可, 条件付き可
  nearestStation: string
}

type DashboardFiltersProps = {
  onSearch: (filters: JobFilters) => void
  currentSort?: string
}

export const DashboardFilters = ({ onSearch, currentSort = "new" }: DashboardFiltersProps) => {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState(currentSort)
  const [remoteOptions, setRemoteOptions] = useState<string[]>([])
  const [nearestStation, setNearestStation] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setSort(currentSort)
  }, [currentSort])

  // リモートオプションの切り替え
  const handleRemoteChange = (value: string, checked: boolean) => {
    if (checked) {
      setRemoteOptions([...remoteOptions, value])
    } else {
      setRemoteOptions(remoteOptions.filter(v => v !== value))
    }
  }

  // 検索実行
  const handleSearch = () => {
    onSearch({ 
      query, 
      sort,
      remote: remoteOptions,
      nearestStation,
    })
  }

  // 条件をクリア
  const handleClear = () => {
    setQuery("")
    setRemoteOptions([])
    setNearestStation("")
    onSearch({ 
      query: "", 
      sort,
      remote: [],
      nearestStation: "",
    })
  }

  // フリーワードをクリア
  const handleClearQuery = () => {
    setQuery("")
  }

  // Hydration errorを避けるため、クライアントサイドでマウントされるまで簡易版を表示
  if (!isMounted) {
    return (
      <div 
        className="p-6 rounded-lg mb-6"
        style={{ 
          backgroundColor: "#d5e5f0",
          border: "1px solid #9ab6ca"
        }}
      >
        <div className="flex gap-4">
          <div className="flex-1 h-10 border rounded-md bg-white" />
          <div className="h-10 w-32 border rounded-md bg-white" />
        </div>
      </div>
    )
  }

  return (
    <div 
      className="p-6 rounded-lg mb-6"
      style={{ 
        backgroundColor: "#d5e5f0",
        border: "1px solid #9ab6ca"
      }}
    >
      {/* 1行目: フリーワード検索 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* 左側: フリーワード + リモート可否 */}
        <div className="space-y-4">
          {/* フリーワード検索 */}
          <div className="relative">
            <input
              type="text"
          placeholder="フリーワードで探す"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex h-10 w-full py-2 text-sm transition-colors px-3 pr-10 placeholder:text-[var(--pw-text-light-gray)] focus-visible:outline-none rounded-[var(--pw-radius-sm)] border border-[var(--pw-input-border)] bg-white focus:bg-[var(--pw-input-error-bg)] focus:border-[var(--pw-input-focus)]"
        />
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--pw-button-dark)] flex items-center justify-center hover:opacity-80 transition-opacity"
              aria-label="フリーワードをクリア"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* リモート可否 */}
          <div className="flex items-center gap-4">
            <span
              className="font-bold whitespace-nowrap"
              style={{ 
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)"
              }}
            >
              リモート可否
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="remote-yes"
                  checked={remoteOptions.includes("可")}
                  onChange={(e) => handleRemoteChange("可", e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                />
                <Label
                  htmlFor="remote-yes"
                  className="cursor-pointer font-bold"
                  style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
                >
                  可
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="remote-no"
                  checked={remoteOptions.includes("不可")}
                  onChange={(e) => handleRemoteChange("不可", e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                />
                <Label
                  htmlFor="remote-no"
                  className="cursor-pointer font-bold"
                  style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
                >
                  不可
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="remote-conditional"
                  checked={remoteOptions.includes("条件付き可")}
                  onChange={(e) => handleRemoteChange("条件付き可", e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                />
                <Label
                  htmlFor="remote-conditional"
                  className="cursor-pointer font-bold"
                  style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
                >
                  条件付き可
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* 中央: 最寄り駅 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className="font-medium whitespace-nowrap"
              style={{ 
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)"
              }}
            >
              最寄り駅
            </span>
            <PWInput
              placeholder="フリーワード"
              value={nearestStation}
              onChange={(e) => setNearestStation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-48"
            />
          </div>
        </div>

        {/* 右側: 空欄（職種/ポジションは除外のため） */}
        <div />
      </div>

      {/* 詳細条件トグル */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-[var(--pw-button-primary)] hover:underline"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          もっと詳細な条件を追加する
        </button>
      </div>

      {/* 詳細条件（展開時） */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-[var(--pw-border-light)]">
          <p
            className="text-center"
            style={{ 
              fontSize: "var(--pw-text-sm)",
              color: "var(--pw-text-gray)"
            }}
          >
            詳細条件は今後追加予定です
          </p>
        </div>
      )}

      {/* ボタン */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          onClick={handleClear}
          style={{ 
            fontSize: "var(--pw-text-md)",
            backgroundColor: "#8b8b8b",
            color: "white",
            borderRadius: "var(--pw-radius-sm)"
          }}
          className="hover:opacity-90 transition-opacity"
        >
          条件をクリア
        </Button>
        <Button 
          type="button"
          variant="pw-dark"
          onClick={handleSearch}
          style={{ fontSize: "var(--pw-text-md)", whiteSpace: "nowrap" }}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          この条件で案件検索
        </Button>
      </div>
    </div>
  )
}
