"use client"

import { useRef, useState, useEffect } from "react"
import { JobCard } from "./job-card"
import type { Job } from "@/lib/kintone/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

type AiRecommendedJobsCarouselProps = {
  jobs: Job[]
  onViewDetail: (jobId: string) => void
}

export const AiRecommendedJobsCarousel = ({ jobs, onViewDetail }: AiRecommendedJobsCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScrollLeft, setMaxScrollLeft] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // スクロール可能な最大値を計算
  useEffect(() => {
    const updateScrollState = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const max = container.scrollWidth - container.clientWidth
        setMaxScrollLeft(max)
        setCanScrollLeft(container.scrollLeft > 0)
        setCanScrollRight(container.scrollLeft < max - 1)
      }
    }

    updateScrollState()
    window.addEventListener("resize", updateScrollState)
    return () => window.removeEventListener("resize", updateScrollState)
  }, [jobs.length])

  // スクロール位置の監視
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScroll = container.scrollLeft
      const max = container.scrollWidth - container.clientWidth
      setScrollPosition(currentScroll)
      setCanScrollLeft(currentScroll > 0)
      setCanScrollRight(currentScroll < max - 1)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const handlePrev = () => {
    if (scrollContainerRef.current && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth + 24 // カード幅 + gap
      const newPosition = Math.max(0, scrollPosition - cardWidth)
      
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
    }
  }

  const handleNext = () => {
    if (scrollContainerRef.current && cardRef.current) {
      const cardWidth = cardRef.current.offsetWidth + 24 // カード幅 + gap
      const newPosition = Math.min(maxScrollLeft, scrollPosition + cardWidth)
      
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
    }
  }

  if (jobs.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* カルーセルコンテナ */}
      <div className="relative flex items-center">
        {/* 左矢印ボタン */}
        {canScrollLeft && (
          <button
            onClick={handlePrev}
            className="flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ 
              color: "var(--pw-text-gray)",
              width: "40px",
              height: "40px",
            }}
            aria-label="前へ"
          >
            <ChevronLeft className="w-10 h-10" style={{ strokeWidth: 1.5 }} />
          </button>
        )}

        {/* スクロール可能なコンテナ */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto flex-1"
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
              />
            </div>
          ))}
        </div>

        {/* 右矢印ボタン */}
        {canScrollRight && (
          <button
            onClick={handleNext}
            className="flex-shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ 
              color: "var(--pw-text-gray)",
              width: "40px",
              height: "40px",
            }}
            aria-label="次へ"
          >
            <ChevronRight className="w-10 h-10" style={{ strokeWidth: 1.5 }} />
          </button>
        )}
      </div>
    </div>
  )
}

