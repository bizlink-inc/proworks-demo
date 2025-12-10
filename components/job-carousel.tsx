"use client"

import { useEffect, useRef, useState } from "react"
import { JobCard } from "./job-card"
import type { Job } from "@/lib/kintone/types"
import Link from "next/link"

type JobCarouselProps = {
  jobs: Job[]
  onViewDetail: (jobId: string) => void
}

export const JobCarousel = ({ jobs, onViewDetail }: JobCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScrollLeft, setMaxScrollLeft] = useState(0)

  // スクロール可能な最大値を計算
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const max = container.scrollWidth - container.clientWidth
      setMaxScrollLeft(max)
    }
  }, [jobs.length])

  // 連続的な自動スクロール（滑らかに右にスクロール）
  useEffect(() => {
    if (jobs.length <= 3) return // 3件以下の場合は自動スクロール不要

    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current
          const currentScroll = container.scrollLeft
          const maxScroll = container.scrollWidth - container.clientWidth

          // 最後まで行ったら最初に戻る
          if (currentScroll >= maxScroll - 1) {
            container.scrollTo({ left: 0, behavior: "auto" })
            setScrollPosition(0)
          } else {
            // 1ピクセルずつスクロール（スピードを調整したい場合はこの値を変更）
            container.scrollTo({ left: currentScroll + 1, behavior: "auto" })
            setScrollPosition(currentScroll + 1)
          }
        }
      }, 20) // 20msごと（50fps相当）
    }

    startAutoScroll()

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [jobs.length])

  const handlePrev = () => {
    if (scrollContainerRef.current && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth + 24 // カード幅 + gap
      const newPosition = Math.max(0, scrollPosition - cardWidth)
      
      // スクロール位置を更新
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setScrollPosition(newPosition)
    }
  }

  const handleNext = () => {
    if (scrollContainerRef.current && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth + 24 // カード幅 + gap
      const newPosition = Math.min(maxScrollLeft, scrollPosition + cardWidth)
      
      // スクロール位置を更新
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setScrollPosition(newPosition)
    }
  }

  if (jobs.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* カルーセルコンテナ */}
      <div className="relative">
        {/* スクロール可能なコンテナ */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-hidden"
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {jobs.map((job, index) => (
            <div
              key={job.id}
              ref={index === 0 ? cardRef : null}
              className="flex-shrink-0"
              style={{ 
                width: "calc((100% - 48px) / 3)",
                minWidth: "280px",
                maxWidth: "400px"
              }}
            >
              <JobCard
                job={job}
                onViewDetail={onViewDetail}
                showApplicationStatus={false}
                isEnded={false}
                hideDetailButton={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* リンク */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded transition-colors hover:opacity-90"
          style={{
            fontSize: "14px",
            fontWeight: 600,
            backgroundColor: "#3966a2",
            color: "#ffffff",
            textDecoration: "none",
          }}
        >
          案件を探すorおすすめ案件を確認する
        </Link>
      </div>
    </div>
  )
}

