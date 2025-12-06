import { GoogleGenAI } from "@google/genai";
import { ASSISTANT_PROMPT } from "../prompts/analysis";

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

  const contextInfo = `
# 클라이언트 요구사항 컨텍스트
- 프로젝트명: ${params.projectName || "미정"}
- 비즈니스 목표: ${params.businessGoals || "미정"}
- 핵심 가치: ${params.coreValues.join(", ") || "미정"}
- 모듈 수: ${params.moduleCount}개
- 기능 수: ${params.featureCount}개

위 정보를 기반으로 분석해주세요.
`;

  const prompt = ASSISTANT_PROMPT + contextInfo;

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

    console.log(
      "[InsightService] Full response:",
      JSON.stringify(response, null, 2).substring(0, 1500),
    );

    const text =
      response.text ??
      (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
      "";
    console.log("[InsightService] Extracted text length:", text.length);

    return text.trim();
  } catch (error) {
    console.error("[InsightService] Error generating insight:", error);
    return JSON.stringify({ error: "오류입니다. 다시 시도해주세요." });
  }
}
