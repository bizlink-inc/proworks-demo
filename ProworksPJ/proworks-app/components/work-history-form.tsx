"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

type WorkHistory = {
  id: string
  company: string
  position: string
  period: string
  description: string
}

type Certification = {
  id: string
  name: string
  date: string
}

export function WorkHistoryForm() {
  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([
    { id: "1", company: "", position: "", period: "", description: "" },
  ])
  const [certifications, setCertifications] = useState<Certification[]>([{ id: "1", name: "", date: "" }])

  const addWorkHistory = () => {
    setWorkHistories([
      ...workHistories,
      { id: Date.now().toString(), company: "", position: "", period: "", description: "" },
    ])
  }

  const removeWorkHistory = (id: string) => {
    setWorkHistories(workHistories.filter((w) => w.id !== id))
  }

  const addCertification = () => {
    setCertifications([...certifications, { id: Date.now().toString(), name: "", date: "" }])
  }

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter((c) => c.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] 職歴・資格保存:", { workHistories, certifications })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 職歴セクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">職歴</h3>
          <Button type="button" variant="outline" size="sm" onClick={addWorkHistory}>
            <Plus className="w-4 h-4 mr-2" />
            追加
          </Button>
        </div>

        <div className="space-y-6">
          {workHistories.map((work, index) => (
            <div key={work.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">職歴 {index + 1}</span>
                {workHistories.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeWorkHistory(work.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>会社名</Label>
                  <Input placeholder="株式会社〇〇" />
                </div>
                <div className="space-y-2">
                  <Label>役職</Label>
                  <Input placeholder="シニアエンジニア" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>期間</Label>
                <Input placeholder="2020年4月 - 2023年3月" />
              </div>

              <div className="space-y-2">
                <Label>業務内容</Label>
                <Textarea placeholder="担当した業務内容を記載してください" rows={3} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 資格セクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">資格</h3>
          <Button type="button" variant="outline" size="sm" onClick={addCertification}>
            <Plus className="w-4 h-4 mr-2" />
            追加
          </Button>
        </div>

        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={cert.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">資格 {index + 1}</span>
                {certifications.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCertification(cert.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>資格名</Label>
                  <Input placeholder="基本情報技術者試験" />
                </div>
                <div className="space-y-2">
                  <Label>取得日</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        保存する
      </Button>
    </form>
  )
}
