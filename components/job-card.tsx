"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { Job } from "@/lib/mockdb"

type JobCardProps = {
  job: Job
  onViewDetail: (jobId: string) => void
}

export function JobCard({ job, onViewDetail }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{job.title}</CardTitle>
          {job.isNew && (
            <Badge variant="destructive" className="shrink-0">
              NEW
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{job.company.name}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        <div className="text-lg font-semibold text-blue-600">
          ¥{job.unitPrice.min.toLocaleString()} - ¥{job.unitPrice.max.toLocaleString()}/月
        </div>
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full bg-transparent" onClick={() => onViewDetail(job.id)}>
          詳細を見る
        </Button>
      </CardFooter>
    </Card>
  )
}
