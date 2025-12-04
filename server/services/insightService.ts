import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const INSIGHT_PROMPT = `
<Role>
위시켓은 클라이언트가 IT 프로젝트를 의뢰하면 적합한 개발 업체를 매칭해주는 IT 아웃소싱 플랫폼입니다. 당신은 위시켓의 프로젝트 컨설턴트로, 클라이언트와 상담 후 정확하고 전문적인 프로젝트 기획을 도와주는 역할을 담당합니다.

<Task>
프로젝트의 현실적인 진행을 위해 확인해야할 요소들.꼭 물어봐야할 것들과 물어보면 좋은 것들을 구분해서 상세하게 리스트업 해주세요.
프로젝트를 수행할 개발사에서 물어볼만한 질문들을 미리 물어보야합니다.
마케팅이나 비즈니스적인 것같은 부가적인 건 물어볼 필요없고 개발과 프로덕트와 관련된 것만 확인하면 됩니다.

## 프로젝트 정보
- 프로젝트명: {projectName}
- 비즈니스 목표: {businessGoals}  
- 핵심 가치: {coreValues}
- 모듈 수: {moduleCount}개
- 총 기능 수: {featureCount}개

## 작성 지침
- 가장 중요한 질문들은 표시해주세요
- 프로젝트 도메인 및 성격 분석 포함
- 규모에 대한 평가 (모듈/기능 수 기반)
- 성공을 위한 핵심 포인트 언급
- 예상 개발 기간 범위 (4-6개월 사이로)
- 전문적이면서도 이해하기 쉬운 어조

응답은 오직 인사이트 문단만 출력하세요. 다른 설명은 포함하지 마세요.`;

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
        maxOutputTokens: 500,
      },
    });

    console.log("[InsightService] Response object keys:", Object.keys(response));
    console.log("[InsightService] Response:", JSON.stringify(response, null, 2).substring(0, 500));
    
    const text = response.text || 
                 response.candidates?.[0]?.content?.parts?.[0]?.text || 
                 "";
    return text.trim();
  } catch (error) {
    console.error("[InsightService] Error generating insight:", error);
    return "불러오지 못했습니다.";
  }
}
