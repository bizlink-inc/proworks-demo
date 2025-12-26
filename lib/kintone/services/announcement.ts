import { createAnnouncementClient, getAppIds } from "../client";
import type { AnnouncementRecord, Announcement } from "../types";

// kintoneレコードをフロントエンド用の型に変換
const convertAnnouncementRecord = (record: AnnouncementRecord): Announcement => {
  return {
    id: record.$id.value,
    type: record.掲載種別.value,
    startDate: record.掲載開始日.value,
    endDate: record.掲載終了日.value,
    content: record.通知内容.value,
  };
};

// お知らせ（掲載期間内のすべての掲載種別）を取得
export const getAnnouncements = async (): Promise<Announcement[]> => {
  const client = createAnnouncementClient();
  const appId = getAppIds().announcement;

  if (!appId) {
    console.error("❌ KINTONE_ANNOUNCEMENT_APP_ID が設定されていません");
    return [];
  }

  try {
    // 日本時間（JST）で今日の日付を取得
    const now = new Date();
    // JSTの日付を取得（Asia/Tokyoタイムゾーンを使用）
    const jstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, '0');
    const day = String(jstDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; // yyyy-MM-dd形式

    // 掲載開始日が今日以前かつ掲載終了日が今日以降のレコードを取得（掲載種別は問わない）
    const query = `掲載開始日 <= "${todayStr}" and 掲載終了日 >= "${todayStr}" order by 掲載開始日 desc, 掲載終了日 asc`;

    console.log("お知らせ取得クエリ:", query);
    console.log("今日の日付（JST）:", todayStr);

    // 条件部分とソート部分を分離（getAllRecordsはconditionにorder byを含められない）
    const condition = `掲載開始日 <= "${todayStr}" and 掲載終了日 >= "${todayStr}"`;
    const orderBy = `掲載開始日 desc, 掲載終了日 asc`;

    const records = await client.record.getAllRecords({
      app: appId,
      condition,
      orderBy,
    });

    console.log("お知らせ取得結果:", records.length, "件");

    // デバッグ: 取得されたレコードの詳細をログ出力
    if (records.length > 0) {
      console.log("取得されたレコード詳細:");
      records.forEach((record: any, index: number) => {
        console.log(`  [${index + 1}] レコード番号: ${record.$id.value}, 掲載種別: ${record.掲載種別.value}, 掲載開始日: ${record.掲載開始日.value}, 掲載終了日: ${record.掲載終了日.value}`);
      });
    } else {
      // デバッグ: クエリ条件を緩和して全件取得してみる
      console.log("デバッグ: 全件取得して確認中...");
      const allRecords = await client.record.getAllRecords({
        app: appId,
        orderBy: `掲載開始日 desc`,
      });
      console.log(`全件数: ${allRecords.length}件`);
      allRecords.forEach((record: any) => {
        console.log(`  レコード番号: ${record.$id.value}, 掲載種別: ${record.掲載種別.value}, 掲載開始日: ${record.掲載開始日.value}, 掲載終了日: ${record.掲載終了日.value}`);
      });
    }

    return records.map((record) => convertAnnouncementRecord(record as unknown as AnnouncementRecord));
  } catch (error) {
    console.error("お知らせの取得に失敗:", error);
    return [];
  }
};

