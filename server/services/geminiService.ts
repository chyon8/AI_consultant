import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { PART1_PROMPT, ASSISTANT_PROMPT } from '../prompts/analysis';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface FileData {
  type: 'text' | 'image' | 'document';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
  filePath?: string;
}

const DEFAULT_MODEL = 'gemini-3-pro-preview';

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function getMimeType(filePath: string, providedMimeType?: string): string {
  if (providedMimeType) return providedMimeType;
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_MIME_TYPES[ext] || 'application/octet-stream';
}

async function uploadFileToGemini(ai: GoogleGenAI, filePath: string, mimeType: string): Promise<{ uri: string; mimeType: string } | null> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[geminiService] File not found: ${filePath}`);
      return null;
    }

    console.log(`[geminiService] Uploading file to Gemini: ${filePath} (${mimeType})`);
    
    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: { mimeType }
    });

    if (!uploadedFile.uri) {
      console.error(`[geminiService] Upload failed - no URI returned`);
      return null;
    }

    console.log(`[geminiService] File uploaded successfully: ${uploadedFile.name} -> ${uploadedFile.uri}`);
    return { uri: uploadedFile.uri, mimeType: uploadedFile.mimeType || mimeType };
  } catch (error: any) {
    console.error(`[geminiService] Error uploading file:`, error.message);
    return null;
  }
}

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
  
  const fullPromptText = PART1_PROMPT + '\n\n---\n\n사용자 입력:\n' + userInput;
  parts.push({ text: fullPromptText });
  
  console.log('='.repeat(80));
  console.log('[geminiService] FULL PROMPT INPUT:');
  console.log('='.repeat(80));
  console.log(fullPromptText);
  console.log('='.repeat(80));
  
  if (fileDataList && fileDataList.length > 0) {
    for (let i = 0; i < fileDataList.length; i++) {
      const fileData = fileDataList[i];
      
      if (fileData.type === 'image' && fileData.base64) {
        console.log(`[geminiService] Adding inline image: ${fileData.name} (${fileData.mimeType})`);
        parts.push({ text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType || 'image/jpeg',
            data: fileData.base64
          }
        });
      } else if (fileData.type === 'image' && fileData.filePath) {
        const mimeType = getMimeType(fileData.filePath, fileData.mimeType);
        const uploaded = await uploadFileToGemini(ai, fileData.filePath, mimeType);
        if (uploaded) {
          console.log(`[geminiService] Adding uploaded image: ${fileData.name}`);
          parts.push({ text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
          parts.push({
            fileData: {
              fileUri: uploaded.uri,
              mimeType: uploaded.mimeType
            }
          });
        } else if (fileData.base64) {
          console.log(`[geminiService] Fallback to inline image for: ${fileData.name}`);
          parts.push({ text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
          parts.push({
            inlineData: {
              mimeType: fileData.mimeType || 'image/jpeg',
              data: fileData.base64
            }
          });
        }
      } else if (fileData.type === 'document' && fileData.filePath) {
        const mimeType = getMimeType(fileData.filePath, fileData.mimeType);
        const uploaded = await uploadFileToGemini(ai, fileData.filePath, mimeType);
        if (uploaded) {
          console.log(`[geminiService] Adding uploaded document: ${fileData.name}`);
          parts.push({ text: `\n\n--- 첨부 문서 ${i + 1}: ${fileData.name} ---` });
          parts.push({
            fileData: {
              fileUri: uploaded.uri,
              mimeType: uploaded.mimeType
            }
          });
        } else if (fileData.content) {
          console.log(`[geminiService] Fallback to text content for: ${fileData.name}`);
          parts.push({ text: `\n\n--- 첨부파일 ${i + 1}: ${fileData.name} ---\n${fileData.content}` });
        }
      } else if (fileData.type === 'text' && fileData.content) {
        console.log(`[geminiService] Adding text content: ${fileData.name}`);
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
  originalInput: string;
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

## 원본 요구사항
${params.originalInput || "없음"}

위 정보를 기반으로 분석해주세요.
`;

  const prompt = ASSISTANT_PROMPT + contextInfo;

  try {
    const isThinkingModel = model.includes('thinking') || model.includes('gemini-3');
    const config: any = {
      temperature: isThinkingModel ? undefined : 0.7,
      maxOutputTokens: 8000,
    };
    if (isThinkingModel) {
      config.thinkingConfig = {
        thinkingBudget: 2048,
      };
    }
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config,
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
