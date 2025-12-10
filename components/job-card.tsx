"use client"

import { Button } from "@/components/ui/button"
import type { Job } from "@/lib/kintone/types"
import { mapApplicationStatusToDisplay } from "@/lib/utils"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
  showApplicationStatus?: boolean // 応募ステータスの枠線を表示するかどうか（デフォルト: false）
  isEnded?: boolean // 応募終了かどうか（デフォルト: false）
  hideDetailButton?: boolean // 詳細を見るボタンを非表示にするかどうか（デフォルト: false）
}

// 仕様書: 案件カード > フォント・カラー
const primaryTextColor = "#30373f" // ラベル
const bodyTextColor = "#000000"    // 本文
const linkColor = "#1f3151"        // タイトル、職種ポジション、必須スキル
const accentColor = "#ea8737"      // 金額
const dividerColor = "#d5e5f0"     // 区切り線

const formatRateValue = (rate?: string) => {
  if (!rate) return ""
  const numeric = rate.replace(/[^0-9]/g, "")
  return numeric || rate
}

// 応募ステータスの色とラベルを取得（kintoneの値を表示用ラベルに変換）
const getStatusStyle = (status?: string | null, isEnded?: boolean, recruitmentStatus?: string) => {
  // 案件の募集ステータスが「クローズ」の場合は「募集終了」として表示（最優先）
  // 応募ステータスが「面談調整中」などでも、案件の募集ステータスが「クローズ」なら「募集終了」を表示
  if (recruitmentStatus === "クローズ") {
    return {
      label: "募集終了",
      bgColor: "#9ca3af",
      borderColor: "#9ca3af",
      textColor: "#ffffff"
    }
  }

  // 応募終了（見送り）の場合
  if (isEnded || status === "見送り") {
    return {
      label: "募集終了",
      bgColor: "#9ca3af",
      borderColor: "#9ca3af",
      textColor: "#ffffff"
    }
  }

  if (!status) return null

  // kintoneのステータス値を表示用ラベルに変換
  const displayLabel = mapApplicationStatusToDisplay(status)
  if (!displayLabel) return null

  // 表示ラベルに基づいて色を決定
  switch (displayLabel) {
    case "案件決定":
      return {
        label: displayLabel,
        bgColor: "#d22852",
        borderColor: "#d22852",
        textColor: "#ffffff"
      }
    case "面談調整中":
      return {
        label: displayLabel,
        bgColor: "#fa8212",
        borderColor: "#fa8212",
        textColor: "#ffffff"
      }
    case "面談予定":
      return {
        label: displayLabel,
        bgColor: "#2196f3",
        borderColor: "#2196f3",
        textColor: "#ffffff"
      }
    case "応募済み":
      return {
        label: displayLabel,
        bgColor: "#3f9c78",
        borderColor: "#3f9c78",
        textColor: "#ffffff"
      }
    case "募集終了":
      return {
        label: displayLabel,
        bgColor: "#9ca3af",
        borderColor: "#9ca3af",
        textColor: "#ffffff"
      }
    default:
      return null
  }
}

export function JobCard({ job, onViewDetail, showApplicationStatus = false, isEnded = false, hideDetailButton = false }: JobCardProps) {
  const rateValue = formatRateValue(job.rate)
  const features = job.features?.slice(0, 3) ?? []
  const positions = job.position ?? []
  const skills = job.skills?.slice(0, 3) ?? []
  const locationValue = (job.location && job.location.trim().length > 0)
    ? job.location.trim()
    : "リモート"
  const nearestValue = (job.nearestStation && job.nearestStation.trim().length > 0)
    ? job.nearestStation.trim()
    : ""
  
  // 応募ステータスの枠線表示を制御（showApplicationStatusがfalseの場合は非表示）
  const statusStyle = showApplicationStatus ? getStatusStyle(job.applicationStatus, isEnded, job.recruitmentStatus) : null

  return (
    <div
      className="bg-white rounded-[4px] transition-shadow hover:shadow-md relative"
      style={{
        border: statusStyle ? `2px solid ${statusStyle.borderColor}` : "1px solid #d5e5f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "visible" // リボンが外に出るように
      }}
    >
      {/* 上部エリア：リボン（左上）+ バッジ（右上） */}
      <div className="p-4 pb-2 relative">
        {/* 応募ステータスラベル（リボン風・左上）- 最優先表示 */}
        {statusStyle && (
          <div className="absolute top-0 left-2">
            <svg width="80" height="40" style={{ display: "block" }}>
              <path
                d="M 0 0 L 80 0 L 80 32 Q 40 22, 0 32 Z"
                fill={statusStyle.bgColor}
              />
              <text
                x="40"
                y="16"
                textAnchor="middle"
                fill={statusStyle.textColor}
                fontSize="11"
                fontWeight="600"
                style={{ fontFamily: "Noto Sans JP" }}
              >
                {statusStyle.label}
              </text>
            </svg>
          </div>
        )}

        {/* 新着バッジ（リボン風・左上）- 応募ステータス表示時は非表示 */}
        {job.isNew && !showApplicationStatus && (
          <div className="absolute top-0 left-2">
            <svg width="58" height="40" style={{ display: "block" }}>
              <path
                d="M 0 0 L 58 0 L 58 32 Q 29 23, 0 32 Z"
                fill="#d22852"
              />
              <text
                x="29"
                y="18"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                style={{ fontFamily: "Noto Sans JP" }}
              >
                NEW
              </text>
            </svg>
          </div>
        )}

        {/* AIマッチバッジ（リボン風・左上、NEWバッジの右側）- 適合スコアが発行されている場合に表示 */}
        {job.recommendationScore != null && job.recommendationScore > 0 && !showApplicationStatus && (
          <div 
            className="absolute top-0"
            style={{ left: job.isNew ? "74px" : "8px" }}
          >
            <svg width="72" height="40" style={{ display: "block" }}>
              <path
                d="M 0 0 L 72 0 L 72 32 Q 36 23, 0 32 Z"
                fill="#2196f3"
              />
              <text
                x="36"
                y="18"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
                style={{ fontFamily: "Noto Sans JP" }}
              >
                AIマッチ
              </text>
            </svg>
          </div>
        )}

        {/* 案件特徴バッジ（右上に配置） */}
        <div 
          className="flex flex-wrap gap-2 justify-end mb-3 pt-1"
          style={{ 
            paddingLeft: (() => {
              if (statusStyle) return "88px";
              const hasRecommendationScore = job.recommendationScore != null && job.recommendationScore > 0;
              if (job.isNew && hasRecommendationScore) return "154px"; // NEW(58) + 間隔(8) + AIマッチ(72) + 余白(16)
              if (job.isNew || hasRecommendationScore) return "88px"; // バッジ幅(72) + 余白(16)
              return "0";
            })()
          }}
        >
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

        {/* 案件タイトル */}
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

      {/* 報酬単価 */}
      <div className="px-4 py-2">
        <div style={{ fontSize: "13px", color: bodyTextColor }}>
          <span className="font-bold">報酬単価（税抜）</span>{" "}
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {rateValue || job.rate}
          </span>
          <span className="font-bold">万円/月</span>
        </div>
      </div>

      {/* 勤務地・最寄り駅（横並び） */}
      <div className="px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {/* 勤務地 */}
          <div className="flex items-center gap-2">
          <span
              className="inline-flex items-center h-6 px-3 text-xs font-bold rounded-[2px]"
            style={{
              backgroundColor: "#ececec",
              color: primaryTextColor,
            }}
          >
            勤務地
          </span>
          <span
              className="font-bold"
            style={{
              fontSize: "13px",
              color: bodyTextColor,
            }}
          >
              {locationValue}
          </span>
        </div>

          {/* 最寄り */}
          {nearestValue && (
            <div className="flex items-center gap-2">
            <span
                className="inline-flex items-center h-6 px-3 text-xs font-bold rounded-[2px]"
              style={{
                backgroundColor: "#ececec",
                color: primaryTextColor,
              }}
            >
              最寄り
            </span>
            <span
                className="font-bold"
              style={{
                fontSize: "13px",
                color: bodyTextColor,
              }}
            >
                {nearestValue}
            </span>
          </div>
        )}
      </div>
      </div>

      {/* 区切り線 */}
      <div className="px-4">
        <div style={{ borderTop: `1px solid ${dividerColor}` }} />
      </div>

      {/* 必須スキル */}
      {skills.length > 0 && (
        <div className="px-4 py-2 flex items-start gap-4">
          <span
            className="whitespace-nowrap"
            style={{
              fontSize: "13px",
              color: primaryTextColor,
              fontWeight: 700,
            }}
          >
            必須スキル
          </span>
          <span
            style={{
              fontSize: "13px",
              color: linkColor,
              fontWeight: 500,
            }}
          >
            {skills.map((skill, index) => (
              <span key={skill}>
                {skill}
                {index < skills.length - 1 && (
                  <span style={{ color: bodyTextColor }}> ／ </span>
                )}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* 区切り線 */}
      <div className="px-4">
        <div style={{ borderTop: `1px solid ${dividerColor}` }} />
      </div>

      {/* 職種ポジション */}
      {positions.length > 0 && (
        <div className="px-4 py-2 flex items-start gap-4">
          <span
            className="whitespace-nowrap"
            style={{
              fontSize: "13px",
              color: primaryTextColor,
              fontWeight: 700,
            }}
          >
            職種ポジション
          </span>
          <div className="flex flex-col gap-0.5">
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

      {/* 区切り線 */}
      <div className="px-4">
        <div style={{ borderTop: `1px solid ${dividerColor}` }} />
      </div>

      {/* 詳細を見るボタン */}
      {!hideDetailButton && (
        <div className="px-4 pb-4 pt-3 flex justify-center">
          <Button
            variant={isEnded ? "pw-outline" : "pw-primary"}
            className="w-full max-w-[180px]"
            onClick={() => !isEnded && onViewDetail(job.id)}
            disabled={isEnded}
            style={{ 
              fontSize: "14px", 
              borderRadius: "4px",
              ...(isEnded ? {
                backgroundColor: "#9ca3af",
                borderColor: "#9ca3af",
                color: "#ffffff",
                cursor: "not-allowed",
              } : {})
            }}
          >
            詳細を見る
          </Button>
        </div>
      )}
    </div>
  )
}
