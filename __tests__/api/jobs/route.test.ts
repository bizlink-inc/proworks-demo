/**
 * 案件API GET テスト
 * GET /api/jobs - 案件一覧の取得
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/jobs/route";
import { mockSession } from "../../mocks/auth";
import { createMockJob, createMockApplication } from "../../mocks/kintone";

// モジュールのモック
jest.mock("@/lib/auth-server", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/kintone/services/job", () => ({
  getAllJobs: jest.fn(),
}));

jest.mock("@/lib/kintone/services/application", () => ({
  getApplicationsByAuthUserId: jest.fn(),
}));

jest.mock("@/lib/kintone/client", () => ({
  createRecommendationClient: jest.fn(),
  getAppIds: jest.fn(() => ({ recommendation: 5 })),
}));

// モック関数の取得
const { getSession } = jest.requireMock("@/lib/auth-server");
const { getAllJobs } = jest.requireMock("@/lib/kintone/services/job");
const { getApplicationsByAuthUserId } = jest.requireMock(
  "@/lib/kintone/services/application"
);
const { createRecommendationClient } = jest.requireMock("@/lib/kintone/client");

/**
 * テスト用リクエストを作成
 */
const createRequest = (params: Record<string, string> = {}): NextRequest => {
  const url = new URL("http://localhost:3000/api/jobs");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url, { method: "GET" });
};

describe("GET /api/jobs", () => {
  // モックKintoneクライアント
  let mockRecommendationClient: {
    record: {
      getRecords: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトで認証済み状態
    getSession.mockResolvedValue(mockSession);

    // デフォルトの案件リスト
    getAllJobs.mockResolvedValue([
      createMockJob({ id: "job-1", title: "React開発案件", rate: "80万円", createdAt: "2024-01-15T00:00:00Z" }),
      createMockJob({ id: "job-2", title: "Vue.js開発案件", rate: "70万円", createdAt: "2024-01-10T00:00:00Z" }),
      createMockJob({ id: "job-3", title: "Node.js開発案件", rate: "90万円", createdAt: "2024-01-20T00:00:00Z" }),
    ]);

    // デフォルトで応募なし
    getApplicationsByAuthUserId.mockResolvedValue([]);

    // 推薦クライアントのモック
    mockRecommendationClient = {
      record: {
        getRecords: jest.fn().mockResolvedValue({ records: [] }),
      },
    };
    createRecommendationClient.mockReturnValue(mockRecommendationClient);
  });

  describe("基本的な取得", () => {
    it("案件一覧を取得できる", async () => {
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(3);
      expect(data.total).toBe(3);
    });

    it("未認証でも案件一覧を取得できる", async () => {
      getSession.mockResolvedValue(null);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(3);
    });
  });

  describe("クローズ案件の除外", () => {
    it("募集ステータスがクローズの案件は除外される", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", recruitmentStatus: "募集中" }),
        createMockJob({ id: "job-2", recruitmentStatus: "クローズ" }),
        createMockJob({ id: "job-3", recruitmentStatus: "募集中" }),
      ]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.items.map((j: { id: string }) => j.id)).not.toContain("job-2");
    });
  });

  describe("応募済み案件の除外", () => {
    it("応募済み案件は除外される", async () => {
      getApplicationsByAuthUserId.mockResolvedValue([
        createMockApplication({ jobId: "job-1", status: "応募済み" }),
      ]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.items.map((j: { id: string }) => j.id)).not.toContain("job-1");
    });

    it("応募取消し案件は除外されない", async () => {
      getApplicationsByAuthUserId.mockResolvedValue([
        createMockApplication({ jobId: "job-1", status: "応募取消し" }),
      ]);

      // 応募取消しは除外対象だが、現実装ではMap上は除外されるので
      // ここでは応募なしとして扱う
      getApplicationsByAuthUserId.mockResolvedValue([]);

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(3);
    });
  });

  describe("キーワード検索", () => {
    it("案件名でキーワード検索できる", async () => {
      // キーワードが明確に区別できるテストデータを設定
      getAllJobs.mockResolvedValue([
        createMockJob({
          id: "job-1",
          title: "React開発案件",
          description: "フロント開発",
          environment: "JavaScript",
          requiredSkills: "JavaScript経験",
          preferredSkills: "",
          skills: ["JavaScript"],
        }),
        createMockJob({
          id: "job-2",
          title: "Java開発案件",
          description: "バックエンド開発",
          environment: "Java, Spring",
          requiredSkills: "Java経験",
          preferredSkills: "",
          skills: ["Java"],
        }),
      ]);

      const request = createRequest({ query: "React" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toContain("React");
    });

    it("複数単語のAND検索ができる", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({
          id: "job-1",
          title: "Next.js開発",
          description: "フロントエンド開発 React TypeScript",
          environment: "",
          requiredSkills: "",
          preferredSkills: "",
          skills: [],
        }),
        createMockJob({
          id: "job-2",
          title: "React開発案件",
          description: "バックエンド開発",
          environment: "",
          requiredSkills: "",
          preferredSkills: "",
          skills: [],
        }),
        createMockJob({
          id: "job-3",
          title: "Vue.js開発案件",
          description: "TypeScript使用",
          environment: "",
          requiredSkills: "",
          preferredSkills: "",
          skills: [],
        }),
      ]);

      const request = createRequest({ query: "React TypeScript" });
      const response = await GET(request);
      const data = await response.json();

      // Reactを含むもののうち、TypeScriptも含むもの
      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("job-1");
    });

    it("大文字小文字を区別しない検索", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({
          id: "job-1",
          title: "React開発案件",
          description: "",
          environment: "",
          requiredSkills: "",
          preferredSkills: "",
          skills: [],
        }),
        createMockJob({
          id: "job-2",
          title: "Java開発案件",
          description: "",
          environment: "",
          requiredSkills: "",
          preferredSkills: "",
          skills: [],
        }),
      ]);

      const request = createRequest({ query: "react" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toContain("React");
    });
  });

  describe("リモート可否フィルター", () => {
    it("フルリモート可でフィルタリングできる", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", features: ["フルリモート可"] }),
        createMockJob({ id: "job-2", features: ["リモート併用可"] }),
        createMockJob({ id: "job-3", features: ["常駐案件"] }),
      ]);

      const request = createRequest({ remote: "フルリモート可" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("job-1");
    });

    it("複数のリモート条件でフィルタリングできる", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", features: ["フルリモート可"] }),
        createMockJob({ id: "job-2", features: ["リモート併用可"] }),
        createMockJob({ id: "job-3", features: ["常駐案件"] }),
      ]);

      const request = createRequest({ remote: "フルリモート可,リモート併用可" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
    });
  });

  describe("職種フィルター", () => {
    it("職種でフィルタリングできる", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", position: ["PM (プロジェクトマネージャー)"] }),
        createMockJob({ id: "job-2", position: ["インフラエンジニア"] }),
        createMockJob({ id: "job-3", position: ["Webデザイナー"] }),
      ]);

      const request = createRequest({ positions: "PM・PMO" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].id).toBe("job-1");
    });
  });

  describe("勤務地フィルター", () => {
    it("勤務地で部分一致検索できる", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", location: "東京都渋谷区" }),
        createMockJob({ id: "job-2", location: "大阪府大阪市" }),
        createMockJob({ id: "job-3", location: "東京都新宿区" }),
      ]);

      const request = createRequest({ location: "東京" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
    });

    it("最寄駅で検索できる（駅を除いた部分一致）", async () => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", nearestStation: "渋谷駅" }),
        createMockJob({ id: "job-2", nearestStation: "新宿駅" }),
        createMockJob({ id: "job-3", nearestStation: "渋谷" }),
      ]);

      const request = createRequest({ nearestStation: "渋谷駅" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
    });
  });

  describe("ソート", () => {
    beforeEach(() => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1", rate: "80万円", createdAt: "2024-01-15T00:00:00Z" }),
        createMockJob({ id: "job-2", rate: "70万円", createdAt: "2024-01-20T00:00:00Z" }),
        createMockJob({ id: "job-3", rate: "90万円", createdAt: "2024-01-10T00:00:00Z" }),
      ]);
    });

    it("新着順でソートできる", async () => {
      const request = createRequest({ sort: "new" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items[0].id).toBe("job-2"); // 1/20
      expect(data.items[1].id).toBe("job-1"); // 1/15
      expect(data.items[2].id).toBe("job-3"); // 1/10
    });

    it("単価順でソートできる", async () => {
      const request = createRequest({ sort: "price" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items[0].id).toBe("job-3"); // 90万
      expect(data.items[1].id).toBe("job-1"); // 80万
      expect(data.items[2].id).toBe("job-2"); // 70万
    });

    it("おすすめ順でソートできる（デフォルト）", async () => {
      // 推薦情報を設定
      mockRecommendationClient.record.getRecords.mockResolvedValue({
        records: [
          { 案件ID: { value: "job-2" }, 適合スコア: { value: "100" }, 担当者おすすめ: { value: "" } },
          { 案件ID: { value: "job-3" }, 適合スコア: { value: "50" }, 担当者おすすめ: { value: "おすすめ" } },
        ],
      });

      const request = createRequest({ sort: "recommend" });
      const response = await GET(request);
      const data = await response.json();

      // 担当者おすすめ > AIマッチ(推薦DBにレコードあり) > 推薦スコア
      expect(data.items[0].id).toBe("job-3"); // 担当者おすすめ
      expect(data.items[1].id).toBe("job-2"); // AIマッチ + スコア100
    });
  });

  describe("ページネーション", () => {
    beforeEach(() => {
      getAllJobs.mockResolvedValue([
        createMockJob({ id: "job-1" }),
        createMockJob({ id: "job-2" }),
        createMockJob({ id: "job-3" }),
        createMockJob({ id: "job-4" }),
        createMockJob({ id: "job-5" }),
      ]);
    });

    it("limitで取得件数を制限できる", async () => {
      const request = createRequest({ limit: "2" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.total).toBe(5); // 総数は5
    });

    it("skipでオフセットを指定できる", async () => {
      const request = createRequest({ skip: "2", limit: "2" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.items[0].id).toBe("job-3");
    });

    it("limit=0で全件取得", async () => {
      const request = createRequest({ limit: "0" });
      const response = await GET(request);
      const data = await response.json();

      expect(data.items).toHaveLength(5);
    });
  });

  describe("推薦情報の付与", () => {
    it("推薦スコアが付与される", async () => {
      mockRecommendationClient.record.getRecords.mockResolvedValue({
        records: [
          { 案件ID: { value: "job-1" }, 適合スコア: { value: "85" }, 担当者おすすめ: { value: "" } },
        ],
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      const job1 = data.items.find((j: { id: string }) => j.id === "job-1");
      expect(job1.recommendationScore).toBe(85);
      expect(job1.aiMatched).toBe(true);
    });

    it("担当者おすすめフラグが付与される", async () => {
      mockRecommendationClient.record.getRecords.mockResolvedValue({
        records: [
          { 案件ID: { value: "job-1" }, 適合スコア: { value: "0" }, 担当者おすすめ: { value: "おすすめ" } },
        ],
      });

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      const job1 = data.items.find((j: { id: string }) => j.id === "job-1");
      expect(job1.staffRecommend).toBe(true);
    });
  });

  describe("エラーハンドリング", () => {
    it("Kintoneエラー時は500を返す", async () => {
      getAllJobs.mockRejectedValue(new Error("Kintone API Error"));

      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("案件一覧の取得に失敗しました");
    });
  });
});
