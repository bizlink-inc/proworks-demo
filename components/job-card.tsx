"use client"

import { PWCardBadge } from "@/components/ui/pw-card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import type { Job } from "@/lib/kintone/types"
import { formatCurrency } from "@/lib/utils"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
}

export function JobCard({ job, onViewDetail }: JobCardProps) {
  return (
    <div 
      className="bg-white rounded-[var(--pw-radius-sm)] border transition-shadow hover:shadow-lg"
      style={{ borderColor: "#d5e5f0" }}
    >
      {/* ヘッダー */}
      <div 
        className="p-4"
        style={{ borderBottom: "1px solid #9ab6ca" }}
      >
        <h3 
          className="font-semibold mb-2"
          style={{ 
            fontSize: "var(--pw-text-lg)",
            color: "var(--pw-text-primary)"
          }}
        >
          {job.title}
        </h3>
        {/* 案件特徴を表示 */}
        <div className="flex flex-wrap gap-2 mt-2">
          {job.features.slice(0, 2).map((feature) => (
            <PWCardBadge key={feature} variant="default">
              {feature}
            </PWCardBadge>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4 space-y-3">
        {/* 職種ポジション */}
        <div className="flex flex-wrap gap-2">
          {job.position.slice(0, 2).map((pos) => (
            <span 
              key={pos}
              className="px-2 py-1 rounded text-xs"
              style={{ 
                backgroundColor: "#f0f0f0",
                color: "var(--pw-text-gray)"
              }}
            >
              {pos}
            </span>
          ))}
        </div>

        {/* 勤務地 */}
        <div 
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--pw-text-gray)" }}
        >
          <MapPin className="w-4 h-4" />
          <span>{job.location || "リモート"}</span>
        </div>

        {/* 単価 */}
        <div 
          className="text-lg font-semibold"
          style={{ color: "#ea8737" }}
        >
          {formatCurrency(job.rate)}
        </div>
      </div>

      {/* フッター */}
      <div 
        className="p-4"
        style={{ borderTop: "1px solid #9ab6ca" }}
      >
        <Button
          variant="pw-outline"
          className="w-full"
          onClick={() => onViewDetail(job.id)}
        >
          詳細を見る
        </Button>
      </div>
    </div>
  )
}
