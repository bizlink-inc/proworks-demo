"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Job } from "@/lib/kintone/types"
import { mapApplicationStatusToDisplay } from "@/lib/utils"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
  showApplicationStatus?: boolean // 応募ステータスの枠線を表示するかどうか（デフォルト: false）
  isEnded?: boolean // 応募終了かどうか（デフォルト: false）
  hideDetailButton?: boolean // 詳細を見るボタンを非表示にするかどうか（デフォルト: false）
  onCancelApplication?: (applicationId: string) => Promise<void> // 応募取り消しのコールバック
  applicationId?: string // 応募履歴のID
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
      borderColor: undefined, // 枠線なし
      textColor: "#ffffff"
    }
  }

  // 応募終了（見送り）の場合
  if (isEnded || status === "見送り") {
    return {
      label: "募集終了",
      bgColor: "#9ca3af",
      borderColor: undefined, // 枠線なし
      textColor: "#ffffff"
    }
  }

  if (!status) return null

  // kintoneのステータス値を表示用ラベルに変換
  const displayLabel = mapApplicationStatusToDisplay(status)
  if (!displayLabel) return null

  // 表示ラベルに基づいて色を決定
  // 枠線は「案件決定」の場合のみ表示
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
        borderColor: undefined, // 枠線なし
        textColor: "#ffffff"
      }
    case "面談確定":
      return {
        label: displayLabel,
        bgColor: "#2196f3",
        borderColor: undefined, // 枠線なし
        textColor: "#ffffff"
      }
    case "応募済み":
      return {
        label: displayLabel,
        bgColor: "#3f9c78",
        borderColor: undefined, // 枠線なし
        textColor: "#ffffff"
      }
    case "募集終了":
      return {
        label: displayLabel,
        bgColor: "#9ca3af",
        borderColor: undefined, // 枠線なし
        textColor: "#ffffff"
      }
    default:
      return null
  }
}

// 1段に収まるかどうかを判定する関数（案件特徴用）
const getDisplayableFeatures = (features: string[], maxWidth: number = 300): string[] => {
  if (features.length === 0) return []
  if (features.length <= 2) return features.slice(0, 2)
  
  // 3つ表示した場合に1段に収まるかチェック
  // 簡易的な判定：各タグの文字数から推定
  const totalChars = features.slice(0, 3).reduce((sum, f) => sum + f.length, 0)
  // タグのpaddingやborderを考慮して、おおよそ1文字=8pxと仮定
  const estimatedWidth = totalChars * 8 + (3 * 24) + (2 * 8) // 文字幅 + padding + gap
  if (estimatedWidth <= maxWidth) {
    return features.slice(0, 3)
  }
  return features.slice(0, 2)
}

// 必須スキルを1段に収まるように最大3個まで取得
const getDisplayableSkills = (skills: string[], maxWidth: number = 400): string[] => {
  if (skills.length === 0) return []
  if (skills.length <= 2) return skills.slice(0, 2)
  
  // 3つ表示した場合に1段に収まるかチェック
  const totalChars = skills.slice(0, 3).reduce((sum, s) => sum + s.length, 0)
  // 「 ／ 」の区切り文字も考慮（各2文字）
  const estimatedWidth = totalChars * 8 + (2 * 2 * 8) + 20 // 文字幅 + 区切り文字 + 余白
  if (estimatedWidth <= maxWidth) {
    return skills.slice(0, 3)
  }
  // 2つでも収まらない場合は1つだけ
  if (skills.length >= 2) {
    const twoChars = skills.slice(0, 2).reduce((sum, s) => sum + s.length, 0)
    const twoWidth = twoChars * 8 + (1 * 2 * 8) + 20
    if (twoWidth <= maxWidth) {
      return skills.slice(0, 2)
    }
  }
  return skills.slice(0, 1)
}

export function JobCard({ job, onViewDetail, showApplicationStatus = false, isEnded = false, hideDetailButton = false, onCancelApplication, applicationId }: JobCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  
  const rateValue = formatRateValue(job.rate)
  const features = getDisplayableFeatures(job.features ?? [])
  const positions = (job.position ?? []).slice(0, 2) // 最大2個まで
  const skills = getDisplayableSkills(job.skills ?? [])
  const locationValue = (job.location && job.location.trim().length > 0)
    ? job.location.trim()
    : "リモート"
  const nearestValue = (job.nearestStation && job.nearestStation.trim().length > 0)
    ? job.nearestStation.trim()
    : ""
  
  // 応募ステータスの枠線表示を制御（showApplicationStatusがfalseの場合は非表示）
  const statusStyle = showApplicationStatus ? getStatusStyle(job.applicationStatus, isEnded, job.recruitmentStatus) : null

  // 応募取り消しボタンの表示と活性状態を判定
  // 応募済み（応募中）のみ活性、それ以外（案件決定、面談調整中、応募終了など）は非活性
  // 応募終了時もボタンは表示されるが非活性
  const shouldShowCancelButton = showApplicationStatus && onCancelApplication && applicationId
  const canCancelApplication = shouldShowCancelButton && job.applicationStatus === "応募済み" && !isEnded

  // 応募取り消しの処理
  const handleCancelApplication = async () => {
    if (!onCancelApplication || !applicationId) return

    try {
      setIsCancelling(true)
      await onCancelApplication(applicationId)
    } catch (error) {
      console.error("応募取り消しに失敗:", error)
      // エラーは呼び出し元でトースト表示
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div
      className="bg-white rounded-[4px] transition-shadow hover:shadow-md relative flex flex-col h-full"
      style={{
        border: statusStyle?.borderColor ? `2px solid ${statusStyle.borderColor}` : "1px solid #d5e5f0",
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

        {/* 新着バッジ（リボン風・左上）- 応募ステータス表示時は非表示、最左に配置 */}
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

        {/* 担当者おすすめバッジ（リボン風・左上）- Newバッジの右側に配置 */}
        {job.staffRecommend && !showApplicationStatus && (
          <div
            className="absolute top-0"
            style={{ left: job.isNew ? "74px" : "8px" }}
          >
            <svg width="110" height="40" style={{ display: "block" }}>
              <path
                d="M 0 0 L 110 0 L 110 32 Q 55 23, 0 32 Z"
                fill="#f59e0b"
              />
              <text
                x="55"
                y="18"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
                style={{ fontFamily: "Noto Sans JP" }}
              >
                担当者おすすめ
              </text>
            </svg>
          </div>
        )}

        {/* AIマッチバッジ（リボン風・左上）- 応募ステータス表示時は非表示、担当者おすすめの右側に配置 */}
        {job.aiMatched && !showApplicationStatus && (
          <div 
            className="absolute top-0"
            style={{ 
              left: (() => {
                if (job.isNew && job.staffRecommend) return "196px"; // New(58) + 間隔(8) + 担当者おすすめ(110) + 間隔(8) + 左マージン(8)
                if (job.isNew) return "74px"; // New(58) + 間隔(8) + 左マージン(8)
                if (job.staffRecommend) return "126px"; // 担当者おすすめ(110) + 間隔(8) + 左マージン(8)
                return "8px"; // 左マージンのみ
              })()
            }}
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

        {/* 案件特徴バッジ（左側バッジの下に配置、横並び・左揃え、1行でoverflow非表示） */}
        <div
          className="flex flex-nowrap gap-2 justify-start mb-3 overflow-hidden"
          style={{
            paddingTop: (() => {
              // 左側のバッジ（応募ステータス、New、担当者おすすめ、AIマッチ）がない場合は上部の空白を削除
              if (statusStyle) return "28px"; // 応募ステータスがある場合（バッジの下に近づける）
              if (job.isNew || job.staffRecommend || job.aiMatched) return "28px"; // 左側バッジがある場合（バッジの下に近づける）
              return "0"; // バッジがない場合は空白なし
            })(),
          }}
        >
          {features.map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 text-xs font-semibold rounded flex-shrink-0 whitespace-nowrap"
              style={{
                border: "1px solid #686868",
                backgroundColor: "#ffffff",
                color: "#686868",
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

      {/* スペーサー：詳細を見るボタンを最下部に固定 */}
      <div className="flex-1" />

      {/* 詳細を見るボタンと応募を取り消すボタン（横並び） */}
      {!hideDetailButton && (
        <div className="px-4 pb-4 pt-3 flex items-center justify-center gap-2 mt-auto">
          {/* 詳細を見るボタン */}
          <Button
            variant={isEnded ? "pw-outline" : "pw-primary"}
            className="flex-1 max-w-[140px]"
            onClick={() => !isEnded && onViewDetail(job.id)}
            disabled={isEnded}
            style={{ 
              fontSize: "12px", 
              borderRadius: "4px",
              ...(isEnded ? {
                backgroundColor: "#e5e5e5",
                borderColor: "#e5e5e5",
                color: "#686868",
                cursor: "not-allowed",
              } : {})
            }}
          >
            詳細を見る
          </Button>

          {/* 応募を取り消すボタン */}
          {shouldShowCancelButton && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 max-w-[140px]"
                  disabled={isCancelling || !canCancelApplication}
                  style={{
                    fontSize: "12px",
                    borderRadius: "4px",
                    ...(canCancelApplication ? {
                      borderColor: "#686868",
                      color: "#ffffff",
                      backgroundColor: "#686868",
                    } : {
                      backgroundColor: "#e5e5e5",
                      borderColor: "#e5e5e5",
                      color: "#686868",
                      cursor: "not-allowed",
                    }),
                  }}
                >
                  {isCancelling ? "処理中..." : "× 応募を取り消す"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                style={{
                  backgroundColor: "var(--pw-bg-white)",
                  border: "1px solid var(--pw-border-lighter)",
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle
                    style={{
                      fontSize: "var(--pw-text-lg)",
                      color: "var(--pw-text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    この案件の応募を取り消しますか？
                  </AlertDialogTitle>
                  <AlertDialogDescription
                    style={{
                      fontSize: "var(--pw-text-sm)",
                      color: "var(--pw-text-gray)",
                      marginTop: "8px",
                    }}
                  >
                    取り消すとこの案件の選考はできなくなります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <AlertDialogCancel
                    style={{
                      fontSize: "14px",
                      borderRadius: "4px",
                      borderColor: "var(--pw-border-gray)",
                      color: "var(--pw-text-gray)",
                      backgroundColor: "var(--pw-bg-white)",
                    }}
                  >
                    キャンセル
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelApplication}
                    disabled={isCancelling}
                    style={{
                      fontSize: "14px",
                      borderRadius: "4px",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                    }}
                  >
                    {isCancelling ? "処理中..." : "応募を取り消す"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  )
}
