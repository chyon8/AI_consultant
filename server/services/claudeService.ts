import Anthropic from '@anthropic-ai/sdk';
import { PART1_PROMPT, PART2_PROMPT, ASSISTANT_PROMPT } from '../prompts/analysis';
import { truncateFileContents } from '../utils/tokenLimit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const DEFAULT_MODEL = 'claude-opus-4-20250514';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null;

export function isClaudeConfigured(): boolean {
  return !!ANTHROPIC_API_KEY && !!anthropic;
}

export interface FileData {
  type: 'text' | 'image' | 'document';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
  filePath?: string;
}

export async function analyzeProject(
  userInput: string,
  fileDataList: FileData[],
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const model = modelId || DEFAULT_MODEL;
  console.log('[claudeService] analyzeProject using model:', model);
  console.log('[claudeService] fileDataList count:', fileDataList?.length || 0);

  const truncatedFiles = truncateFileContents(userInput, fileDataList);

  const contentBlocks: any[] = [];
  
  contentBlocks.push({ type: 'text', text: PART1_PROMPT + '\n\n---\n\n사용자 입력:\n' + userInput });
  
  if (truncatedFiles && truncatedFiles.length > 0) {
    for (let i = 0; i < truncatedFiles.length; i++) {
      const fileData = truncatedFiles[i];
      
      if (fileData.type === 'image' && fileData.base64) {
        console.log(`[claudeService] Adding image: ${fileData.name} (${fileData.mimeType})`);
        contentBlocks.push({ type: 'text', text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
        contentBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: fileData.mimeType || 'image/jpeg',
            data: fileData.base64
          }
        });
      } else if (fileData.type === 'document' && fileData.content) {
        console.log(`[claudeService] Adding document: ${fileData.name}`);
        contentBlocks.push({ type: 'text', text: `\n\n--- 첨부 문서 ${i + 1}: ${fileData.name} ---\n${fileData.content}` });
      } else if (fileData.type === 'text' && fileData.content) {
        const truncatedNote = (fileData as any).truncated ? ' [일부 생략됨]' : '';
        console.log(`[claudeService] Adding text file: ${fileData.name}${truncatedNote}`);
        contentBlocks.push({ type: 'text', text: `\n\n--- 첨부파일 ${i + 1}: ${fileData.name}${truncatedNote} ---\n${fileData.content}` });
      }
    }
  }

  const stream = await anthropic.messages.stream({
    model: model,
    max_tokens: 16000,
    messages: [
      { 
        role: 'user', 
        content: contentBlocks
      }
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
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
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const model = modelId || DEFAULT_MODEL;
  console.log('[claudeService] generateRFP using model:', model);

  const selectedModules = modules
    .filter(m => m.isSelected)
    .map(m => ({
      name: m.name,
      features: m.subFeatures.filter(s => s.isSelected).map(s => s.name)
    }));

  const modulesSummary = selectedModules
    .map(m => `- ${m.name}: ${m.features.join(', ')}`)
    .join('\n');

  const userContent = `
## 프로젝트 요약
${summary}

## 선택된 모듈 및 기능
${modulesSummary}

위 정보를 바탕으로 완벽한 입찰 공고문을 작성해주세요.
`;

  const stream = await anthropic.messages.stream({
    model: model,
    max_tokens: 16000,
    messages: [
      { 
        role: 'user', 
        content: PART2_PROMPT + '\n\n---\n\n' + userContent 
      }
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
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
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const model = modelId || DEFAULT_MODEL;
  console.log('[claudeService] generateInsight using model:', model);

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
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent ? textContent.text.trim() : '';
  } catch (error) {
    console.error('[claudeService] Error generating insight:', error);
    return '오류입니다. 다시 시도해주세요.';
  }
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

const CHAT_SYSTEM_PROMPT = `# SYSTEM ROLE
당신은 IT 프로젝트 견적 컨설턴트 AI입니다.
사용자의 질문에 답변하고, 필요시 대시보드(모듈/기능/견적)를 제어합니다.

# RESPONSE FORMAT (필수)
응답은 반드시 다음 형식을 따르세요:

<CHAT>
사용자에게 보여줄 자연어 답변을 여기에 작성합니다.
마크다운 형식 사용 가능합니다.
</CHAT>

<ACTION>
{
  "type": "action_type",
  "intent": "command" | "general",
  "payload": { ... }
}
</ACTION>

# ACTION TYPES
1. toggle_module: 기존 모듈 활성화/비활성화 토글
2. toggle_feature: 기존 세부 기능 활성화/비활성화 토글
3. add_feature: 기존 모듈에 새 기능 병합
4. create_module: 신규 모듈 생성
5. update_scale: 프로젝트 규모 변경
6. no_action: 대시보드 변경 없음

# RULES
1. 한국어로 답변하세요.
2. <CHAT>과 <ACTION> 태그는 반드시 포함해야 합니다.
3. intent 필드는 ACTION에 반드시 포함해야 합니다.

# CURRENT PROJECT STATE
`;

function formatModulesForPrompt(modules: ModuleItem[]): string {
  const lines: string[] = [];
  
  modules.forEach(mod => {
    const status = mod.isSelected ? '✅ 활성화' : '❌ 비활성화';
    const required = mod.required ? ' (필수)' : '';
    lines.push(`\n## ${mod.name} [${mod.id}] - ${status}${required}`);
    lines.push(`   기본 비용: ${(mod.baseCost / 10000).toLocaleString()}만원`);
    lines.push(`   기본 기간: ${mod.baseManMonths}MM`);
    
    if (mod.subFeatures.length > 0) {
      lines.push(`   세부 기능:`);
      mod.subFeatures.forEach(feat => {
        const featStatus = feat.isSelected ? '✅' : '❌';
        lines.push(`     - ${featStatus} ${feat.name} [${feat.id}]: ${(feat.price / 10000).toLocaleString()}만원, ${feat.manWeeks}주`);
      });
    }
  });
  
  return lines.join('\n');
}

function calculateTotals(modules: ModuleItem[]): { totalCost: number; totalWeeks: number } {
  let totalCost = 0;
  let totalWeeks = 0;
  
  modules.filter(m => m.isSelected).forEach(mod => {
    totalCost += mod.baseCost;
    totalWeeks += mod.baseManMonths * 4;
    
    mod.subFeatures.filter(f => f.isSelected).forEach(feat => {
      totalCost += feat.price;
      totalWeeks += feat.manWeeks;
    });
  });
  
  return { totalCost, totalWeeks };
}

export interface ChatModelSettings {
  classifyUserIntent?: string;
  streamChatResponse?: string;
}

export interface ChatFileData {
  type: 'text' | 'image' | 'document';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
  filePath?: string;
}

export async function streamChatResponse(
  history: Message[],
  currentModules: ModuleItem[],
  onChunk: (text: string) => void,
  modelSettings?: ChatModelSettings,
  fileDataList?: ChatFileData[]
): Promise<void> {
  if (!anthropic) {
    onChunk("<CHAT>\nAnthropic API Key가 설정되지 않았습니다.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
    return;
  }

  const model = modelSettings?.streamChatResponse || DEFAULT_MODEL;
  console.log('[claudeService] streamChatResponse using model:', model);
  console.log('[claudeService] fileDataList count:', fileDataList?.length || 0);

  const { totalCost, totalWeeks } = calculateTotals(currentModules);
  const modulesText = formatModulesForPrompt(currentModules);
  
  const projectState = `
=== 현재 프로젝트 상태 ===
총 예상 비용: ${(totalCost / 10000).toLocaleString()}만원
총 예상 기간: 약 ${Math.ceil(totalWeeks / 4)}개월 (${totalWeeks}주)

=== 모듈 상세 ===
${modulesText}
`;

  const fullSystemPrompt = CHAT_SYSTEM_PROMPT + projectState;

  const messages: any[] = history.slice(0, -1).map(h => ({
    role: (h.role === 'model' ? 'assistant' : h.role) as 'user' | 'assistant',
    content: h.text
  }));

  const lastUserMessage = history[history.length - 1];
  const lastUserContent: any[] = [{ type: 'text', text: lastUserMessage.text }];

  if (fileDataList && fileDataList.length > 0) {
    for (const fileData of fileDataList) {
      if (fileData.type === 'image' && fileData.base64) {
        console.log(`[claudeService] Adding image: ${fileData.name} (${fileData.mimeType})`);
        lastUserContent.push({ type: 'text', text: `\n\n--- 첨부 이미지: ${fileData.name} ---` });
        lastUserContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: fileData.mimeType || 'image/jpeg',
            data: fileData.base64
          }
        });
      } else if (fileData.type === 'document' && fileData.content) {
        console.log(`[claudeService] Adding document: ${fileData.name}`);
        lastUserContent.push({ type: 'text', text: `\n\n--- 첨부 문서: ${fileData.name} ---\n${fileData.content}` });
      } else if (fileData.type === 'text' && fileData.content) {
        console.log(`[claudeService] Adding text file: ${fileData.name}`);
        lastUserContent.push({ type: 'text', text: `\n\n--- 첨부파일: ${fileData.name} ---\n${fileData.content}` });
      }
    }
  }

  messages.push({
    role: 'user',
    content: lastUserContent
  });

  try {
    const stream = await anthropic.messages.stream({
      model: model,
      max_tokens: 4096,
      system: fullSystemPrompt,
      messages: messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        onChunk(event.delta.text);
      }
    }
  } catch (error) {
    console.error("[Claude Chat Error]:", error);
    onChunk("<CHAT>\n죄송합니다. AI 서비스 연결 중 오류가 발생했습니다.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
  }
}
