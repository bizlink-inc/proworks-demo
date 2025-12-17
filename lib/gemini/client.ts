/**
 * Gemini API クライアント
 * 
 * Google Gemini 2.0 Flash を使用したAIマッチング評価
 */

// APIキーは関数実行時に取得（スクリプトから dotenv でロードされる可能性に対応）
const getGeminiApiKey = (): string => {
  return process.env.GEMINI_API_KEY || "";
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export type AIMatchRequest = {
  // 案件情報
  job: {
    title: string;
    positions: string[];
    skills: string[];
    requiredSkills: string;
    preferredSkills: string;
    description: string;
    environment: string;
    notes: string;
  };
  // 人材情報
  talent: {
    name: string;
    positions: string[];
    skills: string;
    experience: string;
    desiredWork: string;
  };
};

export type AIMatchResult = {
  // 6項目のスコア（0-100）
  skillScore: number;       // 技術スキルマッチ
  processScore: number;     // 開発工程経験
  infraScore: number;       // インフラ/クラウドスキル
  domainScore: number;      // 業務知識・業界経験
  teamScore: number;        // チーム開発経験
  toolScore: number;        // ツール・開発環境
  // 総合スコア
  overallScore: number;
  // 評価結果テキスト（Markdown形式）
  resultText: string;
  // エラー情報
  error?: string;
};

/**
 * AIマッチングプロンプトを生成
 */
const generatePrompt = (request: AIMatchRequest): string => {
  const { job, talent } = request;
  
  return `あなたは熟練したIT系人材コンサルタントです。

以下の職務経歴情報に基づき、案件要件と照合して以下の観点からスキルマッチを厳しく定量評価してください。
各観点で100点満点で評価し、最後に総合マッチ率（平均値）を算出してください。
主観的な好印象ではなく、**記載情報に基づいた客観的な技術的マッチ度**のみを評価してください。

---

## 案件情報

**案件名**: ${job.title}
**職種・ポジション**: ${job.positions.join(", ") || "未設定"}
**必要スキル**: ${job.skills.join(", ") || "未設定"}
**必須スキル**: ${job.requiredSkills || "未設定"}
**尚可スキル**: ${job.preferredSkills || "未設定"}
**概要**: ${job.description || "未設定"}
**環境**: ${job.environment || "未設定"}
**備考**: ${job.notes || "未設定"}

---

## 人材情報

**氏名**: ${talent.name}
**職種**: ${talent.positions.join(", ") || "未設定"}
**スキル・言語**: ${talent.skills || "未設定"}
**主な実績・経歴**: ${talent.experience || "未設定"}
**希望案件・作業内容**: ${talent.desiredWork || "未設定"}

---

【評価カテゴリ】

1. 技術スキルマッチ（言語・フレームワーク）
　- 求められている開発言語、フレームワーク、ライブラリ等と人材の経験がどれだけ一致しているか。

2. 開発工程経験
　- 要件定義、基本設計、詳細設計、実装、テスト、運用保守など、どの工程をどのくらい経験しているか。

3. インフラ／クラウドスキル
　- AWS、Azure、GCP、オンプレミス等に関する知識と実務経験。

4. 業務知識・業界経験
　- 案件業界（例：金融、医療、製造、通信など）に関するドメイン知識や経験。

5. チーム開発経験・コミュニケーション
　- チーム規模、役割、コミュニケーション手段（Slack、Backlog等）の経験。

6. 使用ツール・開発環境
　- Git、Docker、CI/CD、Jiraなどの使用経験。

---

【出力フォーマット】

以下のJSON形式で出力してください。必ずJSONのみを出力し、他のテキストは含めないでください。

\`\`\`json
{
  "skillScore": 数値（0-100）,
  "processScore": 数値（0-100）,
  "infraScore": 数値（0-100）,
  "domainScore": 数値（0-100）,
  "teamScore": 数値（0-100）,
  "toolScore": 数値（0-100）,
  "overallScore": 数値（0-100、上記6項目の平均）,
  "evaluation": {
    "skillComment": "技術スキルマッチの評価理由",
    "processComment": "開発工程経験の評価理由",
    "infraComment": "インフラ/クラウドスキルの評価理由",
    "domainComment": "業務知識・業界経験の評価理由",
    "teamComment": "チーム開発経験の評価理由",
    "toolComment": "ツール・開発環境の評価理由",
    "strengths": "強みの要約",
    "weaknesses": "弱みの要約",
    "fitPoints": "案件に対して特にフィットしているポイント",
    "concerns": "懸念点"
  }
}
\`\`\``;
};

/**
 * JSON応答を解析してAIMatchResultに変換
 */
const parseResponse = (responseText: string, rawResponse: string): AIMatchResult => {
  try {
    // JSON部分を抽出
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    
    const parsed = JSON.parse(jsonStr);
    
    // 評価テキストを生成
    const resultText = `## スキルマッチ評価

### 1. 技術スキルマッチ（言語・FW）: ${parsed.skillScore}点 / 100点
${parsed.evaluation?.skillComment || "評価なし"}

### 2. 開発工程経験: ${parsed.processScore}点 / 100点
${parsed.evaluation?.processComment || "評価なし"}

### 3. インフラ／クラウドスキル: ${parsed.infraScore}点 / 100点
${parsed.evaluation?.infraComment || "評価なし"}

### 4. 業務知識・業界経験: ${parsed.domainScore}点 / 100点
${parsed.evaluation?.domainComment || "評価なし"}

### 5. チーム開発経験・コミュニケーション: ${parsed.teamScore}点 / 100点
${parsed.evaluation?.teamComment || "評価なし"}

### 6. ツール・開発環境: ${parsed.toolScore}点 / 100点
${parsed.evaluation?.toolComment || "評価なし"}

---

### 🎯 総合スキルマッチ度: ${parsed.overallScore}点 / 100点

### 📝 コメント・所見

**強み**: ${parsed.evaluation?.strengths || "なし"}

**弱み**: ${parsed.evaluation?.weaknesses || "なし"}

**フィットポイント**: ${parsed.evaluation?.fitPoints || "なし"}

**懸念点**: ${parsed.evaluation?.concerns || "なし"}`;

    return {
      skillScore: parsed.skillScore || 0,
      processScore: parsed.processScore || 0,
      infraScore: parsed.infraScore || 0,
      domainScore: parsed.domainScore || 0,
      teamScore: parsed.teamScore || 0,
      toolScore: parsed.toolScore || 0,
      overallScore: parsed.overallScore || 0,
      resultText,
    };
  } catch (error) {
    console.error("JSON解析エラー:", error);
    console.error("レスポンス:", responseText);
    
    return {
      skillScore: 0,
      processScore: 0,
      infraScore: 0,
      domainScore: 0,
      teamScore: 0,
      toolScore: 0,
      overallScore: 0,
      resultText: rawResponse,
      error: "AIレスポンスの解析に失敗しました",
    };
  }
};

/**
 * Gemini APIを呼び出してAIマッチング評価を実行
 */
export const executeAIMatch = async (request: AIMatchRequest): Promise<AIMatchResult> => {
  const prompt = generatePrompt(request);
  const GEMINI_API_KEY = getGeminiApiKey();
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // 低めに設定して一貫性を高める
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API エラー:", response.status, errorText);
      return {
        skillScore: 0,
        processScore: 0,
        infraScore: 0,
        domainScore: 0,
        teamScore: 0,
        toolScore: 0,
        overallScore: 0,
        resultText: "",
        error: `Gemini API エラー: ${response.status}`,
      };
    }

    const data = await response.json();
    
    // レスポンスからテキストを抽出
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!responseText) {
      return {
        skillScore: 0,
        processScore: 0,
        infraScore: 0,
        domainScore: 0,
        teamScore: 0,
        toolScore: 0,
        overallScore: 0,
        resultText: "",
        error: "Gemini APIからの応答が空です",
      };
    }

    return parseResponse(responseText, responseText);
    
  } catch (error) {
    console.error("Gemini API 呼び出しエラー:", error);
    return {
      skillScore: 0,
      processScore: 0,
      infraScore: 0,
      domainScore: 0,
      teamScore: 0,
      toolScore: 0,
      overallScore: 0,
      resultText: "",
      error: `API呼び出しエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
    };
  }
};

