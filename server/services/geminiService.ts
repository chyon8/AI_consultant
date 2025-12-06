import { GoogleGenAI } from '@google/genai';
import { PART1_PROMPT, ASSISTANT_PROMPT } from '../prompts/analysis';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface FileData {
  type: 'text' | 'image';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

const DEFAULT_MODEL = 'gemini-3-pro-preview';

export async function analyzeProject(
  userInput: string,
  fileDataList: FileData[],
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelId || DEFAULT_MODEL;
  
  console.log('[geminiService] analyzeProject using model:', model);
  console.log('[geminiService] fileDataList count:', fileDataList?.length || 0);

  const parts: any[] = [];
  
  parts.push({ text: PART1_PROMPT + '\n\n---\n\n사용자 입력:\n' + userInput });
  
  if (fileDataList && fileDataList.length > 0) {
    for (let i = 0; i < fileDataList.length; i++) {
      const fileData = fileDataList[i];
      
      if (fileData.type === 'image' && fileData.base64) {
        console.log(`[geminiService] Adding image: ${fileData.name} (${fileData.mimeType})`);
        parts.push({ text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType || 'image/jpeg',
            data: fileData.base64
          }
        });
      } else if (fileData.type === 'text' && fileData.content) {
        console.log(`[geminiService] Adding text file: ${fileData.name}`);
        parts.push({ text: `\n\n--- 첨부파일 ${i + 1}: ${fileData.name} ---\n${fileData.content}` });
      }
    }
  }

  const response = await ai.models.generateContentStream({
    model: model,
    contents: [
      { role: 'user', parts: parts }
    ],
    config: {
      temperature: 1.0,
      thinkingConfig: {
        thinkingBudget: 8000
      }
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      onChunk(text);
    }
  }
}

export interface InsightParams {
  projectName: string;
  businessGoals: string;
  coreValues: string[];
  moduleCount: number;
  featureCount: number;
}

export async function generateInsight(params: InsightParams, modelId?: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelId || DEFAULT_MODEL;
  
  console.log('[geminiService] generateInsight using model:', model);

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
      "[geminiService] generateInsight response:",
      JSON.stringify(response, null, 2).substring(0, 1500),
    );

    const text =
      response.text ??
      (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
      "";
    console.log("[geminiService] Extracted text length:", text.length);

    return text.trim();
  } catch (error) {
    console.error("[geminiService] Error generating insight:", error);
    return JSON.stringify({ error: "오류입니다. 다시 시도해주세요." });
  }
}
