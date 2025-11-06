"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DashboardFiltersProps = {
  onSearch: (filters: { query: string; loc: string; sort: string }) => void
}

export function DashboardFilters({ onSearch }: DashboardFiltersProps) {
  const [query, setQuery] = useState("")
  const [loc, setLoc] = useState("All")
  const [sort, setSort] = useState("new")

  const handleSearch = () => {
    onSearch({ query, loc, sort })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="キーワード検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <Select value={loc} onValueChange={setLoc}>
          <SelectTrigger>
            <SelectValue placeholder="勤務地" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">すべて</SelectItem>
            <SelectItem value="Remote">リモート</SelectItem>
            <SelectItem value="Tokyo">東京</SelectItem>
            <SelectItem value="Osaka">大阪</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">新着順</SelectItem>
            <SelectItem value="price">単価が高い順</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
          案件検索
        </Button>
      </div>
    </div>
  )
}
