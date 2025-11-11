import { config } from "dotenv";
config({ path: ".env.local" });

import { createTalentClient, getAppIds } from "../lib/kintone/client";

const checkTalent = async () => {
  const talentClient = createTalentClient();
  const appIds = getAppIds();

  const records = await talentClient.record.getRecords({
    app: appIds.talent,
    query: 'auth_user_id = "seed_user_001"',
  });

  console.log("人材DBのレコード:", JSON.stringify(records.records, null, 2));
};

checkTalent();

