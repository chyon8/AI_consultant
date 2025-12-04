import * as geminiService from './geminiService';
import * as rfpService from './rfpService';
import * as chatService from './chatService';
import { classifyUserIntent, extractProjectContext } from './chatService';
import * as insightService from './insightService';
import * as claudeService from './claudeService';

type Provider = 'google' | 'anthropic';

function getProviderFromModelId(modelId: string): Provider {
  if (modelId.startsWith('claude')) {
    return 'anthropic';
  }
  return 'google';
}

export async function analyzeProject(
  userInput: string,
  fileContents: string[],
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  const effectiveModelId = modelId || 'gemini-2.5-flash';
  const provider = getProviderFromModelId(effectiveModelId);
  
  console.log(`[aiRouter] analyzeProject - provider: ${provider}, model: ${effectiveModelId}`);
  
  if (provider === 'anthropic') {
    if (!claudeService.isClaudeConfigured()) {
      throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
    }
    return claudeService.analyzeProject(userInput, fileContents, onChunk, effectiveModelId);
  }
  
  return geminiService.analyzeProject(userInput, fileContents, onChunk, effectiveModelId);
}

interface ModuleInfo {
  name: string;
  isSelected: boolean;
  subFeatures: { name: string; isSelected: boolean }[];
}

export async function generateRFP(
  modules: ModuleInfo[],
  summary: string,
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  const effectiveModelId = modelId || 'gemini-2.5-flash';
  const provider = getProviderFromModelId(effectiveModelId);
  
  console.log(`[aiRouter] generateRFP - provider: ${provider}, model: ${effectiveModelId}`);
  
  if (provider === 'anthropic') {
    if (!claudeService.isClaudeConfigured()) {
      throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
    }
    return claudeService.generateRFP(modules, summary, onChunk, effectiveModelId);
  }
  
  return rfpService.generateRFP(modules, summary, onChunk, effectiveModelId);
}

export interface InsightParams {
  projectName: string;
  businessGoals: string;
  coreValues: string[];
  moduleCount: number;
  featureCount: number;
}

export async function generateInsight(params: InsightParams, modelId?: string): Promise<string> {
  const effectiveModelId = modelId || 'gemini-2.5-flash';
  const provider = getProviderFromModelId(effectiveModelId);
  
  console.log(`[aiRouter] generateInsight - provider: ${provider}, model: ${effectiveModelId}`);
  
  if (provider === 'anthropic') {
    if (!claudeService.isClaudeConfigured()) {
      throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY.');
    }
    return claudeService.generateInsight(params, effectiveModelId);
  }
  
  return insightService.generateInsight(params, effectiveModelId);
}

interface Message {
  role: string;
  text: string;
}

interface SubFeature {
  id: string;
  name: string;
  price: number;
  manWeeks: number;
  isSelected: boolean;
}

interface ModuleItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseManMonths: number;
  category: string;
  isSelected: boolean;
  required?: boolean;
  subFeatures: SubFeature[];
}

export interface ChatModelSettings {
  classifyUserIntent?: string;
  streamChatResponse?: string;
}

export async function streamChatResponse(
  history: Message[],
  currentModules: ModuleItem[],
  onChunk: (text: string) => void,
  modelSettings?: ChatModelSettings
): Promise<void> {
  const streamModel = modelSettings?.streamChatResponse || 'gemini-2.5-flash';
  const provider = getProviderFromModelId(streamModel);
  
  console.log(`[aiRouter] streamChatResponse - provider: ${provider}, model: ${streamModel}`);
  
  if (provider === 'anthropic') {
    if (!claudeService.isClaudeConfigured()) {
      onChunk("<CHAT>\nAnthropic API Key가 설정되지 않았습니다. ANTHROPIC_API_KEY 환경 변수를 설정해주세요.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
      return;
    }
    
    const lastUserMessage = history[history.length - 1];
    const projectContext = extractProjectContext(currentModules);
    
    console.log('[aiRouter] Running context lock validation for Claude...');
    const contextValidation = await classifyUserIntent(
      lastUserMessage.text,
      projectContext,
      modelSettings?.classifyUserIntent
    );
    
    console.log('[aiRouter] Context lock judgment:', contextValidation.judgment);
    
    if (contextValidation.shouldBlock) {
      onChunk(contextValidation.refusalMessage!);
      return;
    }
    
    return claudeService.streamChatResponse(history, currentModules, onChunk, modelSettings);
  }
  
  return chatService.streamChatResponse(history, currentModules, onChunk, modelSettings);
}

export function isProviderConfigured(provider: Provider): boolean {
  if (provider === 'anthropic') {
    return claudeService.isClaudeConfigured();
  }
  return !!process.env.GEMINI_API_KEY;
}

export function getConfiguredProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.GEMINI_API_KEY) providers.push('google');
  if (claudeService.isClaudeConfigured()) providers.push('anthropic');
  return providers;
}
