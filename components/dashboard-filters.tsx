"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DashboardFiltersProps = {
  onSearch: (filters: { query: string; sort: string }) => void
}

export function DashboardFilters({ onSearch }: DashboardFiltersProps) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("new")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="キーワード検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-1"
          />
          <div className="h-10 border rounded-md" /> {/* プレースホルダー */}
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
            案件検索
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
        borderBottom: "1px solid #9ab6ca"
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="キーワード検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="md:col-span-1"
        />

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">新着順</SelectItem>
            <SelectItem value="price">単価順</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={handleSearch} 
          variant="pw-primary"
          style={{ fontSize: "var(--pw-text-md)" }}
        >
          案件検索
        </Button>
      </div>
    </div>
  )
}
