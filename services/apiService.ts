export interface ParsedSubFeature {
  id: string;
  name: string;
  price: number;
  manWeeks: number;
  isSelected: boolean;
}

export interface ParsedModule {
  id: string;
  name: string;
  description: string;
  category: string;
  baseCost: number;
  baseManMonths: number;
  isSelected: boolean;
  required?: boolean;
  subFeatures: ParsedSubFeature[];
}

export interface ParsedEstimates {
  typeA: { minCost: number; maxCost: number; duration: string };
  typeB: { minCost: number; maxCost: number; duration: string };
  typeC: { minCost: number; maxCost: number; duration: string };
}

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  rawMarkdown: string;
}

export interface AnalyzeResponse {
  chunk?: string;
  done?: boolean;
  parsed?: ParsedAnalysisResult | null;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  files?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
  }[];
  error?: string;
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function analyzeProject(
  text: string,
  fileContents: string[],
  onChunk: (chunk: string) => void,
  onComplete?: (result: ParsedAnalysisResult | null) => void,
  onError?: (error: string) => void,
  modelId?: string
): Promise<ParsedAnalysisResult | null> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, fileContents, modelId }),
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let parsedResult: ParsedAnalysisResult | null = null;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      
      try {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        
        const data: AnalyzeResponse = JSON.parse(jsonStr);
        
        if (data.chunk) {
          onChunk(data.chunk);
        }
        
        if (data.done && data.parsed) {
          console.log('[FE] Received parsed data:', {
            projectTitle: data.parsed.projectTitle,
            modulesCount: data.parsed.modules?.length || 0
          });
          parsedResult = data.parsed;
          if (onComplete) {
            onComplete(parsedResult);
          }
        }
        
        if (data.error) {
          console.error('[FE] SSE error:', data.error);
          if (onError) {
            onError(data.error);
          }
          throw new Error(data.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Analysis')) {
          throw e;
        }
        console.warn('[FE] JSON parse warning:', e);
      }
    }
  }

  if (buffer.trim() && buffer.startsWith('data: ')) {
    try {
      const data: AnalyzeResponse = JSON.parse(buffer.slice(6).trim());
      if (data.done && data.parsed) {
        console.log('[FE] Final buffer parsed data:', {
          projectTitle: data.parsed.projectTitle,
          modulesCount: data.parsed.modules?.length || 0
        });
        parsedResult = data.parsed;
        if (onComplete) {
          onComplete(parsedResult);
        }
      }
    } catch (e) {
      console.warn('[FE] Final buffer parse failed:', e);
    }
  }

  console.log('[FE] analyzeProject returning:', parsedResult ? 'data' : 'null');
  return parsedResult;
}

export async function generateRFP(
  modules: any[],
  summary: string,
  onChunk: (chunk: string) => void,
  onError?: (error: string) => void,
  modelId?: string
): Promise<void> {
  const response = await fetch('/api/rfp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ modules, summary, modelId }),
  });

  if (!response.ok) {
    throw new Error('RFP generation failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) {
          onChunk(data.chunk);
        }
        if (data.error) {
          if (onError) {
            onError(data.error);
          }
          throw new Error(data.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'RFP generation failed') {
          if (onError) {
            throw e;
          }
        }
      }
    }
  }
}

const TEXT_FILE_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx'];
const IMAGE_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_CONTENT_LENGTH = 50000;

export function isTextFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return TEXT_FILE_EXTENSIONS.includes(ext);
}

export async function readFileContent(file: File): Promise<string> {
  if (!isTextFile(file)) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (IMAGE_FILE_EXTENSIONS.includes('.' + ext)) {
      return `[이미지 파일: ${file.name} (${Math.round(file.size / 1024)}KB)]`;
    }
    return `[파일: ${file.name}]`;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      let content = reader.result as string;
      if (content.length > MAX_FILE_CONTENT_LENGTH) {
        content = content.substring(0, MAX_FILE_CONTENT_LENGTH) + 
          `\n\n... [내용이 너무 길어 ${MAX_FILE_CONTENT_LENGTH}자로 잘렸습니다. 원본 크기: ${content.length}자]`;
      }
      resolve(content);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
