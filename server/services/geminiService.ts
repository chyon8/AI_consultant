import { GoogleGenAI } from '@google/genai';
import { PART1_PROMPT } from '../prompts/analysis';

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
      temperature: 0.7,
      maxOutputTokens: 16000
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      onChunk(text);
    }
  }
}
