"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DashboardFiltersProps = {
  onSearch: (filters: { query: string; sort: string }) => void
  currentSort?: string
}

export function DashboardFilters({ onSearch, currentSort = "new" }: DashboardFiltersProps) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState(currentSort)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setSort(currentSort)
  }, [currentSort])

  const handleSearch = () => {
    onSearch({ query, sort })
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    // ソート変更時に即座に検索を実行
    onSearch({ query, sort: newSort })
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
          <Input
            placeholder="フリーワードで探す"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <div className="h-10 w-32 border rounded-md" />
          <Button 
            onClick={handleSearch}
            variant="pw-dark"
            style={{ fontSize: "var(--pw-text-md)" }}
          >
            この条件で案件検索
          </Button>
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
      <div className="flex gap-4 items-center">
        <Input
          placeholder="フリーワードで探す"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">新着順</SelectItem>
            <SelectItem value="recommended">おすすめ順</SelectItem>
            <SelectItem value="price">単価順</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleSearch} 
          variant="pw-dark"
          style={{ fontSize: "var(--pw-text-md)", whiteSpace: "nowrap" }}
        >
          この条件で案件検索
        </Button>
      </div>
    </div>
  )
}
