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
  
  // User input as user message (system prompt is separate)
  const userMessage = '사용자 입력:\n' + userInput;
  parts.push({ text: userMessage });
  
  console.log('='.repeat(80));
  console.log('[geminiService] SYSTEM PROMPT:');
  console.log('='.repeat(80));
  console.log(PART1_PROMPT);
  console.log('='.repeat(80));
  console.log('[geminiService] USER INPUT:');
  console.log('='.repeat(80));
  console.log(userMessage);
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
      systemInstruction: PART1_PROMPT,
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

  // User input only (original content)
  const userMessage = params.originalInput || "없음";
  
  console.log('='.repeat(80));
  console.log('[geminiService] INSIGHT - SYSTEM PROMPT:');
  console.log('='.repeat(80));
  console.log(ASSISTANT_PROMPT);
  console.log('='.repeat(80));
  console.log('[geminiService] INSIGHT - USER INPUT:');
  console.log('='.repeat(80));
  console.log(userMessage);
  console.log('='.repeat(80));

  try {
    const isThinkingModel = model.includes('thinking') || model.includes('gemini-3');
    const config: any = {
      systemInstruction: ASSISTANT_PROMPT,
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
      contents: userMessage,
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
