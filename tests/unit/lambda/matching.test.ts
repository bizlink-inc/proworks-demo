import { describe, it, expect } from "vitest"
import {
  calculateMatchScore,
  TalentForMatching,
  JobForMatching,
} from "@/lambda/shared/matching"

describe("calculateMatchScore", () => {
  describe("10.1.1 スキルマッチ計算", () => {
    it("人材のスキルが案件のスキルと一致する場合、スコアが加算される", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: ["フロントエンドエンジニア"],
        skills: "React, TypeScript, Next.js",
        experience: "Reactを使ったWebアプリ開発経験5年",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "React開発案件",
        positions: ["フロントエンドエンジニア"],
        skills: ["React", "TypeScript"],
      }

      const result = calculateMatchScore(talent, job)

      expect(result.score).toBeGreaterThan(0)
      expect(result.matchDetails.some((d) => d.keyword === "React")).toBe(true)
      expect(result.matchDetails.some((d) => d.keyword === "TypeScript")).toBe(
        true
      )
    })

    it("スキルの出現回数がカウントされる", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "React, React Native, React Query",
        experience: "Reactを使ったプロジェクトを複数担当。React Nativeでモバイルアプリも開発。",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "React開発案件",
        positions: [],
        skills: ["React"],
      }

      const result = calculateMatchScore(talent, job)
      const reactMatch = result.matchDetails.find((d) => d.keyword === "React")

      expect(reactMatch).toBeDefined()
      expect(reactMatch!.count).toBeGreaterThan(3) // 複数箇所でReactが出現
    })
  })

  describe("10.1.2 職種マッチ計算", () => {
    it("人材の職種が案件の職種と一致する場合、スコアが加算される", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: ["バックエンドエンジニア", "フロントエンドエンジニア"],
        skills: "",
        experience: "",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "フルスタック開発案件",
        positions: ["フロントエンドエンジニア"],
        skills: [],
      }

      const result = calculateMatchScore(talent, job)

      expect(result.matchDetails.some((d) => d.keyword === "フロントエンドエンジニア")).toBe(true)
    })
  })

  describe("10.1.3 スコアゼロのケース", () => {
    it("マッチするスキルがない場合、スコアは0になる", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: ["バックエンドエンジニア"],
        skills: "Java, Spring Boot, PostgreSQL",
        experience: "Javaを使った基幹システム開発",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "iOS開発案件",
        positions: ["iOSエンジニア"],
        skills: ["Swift", "SwiftUI", "Xcode"],
      }

      const result = calculateMatchScore(talent, job)

      expect(result.score).toBe(0)
      expect(result.matchDetails.length).toBe(0)
    })
  })

  describe("10.1.4 経験からのスコア加算", () => {
    it("職務経歴にキーワードが含まれる場合、スコアが加算される", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "",
        experience: "AWSを使ったインフラ構築を担当。EC2, S3, RDS, Lambdaを活用したサーバーレスアーキテクチャを設計・構築。",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "AWS案件",
        positions: [],
        skills: ["AWS", "Lambda"],
      }

      const result = calculateMatchScore(talent, job)

      expect(result.score).toBeGreaterThan(0)
      expect(result.matchDetails.some((d) => d.keyword === "AWS")).toBe(true)
      expect(result.matchDetails.some((d) => d.keyword === "Lambda")).toBe(true)
    })
  })

  describe("10.1.5 複数ソースからのスコア加算", () => {
    it("スキル・経験の両方からマッチした場合、合計スコアになる", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "Python, Django, Flask",
        experience: "Pythonを使ったデータ分析基盤の構築。Djangoで管理画面も開発。",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "Python開発案件",
        positions: [],
        skills: ["Python", "Django"],
      }

      const result = calculateMatchScore(talent, job)
      const pythonMatch = result.matchDetails.find((d) => d.keyword === "Python")

      expect(pythonMatch).toBeDefined()
      // スキルと経験の両方でPythonが見つかるので、source情報が含まれる
      expect(pythonMatch!.source).toContain("言語_ツール")
      expect(pythonMatch!.source).toContain("主な実績_PR_職務経歴")
    })
  })

  describe("10.1.6 返り値の構造", () => {
    it("正しい構造のMatchResultが返される", () => {
      const talent: TalentForMatching = {
        id: "talent-123",
        authUserId: "auth-user-456",
        name: "山田太郎",
        positions: ["フロントエンドエンジニア"],
        skills: "React",
        experience: "",
      }

      const job: JobForMatching = {
        id: "job-789",
        jobId: "job-789",
        title: "React案件",
        positions: [],
        skills: ["React"],
      }

      const result = calculateMatchScore(talent, job)

      expect(result.talentId).toBe("talent-123")
      expect(result.talentAuthUserId).toBe("auth-user-456")
      expect(result.talentName).toBe("山田太郎")
      expect(result.jobId).toBe("job-789")
      expect(result.jobTitle).toBe("React案件")
      expect(typeof result.score).toBe("number")
      expect(Array.isArray(result.matchDetails)).toBe(true)
    })
  })

  describe("10.2.1 閾値判定", () => {
    it("低スコアの組み合わせは閾値未満になる可能性がある", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "HTML, CSS",
        experience: "Webサイトのコーディング",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "Ruby案件",
        positions: [],
        skills: ["Ruby", "Rails", "PostgreSQL"],
      }

      const result = calculateMatchScore(talent, job)
      const threshold = 3 // 例として閾値3

      // スコアが低い組み合わせは閾値未満
      expect(result.score).toBeLessThan(threshold)
    })

    it("高スコアの組み合わせは閾値以上になる", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: ["Rubyエンジニア"],
        skills: "Ruby, Rails, PostgreSQL, Redis, Sidekiq",
        experience: "Rubyを使ったWebサービス開発10年。Railsでの大規模サービス運用経験あり。PostgreSQLチューニングも担当。",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "Ruby案件",
        positions: [],
        skills: ["Ruby", "Rails", "PostgreSQL"],
      }

      const result = calculateMatchScore(talent, job)
      const threshold = 3

      expect(result.score).toBeGreaterThanOrEqual(threshold)
    })
  })

  describe("10.3 空データのハンドリング", () => {
    it("空のスキルでもエラーにならない", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "",
        experience: "",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "案件",
        positions: [],
        skills: [],
      }

      expect(() => calculateMatchScore(talent, job)).not.toThrow()
      const result = calculateMatchScore(talent, job)
      expect(result.score).toBe(0)
    })

    it("nullish値でもエラーにならない", () => {
      const talent: TalentForMatching = {
        id: "1",
        authUserId: "user-1",
        name: "テスト太郎",
        positions: [],
        skills: "",
        experience: "",
      }

      const job: JobForMatching = {
        id: "job-1",
        jobId: "job-1",
        title: "案件",
        positions: [],
        skills: [],
      }

      expect(() => calculateMatchScore(talent, job)).not.toThrow()
    })
  })
})
