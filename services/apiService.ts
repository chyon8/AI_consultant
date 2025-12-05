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

export interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
  wordCount?: number;
}

export interface UploadedFileInfo {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: 'image' | 'document';
  mimeType: string;
  url: string;
  extraction?: ExtractionResult;
}

export interface UploadResponse {
  success: boolean;
  files?: UploadedFileInfo[];
  error?: {
    code: string;
    message: string;
    fileName?: string;
    details?: string;
  };
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
  fileDataList: FileData[],
  onChunk: (chunk: string) => void,
  onComplete?: (result: ParsedAnalysisResult | null) => void,
  onError?: (error: string) => void,
  modelId?: string,
  abortSignal?: AbortSignal
): Promise<ParsedAnalysisResult | null> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, fileDataList, modelId }),
    signal: abortSignal,
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

  try {
    while (true) {
      if (abortSignal?.aborted) {
        await reader.cancel();
        throw new DOMException('Aborted', 'AbortError');
      }
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
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      console.log('[FE] Analysis aborted by user');
      return null;
    }
    throw e;
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
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export interface FileData {
  type: 'text' | 'image';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

export function isTextFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return TEXT_FILE_EXTENSIONS.includes(ext);
}

export function isImageFile(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return IMAGE_FILE_EXTENSIONS.includes(ext);
}

export async function readFileAsData(file: File): Promise<FileData> {
  if (isImageFile(file)) {
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        type: 'text',
        name: file.name,
        content: `[이미지 파일이 너무 큽니다: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB). 최대 4MB까지 지원합니다.]`
      };
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve({
          type: 'image',
          name: file.name,
          base64: base64,
          mimeType: file.type || 'image/jpeg'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  if (isTextFile(file)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let content = reader.result as string;
        if (content.length > MAX_FILE_CONTENT_LENGTH) {
          content = content.substring(0, MAX_FILE_CONTENT_LENGTH) + 
            `\n\n... [내용이 너무 길어 ${MAX_FILE_CONTENT_LENGTH}자로 잘렸습니다. 원본 크기: ${content.length}자]`;
        }
        resolve({
          type: 'text',
          name: file.name,
          content: content
        });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  
  return {
    type: 'text',
    name: file.name,
    content: `[지원하지 않는 파일 형식: ${file.name}]`
  };
}

export async function readFileContent(file: File): Promise<string> {
  const data = await readFileAsData(file);
  if (data.type === 'image') {
    return `[이미지: ${data.name}]`;
  }
  return data.content || `[파일: ${data.name}]`;
}

export function convertUploadedFilesToFileData(uploadedFiles: UploadedFileInfo[]): FileData[] {
  return uploadedFiles.map(file => {
    if (file.extraction?.success && file.extraction.text) {
      return {
        type: 'text' as const,
        name: file.originalName,
        content: file.extraction.text,
        mimeType: file.mimeType
      };
    }
    
    if (file.type === 'image') {
      return {
        type: 'text' as const,
        name: file.originalName,
        content: `[이미지 파일: ${file.originalName}]`,
        mimeType: file.mimeType
      };
    }
    
    return {
      type: 'text' as const,
      name: file.originalName,
      content: `[파일: ${file.originalName}]`,
      mimeType: file.mimeType
    };
  });
}

export async function uploadAndExtractFiles(files: File[]): Promise<{
  uploadResponse: UploadResponse;
  fileDataList: FileData[];
}> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const uploadResponse: UploadResponse = await response.json();
  
  if (!uploadResponse.success || !uploadResponse.files) {
    return { uploadResponse, fileDataList: [] };
  }
  
  const fileDataList: FileData[] = [];
  
  for (const uploadedFile of uploadResponse.files) {
    if (uploadedFile.extraction?.success && uploadedFile.extraction.text) {
      fileDataList.push({
        type: 'text',
        name: uploadedFile.originalName,
        content: uploadedFile.extraction.text,
        mimeType: uploadedFile.mimeType
      });
    } else if (uploadedFile.type === 'image') {
      const originalFile = files.find(f => f.name === uploadedFile.originalName);
      if (originalFile && originalFile.size <= MAX_IMAGE_SIZE) {
        const imageData = await readFileAsData(originalFile);
        if (imageData.type === 'image') {
          fileDataList.push(imageData);
        }
      } else {
        fileDataList.push({
          type: 'text',
          name: uploadedFile.originalName,
          content: `[이미지 파일이 너무 큽니다: ${uploadedFile.originalName}]`
        });
      }
    } else if (uploadedFile.extraction && !uploadedFile.extraction.success) {
      fileDataList.push({
        type: 'text',
        name: uploadedFile.originalName,
        content: `[파일 텍스트 추출 실패: ${uploadedFile.originalName}] ${uploadedFile.extraction.error || ''}`
      });
    } else {
      fileDataList.push({
        type: 'text',
        name: uploadedFile.originalName,
        content: `[첨부 파일: ${uploadedFile.originalName}]`
      });
    }
  }
  
  return { uploadResponse, fileDataList };
}
