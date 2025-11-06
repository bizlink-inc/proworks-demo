"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/mockdb"

type ProfileFormProps = {
  user: Omit<User, "password">
  onUpdate: (user: Omit<User, "password">) => void
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [formData, setFormData] = useState(user)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
        toast({
          title: "保存しました",
          description: "プロフィール情報を更新しました。",
        })
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastName">姓</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="firstName">名</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastNameKana">セイ</Label>
          <Input
            id="lastNameKana"
            value={formData.lastNameKana}
            onChange={(e) => setFormData({ ...formData, lastNameKana: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="firstNameKana">メイ</Label>
          <Input
            id="firstNameKana"
            value={formData.firstNameKana}
            onChange={(e) => setFormData({ ...formData, firstNameKana: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="birthdate">生年月日</Label>
        <Input
          id="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">電話番号</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="address">住所</Label>
        <Input
          id="address"
          value={formData.address || ""}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
        {loading ? "保存中..." : "保存"}
      </Button>
    </form>
  )
}
