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

export interface StaffingDetail {
  role: string;
  grade: string;
  headcount: number | string;
  duration: string;
  manMonth: number | string;
}

export interface WBSPhase {
  phase: string;
  task: string;
  duration: string;
  schedule: number[];
}

export interface ParsedTypeEstimate {
  minCost: number;
  maxCost: number;
  duration: string;
  totalManMonths?: number;
  teamSize?: number;
  analysis?: string;
  staffing?: StaffingDetail[];
  costBasis?: string;
  characteristics?: string[];
}

export interface WBSDetail {
  phases: WBSPhase[];
  totalDuration: string;
  timeUnit: 'week' | 'month';
  partnerAdvice?: {
    recommendedType: string;
    reason: string;
  };
}

export interface ParsedEstimates {
  typeA: ParsedTypeEstimate;
  typeB: ParsedTypeEstimate;
  typeC: ParsedTypeEstimate;
  wbs?: WBSDetail;
}

export interface VisualizationHints {
  layout: 'single' | 'two-column' | 'grid';
  primaryComponent: string;
  components: {
    type: string;
    title?: string;
    source: string;
    config?: Record<string, any>;
  }[];
}

export interface ParsedAnalysisResult {
  projectTitle: string;
  modules: ParsedModule[];
  estimates: ParsedEstimates;
  rawMarkdown: string;
  raw_content?: string;
  format_type?: 'markdown' | 'json' | 'mixed';
  visualization_hints?: VisualizationHints;
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
  onComplete?: (result: ParsedAnalysisResult | null, userInput: string) => void,
  onError?: (error: string) => void
): Promise<ParsedAnalysisResult | null> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, fileContents }),
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
          
          console.log('🔴 [DEBUG: Raw AI Response - Client SSE]');
          console.log(JSON.stringify({
            rawData: data,
            hasRawContent: !!data.parsed.raw_content,
            rawMarkdownLength: data.parsed.rawMarkdown?.length || 0
          }, null, 2));
          
          console.log('🟢 [DEBUG: Processed Data - Client Parsed]');
          console.log(JSON.stringify({
            projectTitle: data.parsed.projectTitle,
            modules: data.parsed.modules,
            estimates: data.parsed.estimates
          }, null, 2));
          
          parsedResult = data.parsed;
          if (onComplete) {
            onComplete(parsedResult, text);
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
          onComplete(parsedResult, text);
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
  onError?: (error: string) => void
): Promise<void> {
  const response = await fetch('/api/rfp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ modules, summary }),
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

export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export interface ChatContext {
  modules: ParsedModule[];
  partnerType: string;
  currentScale: string;
  estimates?: {
    typeA?: { minCost: number; maxCost: number; duration: string };
    typeB?: { minCost: number; maxCost: number; duration: string };
    typeC?: { minCost: number; maxCost: number; duration: string };
  };
}

export interface ChatAction {
  type: string;
  payload: Record<string, any>;
}

export interface ChatResult {
  chatMessage: string;
  action?: ChatAction;
}

export async function sendChatMessage(
  message: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[],
  context: ChatContext,
  onChunk: (chunk: string) => void,
  onComplete?: (result: ChatResult) => void,
  onError?: (error: string) => void
): Promise<ChatResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, conversationHistory, context }),
  });

  if (!response.ok) {
    throw new Error('Chat request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let result: ChatResult = { chatMessage: '' };
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
        
        const data = JSON.parse(jsonStr);
        
        if (data.chunk) {
          onChunk(data.chunk);
        }
        
        if (data.done) {
          result = {
            chatMessage: data.chatMessage,
            action: data.action
          };
          if (onComplete) {
            onComplete(result);
          }
        }
        
        if (data.error) {
          console.error('[Chat] SSE error:', data.error);
          if (onError) {
            onError(data.error);
          }
          throw new Error(data.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Chat')) {
          throw e;
        }
        console.warn('[Chat] JSON parse warning:', e);
      }
    }
  }

  if (buffer.trim() && buffer.startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.slice(6).trim());
      if (data.done) {
        result = {
          chatMessage: data.chatMessage,
          action: data.action
        };
        if (onComplete) {
          onComplete(result);
        }
      }
    } catch (e) {
      console.warn('[Chat] Final buffer parse failed:', e);
    }
  }

  return result;
}
