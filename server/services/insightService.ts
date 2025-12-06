import { GoogleGenAI } from "@google/genai";
import { INSIGHT_PROMPT } from "../prompts/analysis";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export interface InsightParams {
  projectName: string;
  businessGoals: string;
  coreValues: string[];
  moduleCount: number;
  featureCount: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

export async function generateInsight(params: InsightParams, modelId?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelId || DEFAULT_MODEL;
  
  console.log('[insightService] generateInsight using model:', model);

  const prompt = INSIGHT_PROMPT.replace(
    "{projectName}",
    params.projectName || "미정",
  )
    .replace("{businessGoals}", params.businessGoals || "미정")
    .replace("{coreValues}", params.coreValues.join(", ") || "미정")
    .replace("{moduleCount}", String(params.moduleCount))
    .replace("{featureCount}", String(params.featureCount));

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8000,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    // 전체 response 구조 디버깅
    console.log(
      "[InsightService] Full response:",
      JSON.stringify(response, null, 2).substring(0, 1500),
    );

    // 여러 경로 시도
    const text =
      response.text ??
      (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
      "";
    console.log("[InsightService] Extracted text length:", text.length);

    return text.trim();
  } catch (error) {
    console.error("[InsightService] Error generating insight:", error);
    return "오류입니다. 다시 시도해주세요.";
  }
}
