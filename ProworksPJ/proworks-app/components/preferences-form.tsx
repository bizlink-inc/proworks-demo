"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function PreferencesForm() {
  const [preferences, setPreferences] = useState({
    minUnitPrice: "",
    maxUnitPrice: "",
    locations: [] as string[],
    workStyle: [] as string[],
    skills: "",
  })

  const locationOptions = ["リモート", "東京", "大阪", "名古屋", "福岡"]
  const workStyleOptions = ["週5日", "週4日", "週3日", "フレックス", "時短勤務"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] 希望条件保存:", preferences)
  }

  const toggleLocation = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location],
    }))
  }

  const toggleWorkStyle = (style: string) => {
    setPreferences((prev) => ({
      ...prev,
      workStyle: prev.workStyle.includes(style)
        ? prev.workStyle.filter((s) => s !== style)
        : [...prev.workStyle, style],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">希望単価</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minUnitPrice">最低単価（万円/月）</Label>
            <Input
              id="minUnitPrice"
              type="number"
              placeholder="50"
              value={preferences.minUnitPrice}
              onChange={(e) => setPreferences({ ...preferences, minUnitPrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUnitPrice">希望単価（万円/月）</Label>
            <Input
              id="maxUnitPrice"
              type="number"
              placeholder="80"
              value={preferences.maxUnitPrice}
              onChange={(e) => setPreferences({ ...preferences, maxUnitPrice: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">希望勤務地</h3>
        <div className="space-y-2">
          {locationOptions.map((location) => (
            <div key={location} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location}`}
                checked={preferences.locations.includes(location)}
                onCheckedChange={() => toggleLocation(location)}
              />
              <Label htmlFor={`location-${location}`} className="cursor-pointer">
                {location}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">希望勤務形態</h3>
        <div className="space-y-2">
          {workStyleOptions.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`workstyle-${style}`}
                checked={preferences.workStyle.includes(style)}
                onCheckedChange={() => toggleWorkStyle(style)}
              />
              <Label htmlFor={`workstyle-${style}`} className="cursor-pointer">
                {style}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">希望スキル・技術</Label>
        <Input
          id="skills"
          placeholder="React, TypeScript, Node.js など"
          value={preferences.skills}
          onChange={(e) => setPreferences({ ...preferences, skills: e.target.value })}
        />
        <p className="text-sm text-gray-500">カンマ区切りで入力してください</p>
      </div>

      <Button type="submit" className="w-full">
        保存する
      </Button>
    </form>
  )
}
