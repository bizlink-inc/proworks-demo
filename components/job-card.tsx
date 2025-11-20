"use client"

import { Button } from "@/components/ui/button"
import type { Job } from "@/lib/kintone/types"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
}

// 仕様書: 案件カード > フォント・カラー
const primaryTextColor = "#30373f" // タイトル
const bodyTextColor = "#000000"    // 本文
const linkColor = "#63b2cd"        // リンク (#1f3151/#63b2cd のうちカードは明るい方を採用)
const accentColor = "#ea8737"      // 金額

const formatRateValue = (rate?: string) => {
  if (!rate) return ""
  const numeric = rate.replace(/[^0-9]/g, "")
  return numeric || rate
}

export function JobCard({ job, onViewDetail }: JobCardProps) {
  const rateValue = formatRateValue(job.rate)
  const features = job.features?.slice(0, 3) ?? []
  const positions = job.position ?? []
  const locationValues = (job.location && job.location.trim().length > 0)
    ? [job.location.trim()]
    : []
  const nearestValues = (job.nearestStation && job.nearestStation.trim().length > 0)
    ? [job.nearestStation.trim()]
    : []

  return (
    <div
      className="bg-white rounded-[4px] transition-shadow hover:shadow-md"
      style={{
        border: "1px solid #d5e5f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="p-4 pb-2">
        <div className="flex flex-wrap gap-2 mb-3">
          {features.map((feature, index) => (
            <span
              key={feature}
              className="px-3 py-1 text-xs font-semibold rounded"
              style={{
                border: index === 0 ? "1px solid #e9277a" : "1px solid #686868",
                backgroundColor: index === 0 ? "#fde3ef" : "#ffffff",
                color: index === 0 ? "#e9277a" : "#686868",
              }}
            >
              {feature}
            </span>
          ))}
        </div>
        <h3
          className="leading-tight mb-1"
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: linkColor,
          }}
        >
          {job.title}
        </h3>
      </div>

      <div className="px-4 py-3">
        <div style={{ fontSize: "13px", color: bodyTextColor }}>
          <span className="font-medium">報酬単価（税抜）</span>{" "}
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {rateValue || job.rate}
          </span>
          <span style={{ fontWeight: 500 }}>万円/月</span>
        </div>
      </div>

      <div className="px-4">
        <div style={{ borderTop: "1px solid #d5e5f0" }} />
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center h-6 px-3 text-xs font-semibold rounded-[2px]"
            style={{
              backgroundColor: "#ececec",
              color: primaryTextColor,
            }}
          >
            勤務地
          </span>
          <span
            style={{
              fontSize: "13px",
              color: bodyTextColor,
            }}
          >
            {(locationValues.length > 0 ? locationValues : ["リモート"])[0]}
          </span>
        </div>

        {nearestValues.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center h-6 px-3 text-xs font-semibold rounded-[2px]"
              style={{
                backgroundColor: "#ececec",
                color: primaryTextColor,
              }}
            >
              最寄り
            </span>
            <span
              style={{
                fontSize: "13px",
                color: bodyTextColor,
              }}
            >
              {nearestValues[0]}
            </span>
          </div>
        )}
      </div>

      <div className="px-4">
        <div style={{ borderTop: "1px solid #d5e5f0" }} />
      </div>

      {positions.length > 0 && (
        <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
          <span
            style={{
              fontSize: "13px",
              color: primaryTextColor,
              fontWeight: 600,
            }}
          >
            職種ポジション
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            {positions.map((pos) => (
              <span
                key={pos}
                style={{
                  fontSize: "13px",
                  color: linkColor,
                  fontWeight: 500,
                }}
              >
                {pos}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-2 flex justify-center">
        <Button
          variant="pw-primary"
          className="w-full max-w-[220px]"
          onClick={() => onViewDetail(job.id)}
          style={{ fontSize: "15px", borderRadius: "4px" }}
        >
          詳細を見る
        </Button>
      </div>
    </div>
  )
}
