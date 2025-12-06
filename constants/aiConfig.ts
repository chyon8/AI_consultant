export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'anthropic';
}

export interface AIFunctionConfig {
  file: string;
  functionName: string;
  defaultModel: string;
  promptVar: string;
  description: string;
}

export const AI_AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Fast)',
    provider: 'google'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'google'
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5 (Fast)',
    provider: 'anthropic'
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic'
  }
];

export const AI_FUNCTION_MAP: AIFunctionConfig[] = [
  {
    file: 'geminiService.ts',
    functionName: 'analyzeProject',
    defaultModel: 'gemini-3-pro-preview',
    promptVar: 'PART1_PROMPT',
    description: '프로젝트 분석 및 모듈 구조화'
  },
  {
    file: 'rfpService.ts',
    functionName: 'generateRFP',
    defaultModel: 'gemini-3-pro-preview',
    promptVar: 'PART2_PROMPT',
    description: '입찰 공고문(RFP) 생성'
  },
  {
    file: 'chatService.ts',
    functionName: 'classifyUserIntent',
    defaultModel: 'gemini-2.5-flash',
    promptVar: 'CONTEXT_CLASSIFIER_PROMPT',
    description: '사용자 의도 분류 (컨텍스트 락)'
  },
  {
    file: 'chatService.ts',
    functionName: 'streamChatResponse',
    defaultModel: 'gemini-2.5-flash',
    promptVar: 'CHAT_SYSTEM_PROMPT',
    description: '채팅 응답 생성'
  },
  {
    file: 'insightService.ts',
    functionName: 'generateInsight',
    defaultModel: 'gemini-3-pro-preview',
    promptVar: 'ASSISTANT_PROMPT',
    description: '프로젝트 인사이트 생성'
  }
];

export type AIModelSettings = Record<string, string>;

export function getDefaultModelSettings(): AIModelSettings {
  const settings: AIModelSettings = {};
  AI_FUNCTION_MAP.forEach(func => {
    settings[func.functionName] = func.defaultModel;
  });
  return settings;
}
