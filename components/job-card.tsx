"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { Job } from "@/lib/kintone/types"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
}

export function JobCard({ job, onViewDetail }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{job.title}</CardTitle>
        {/* 案件特徴を表示 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {job.features.slice(0, 2).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 職種ポジション */}
        <div className="flex flex-wrap gap-1">
          {job.position.slice(0, 2).map((pos) => (
            <Badge key={pos} variant="secondary" className="text-xs">
              {pos}
            </Badge>
          ))}
        </div>

        {/* 勤務地 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{job.location || "リモート"}</span>
        </div>

        {/* 単価 */}
        <div className="text-lg font-semibold text-blue-600">
          {job.rate || "応相談"}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => onViewDetail(job.id)}
        >
          詳細を見る
        </Button>
      </CardFooter>
    </Card>
  )
}
