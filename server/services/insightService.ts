import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const INSIGHT_PROMPT = `당신은 IT 프로젝트 분석 전문가입니다. 주어진 프로젝트 정보를 바탕으로 간결하고 전문적인 인사이트를 2-3문장으로 작성해주세요.

## 프로젝트 정보
- 프로젝트명: {projectName}
- 비즈니스 목표: {businessGoals}  
- 핵심 가치: {coreValues}
- 모듈 수: {moduleCount}개
- 총 기능 수: {featureCount}개

## 작성 지침
- 프로젝트 도메인 및 성격 분석 포함
- 규모에 대한 평가 (모듈/기능 수 기반)
- 성공을 위한 핵심 포인트 1가지 언급
- 예상 개발 기간 범위 (파트너 유형에 따라 4-6개월)
- 전문적이면서도 이해하기 쉬운 어조
- 마크다운 없이 순수 텍스트로만 작성

응답은 오직 2-3문장의 인사이트 문단만 출력하세요. 다른 설명이나 제목은 포함하지 마세요.`;

export interface InsightParams {
  projectName: string;
  businessGoals: string;
  coreValues: string[];
  moduleCount: number;
  featureCount: number;
}

export async function generateInsight(params: InsightParams): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const text = response.text || "";
    return text.trim();
  } catch (error) {
    console.error("[InsightService] Error generating insight:", error);
    return `본 프로젝트는 ${params.moduleCount}개 모듈과 ${params.featureCount}개 기능으로 구성된 프로젝트입니다. 파트너 유형에 따라 4~6개월의 개발 기간이 예상됩니다.`;
  }
}
