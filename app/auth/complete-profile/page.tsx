"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    birthDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("プロフィールの更新に失敗しました")
      }

      toast({
        title: "登録完了",
        description: "プロフィールが登録されました。",
      })

      // マイページにリダイレクト
      router.push("/me")
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">メール認証が完了しました</CardTitle>
          <CardDescription>
            プロフィールを入力して、登録を完了させましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
              <p className="font-semibold mb-1">以下の情報を入力してください</p>
              <p className="text-xs">
                これらの情報は案件への応募や企業とのマッチングに使用されます。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="山田"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="太郎"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                ハイフンありでも、なしでもOKです
              </p>
            </div>

            <div>
              <Label htmlFor="birthDate">生年月日 <span className="text-red-500">*</span></Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              disabled={loading}
            >
              {loading ? "登録中..." : "プロフィールを完成させる"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              後からマイページで詳細なプロフィールを追加できます
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

