/**
 * 管理者用 案件一覧取得API
 * GET /api/admin/jobs
 */

import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createJobClient, getAppIds } from "@/lib/kintone/client";
import { JOB_FIELDS } from "@/lib/kintone/fieldMapping";

type JobRecord = {
  $id: { value: string };
  案件ID: { value: string };
  案件名: { value: string };
  職種_ポジション: { value: string[] };
  スキル: { value: string[] };
  案件特徴: { value: string[] };
  勤務地エリア: { value: string };
  掲載単価: { value: string };
  概要: { value: string };
};

export const GET = async () => {
  try {
    // 認証チェック
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const client = createJobClient();
    const appIds = getAppIds();

    // 案件一覧を取得
    const response = await client.record.getAllRecords({
      app: appIds.job,
      fields: [
        "$id",
        JOB_FIELDS.JOB_ID,
        JOB_FIELDS.TITLE,
        JOB_FIELDS.POSITION,
        JOB_FIELDS.SKILLS,
        JOB_FIELDS.FEATURES,
        JOB_FIELDS.LOCATION,
        JOB_FIELDS.RATE,
        JOB_FIELDS.DESCRIPTION,
      ],
    });

    // フロントエンド用に整形
    const jobs = (response as unknown as JobRecord[]).map((record) => ({
      id: record.$id.value,
      jobId: record.案件ID?.value || record.$id.value,
      title: record.案件名?.value || "(案件名なし)",
      positions: record.職種_ポジション?.value || [],
      skills: record.スキル?.value || [],
      features: record.案件特徴?.value || [],
      location: record.勤務地エリア?.value || "",
      rate: record.掲載単価?.value || "",
      description: record.概要?.value || "",
    }));

    return NextResponse.json({ jobs, total: jobs.length });
  } catch (error) {
    console.error("案件一覧取得エラー:", error);
    return NextResponse.json(
      { error: "案件一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
};

