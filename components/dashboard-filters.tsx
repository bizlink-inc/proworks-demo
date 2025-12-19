"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, X, Search } from "lucide-react"

// 職種マッピング定義
// UI表示名 → 実際の職種_ポジションフィールド値
export const POSITION_MAPPING: Record<string, string[]> = {
  "インフラ": ["インフラエンジニア"],
  "PM・PMO": ["PM (プロジェクトマネージャー)", "PMO (プロジェクト管理支援)"],
  "コンサル": ["SAPコンサルタント", "業務系コンサルタント", "ITコンサルタント"],
  "デザイン": ["Webデザイナー", "UI / UXデザイナー"],
}

// リモート可否の選択肢（案件特徴フィールドの値）
export const REMOTE_OPTIONS = [
  { value: "フルリモート可", label: "フルリモート可" },
  { value: "リモート併用可", label: "リモート併用可" },
  { value: "常駐案件", label: "常駐案件" },
]

// 職種/ポジションの選択肢
export const POSITION_OPTIONS = [
  { value: "インフラ", label: "インフラ" },
  { value: "PM・PMO", label: "PM・PMO" },
  { value: "コンサル", label: "コンサル" },
  { value: "デザイン", label: "デザイン" },
]

// フィルターの型定義
export type JobFilters = {
  query: string
  sort: string
  remote: string[] // フルリモート可, リモート併用可, 常駐案件
  positions: string[] // 開発, インフラ, PM・PMO, コンサル, デザイン, その他
  location: string // 勤務地エリア
  nearestStation: string // 最寄り駅
}

type DashboardFiltersProps = {
  onSearch: (filters: JobFilters) => void
  currentSort?: string
}

export const DashboardFilters = ({ onSearch, currentSort = "recommend" }: DashboardFiltersProps) => {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState(currentSort)
  const [remoteOptions, setRemoteOptions] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [location, setLocation] = useState("")
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

  // 職種の切り替え
  const handlePositionChange = (value: string, checked: boolean) => {
    if (checked) {
      setPositions([...positions, value])
    } else {
      setPositions(positions.filter(v => v !== value))
    }
  }

  // 検索実行
  const handleSearch = () => {
    onSearch({ 
      query, 
      sort,
      remote: remoteOptions,
      positions,
      location,
      nearestStation,
    })
  }

  // 条件をクリア
  const handleClear = () => {
    setQuery("")
    setRemoteOptions([])
    setPositions([])
    setLocation("")
    setNearestStation("")
    onSearch({ 
      query: "", 
      sort,
      remote: [],
      positions: [],
      location: "",
      nearestStation: "",
    })
  }

  // フリーワードをクリア
  const handleClearQuery = () => {
    setQuery("")
  }

  // 共通の入力スタイル
  const inputStyle = "h-9 w-full py-2 text-sm transition-colors px-3 placeholder:text-[var(--pw-text-light-gray)] focus-visible:outline-none rounded-[var(--pw-radius-sm)] border border-[var(--pw-input-border)] bg-white focus:border-[var(--pw-input-focus)]"

  // Hydration errorを避けるため、クライアントサイドでマウントされるまで簡易版を表示
  if (!isMounted) {
    return (
      <div className="py-6">
        <div className="flex gap-4">
          <div className="flex-1 h-9 border rounded-md bg-white" />
          <div className="h-9 w-32 border rounded-md bg-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      {/* メインフィルター */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左セクション: フリーワード + リモート可否 */}
        <div className="flex-1 space-y-3">
          {/* フリーワード検索 */}
          <div className="relative">
            <input
              type="text"
          placeholder="フリーワードで探す"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`${inputStyle} pr-10`}
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
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className="font-bold whitespace-nowrap"
              style={{ 
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)"
              }}
            >
              リモート可否
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              {REMOTE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                    id={`remote-${option.value}`}
                    checked={remoteOptions.includes(option.value)}
                    onChange={(e) => handleRemoteChange(option.value, e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                />
                <Label
                    htmlFor={`remote-${option.value}`}
                    className="cursor-pointer font-medium"
                  style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
                >
                    {option.label}
                </Label>
              </div>
              ))}
            </div>
          </div>
        </div>

        {/* 縦線（区切り） */}
        <div 
          className="hidden lg:block w-px self-stretch"
          style={{ backgroundColor: "#9ab6ca" }}
        />

        {/* 中央セクション: 勤務地エリア + 最寄り駅 */}
        <div className="space-y-3">
          {/* 勤務地エリア */}
          <div className="flex items-center gap-3">
            <span
              className="font-bold whitespace-nowrap"
              style={{ 
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)"
              }}
            >
              勤務地エリア
            </span>
            <input
              type="text"
              placeholder="フリーワード"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`${inputStyle} w-40`}
            />
          </div>

          {/* 最寄り駅 */}
          <div className="flex items-center gap-3">
            <span
              className="font-bold whitespace-nowrap"
              style={{ 
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)",
                marginLeft: "1.75rem" // 「勤務地エリア」との位置調整
              }}
            >
              最寄り駅
            </span>
            <input
              type="text"
              placeholder="フリーワード"
              value={nearestStation}
              onChange={(e) => setNearestStation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={`${inputStyle} w-40`}
            />
          </div>
        </div>

        {/* 縦線（区切り） */}
        <div 
          className="hidden lg:block w-px self-stretch"
          style={{ backgroundColor: "#9ab6ca" }}
        />

        {/* 右セクション: 職種/ポジション */}
        <div className="space-y-2">
          <span
            className="font-bold block"
            style={{ 
              fontSize: "var(--pw-text-sm)",
              color: "var(--pw-text-primary)"
            }}
          >
            職種/ポジション
          </span>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {POSITION_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id={`position-${option.value}`}
                  checked={positions.includes(option.value)}
                  onChange={(e) => handlePositionChange(option.value, e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                />
                <Label
                  htmlFor={`position-${option.value}`}
                  className="cursor-pointer font-medium whitespace-nowrap"
                  style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 詳細条件トグル + ボタン */}
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-[var(--pw-button-primary)] hover:underline"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          もっと詳細な条件を追加する
        </button>

        {/* ボタン */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleClear}
            style={{ 
              fontSize: "var(--pw-text-md)",
              backgroundColor: "#8b8b8b",
              color: "white",
              borderRadius: "var(--pw-radius-sm)",
              minWidth: "120px"
            }}
            className="hover:opacity-90 transition-opacity"
          >
            条件をクリア
          </Button>
          <Button 
            type="button"
            variant="pw-dark"
            onClick={handleSearch}
            style={{ 
              fontSize: "var(--pw-text-md)", 
              whiteSpace: "nowrap",
              minWidth: "180px"
            }}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            この条件で案件検索
          </Button>
        </div>
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
    </div>
  )
}
