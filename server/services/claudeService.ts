import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const DEFAULT_MODEL = 'claude-opus-4-20250514';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null;

const PART1_PROMPT = `# PROMPT METADATA
# Version: v1.2.0-JSON-Module-Output
# Description: IT 컨설팅(기획/견적/WBS) 생성 + JSON 모듈 데이터

# Role & Objective
당신은 20년 경력의 수석 IT 컨설턴트입니다.
입력 데이터를 분석하여 다음을 제공합니다:
1. 프로젝트 상세 기획 (모듈 구조)
2. 유형별 비교 견적 (TYPE A/B/C)
3. 실행 계획 (WBS)

## STEP 1. 프로젝트 상세 기획 (Project Planning)
*   [Mode: Technical & Logical]
*   고객의 요구사항을 기술적 언어로 변환하여 구조화합니다.
*   프로젝트 개요: 비즈니스 목표 및 핵심 가치.
*   시스템 아키텍처 & 기술 스택: SW(FE/BE, Infra), HW(MCU, BOM) 제안.
*   기능 명세 (Functional Specifications):
    - 반드시 '핵심 모듈(Module) > 세부 기능(Detail Features)'의 계층 구조로 작성
    - 예시: [회원 모듈]: 소셜 로그인, 회원가입/탈퇴, 마이페이지
    - 예시: [결제 모듈]: PG사 연동, 결제 이력 조회, 환불 처리

## STEP 2. 유형별 비교 견적 및 상세 산출 근거
[Mode: Strict Analytical]

### TYPE A: 대형 에이전시 / 전문 개발사 (Stability)
*   분석: 적합성 및 리스크 분석
*   투입 인력 및 M/M 상세
*   예상 견적 범위

### TYPE B: 소규모 스튜디오 / 프리랜서 팀 (Cost-Effective)
*   분석: 가성비 및 리스크 분석
*   투입 인력 및 M/M 상세
*   예상 견적 범위

### TYPE C: AI 네이티브 시니어 개발자 (AI Productivity)
*   분석: AI 도구 활용 생산성 분석
*   투입 인력 및 M/M 상세
*   예상 견적 범위

## STEP 3. 실행 계획 (WBS)
*   [Mode: Visual]
*   통합 WBS: ■(진행), □(대기) 문자를 사용한 시각적 표
*   파트너 선정 어드바이스

## STEP 4. 구조화된 모듈 데이터 (JSON)
응답 마지막에 반드시 아래 형식으로 JSON 블록을 출력하세요:

\`\`\`json:modules
{
  "projectTitle": "프로젝트 제목",
  "modules": [
    {
      "id": "mod_1",
      "name": "모듈명",
      "description": "모듈 설명",
      "category": "frontend|backend|database|infra|etc",
      "baseCost": 5000000,
      "baseManMonths": 1.5,
      "isSelected": true,
      "required": true,
      "subFeatures": [
        {
          "id": "feat_1_1",
          "name": "세부기능명",
          "price": 1000000,
          "manWeeks": 1,
          "isSelected": true
        }
      ]
    }
  ],
  "estimates": {
    "typeA": { "minCost": 50000000, "maxCost": 80000000, "duration": "4개월" },
    "typeB": { "minCost": 30000000, "maxCost": 50000000, "duration": "5개월" },
    "typeC": { "minCost": 20000000, "maxCost": 35000000, "duration": "6개월" }
  }
}
\`\`\`

---
응답은 한국어로 작성하고, 마크다운 형식으로 구조화해주세요.
JSON 블록은 반드시 응답 마지막에 포함하세요.`;

const PART2_PROMPT = `# [PART 2] 상세 입찰 공고문 생성 (RFP)

## Role
당신은 B2B 입찰 공고문 전문 AI입니다.
제공된 모듈 정보와 요약을 기반으로 완벽한 입찰 공고문을 생성합니다.

### [제약 사항 (Constraints)]
1. Clean Text: 볼드체(**), 이탤릭체(*) 등 마크다운 서식을 절대 사용하지 마십시오.
2. 서식 준수: [섹션명], 1., 1-1., - 네 가지 계층만 사용합니다.
3. 정보 누락 처리: 근거를 찾을 수 없는 항목은 과감히 제외합니다.

### [처리 논리 (Processing Logic)]
1. 제목/키워드: 핵심 목적, 기술적 특징을 반영한 제목 4개와 키워드 3개
2. 프로젝트명: 구체적인 이름으로 생성 (플레이스홀더 금지)
3. 과업 범위: 모듈 구조를 반영하여 상세 기술
4. 기술 스택: 적합한 기술 제안
5. 클라이언트 준비 사항: 현재 준비된 것만 명시

### [출력 형식 (Output Format)]

[추천 공고문 제목]
- 제목 1
- 제목 2
- 제목 3
- 제목 4

[프로젝트 키워드]
- 키워드 1, 키워드 2, 키워드 3

[프로젝트 개요]
프로젝트 이름

[프로젝트 배경 및 목표]
서술형 내용

[과업 범위]
1. 수행 범위
- 상세 기획
- UI/UX 디자인
- 프런트엔드/Client 개발
- 백엔드 개발
- 서버/DB/인프라 구성

2. 상세 기능 요구 사항
2-1. 모듈 A 관련 기능
2-2. 모듈 B 관련 기능

3. 비기능적 요구사항
3-1. 성능
3-2. 보안
3-3. 데이터

[지원 디바이스 및 디자인]
1. 지원 디바이스
2. 디자인 가이드

[기술 스택]
제안 요청

[클라이언트 준비 사항]
1. 문서 및 자료
2. 투입 인력 및 조직
3. 계정 및 기술 환경

[주요 일정]
1. 희망 착수일
2. 주요 마일스톤
3. 최종 오픈 희망일

[지원 자격 및 우대 사항]
1. 지원 자격
2. 우대 사항

[산출물]
- 산출물 목록

[계약 관련 특이 사항]
서술형 내용`;

const INSIGHT_PROMPT = `
<Role>
위시켓은 클라이언트가 IT 프로젝트를 의뢰하면 적합한 개발 업체를 매칭해주는 IT 아웃소싱 플랫폼입니다. 당신은 위시켓의 프로젝트 컨설턴트로, 클라이언트와 상담 후 정확하고 전문적인 프로젝트 기획을 도와주는 역할을 담당합니다.

<Task>
프로젝트의 현실적인 진행을 위해 확인해야할 요소들.꼭 물어봐야할 것들과 물어보면 좋은 것들을 구분해서 상세하게 리스트업 해주세요.
프로젝트를 수행할 개발사에서 물어볼만한 질문들을 미리 물어보야합니다.
마케팅이나 비즈니스적인 것같은 부가적인 건 물어볼 필요없고 개발과 프로덕트와 관련된 것만 확인하면 됩니다.

## 프로젝트 정보
- 프로젝트명: {projectName}
- 비즈니스 목표: {businessGoals}  
- 핵심 가치: {coreValues}
- 모듈 수: {moduleCount}개
- 총 기능 수: {featureCount}개

## 작성 지침
- 가장 중요한 질문들은 표시해주세요

응답은 오직 인사이트 문단만 출력하세요. 다른 설명은 포함하지 마세요.`;

export function isClaudeConfigured(): boolean {
  return !!ANTHROPIC_API_KEY && !!anthropic;
}

export interface FileData {
  type: 'text' | 'image';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
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

  const contentBlocks: any[] = [];
  
  contentBlocks.push({ type: 'text', text: PART1_PROMPT + '\n\n---\n\n사용자 입력:\n' + userInput });
  
  if (fileDataList && fileDataList.length > 0) {
    for (let i = 0; i < fileDataList.length; i++) {
      const fileData = fileDataList[i];
      
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
      } else if (fileData.type === 'text' && fileData.content) {
        console.log(`[claudeService] Adding text file: ${fileData.name}`);
        contentBlocks.push({ type: 'text', text: `\n\n--- 첨부파일 ${i + 1}: ${fileData.name} ---\n${fileData.content}` });
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
  moduleCount: number;
  featureCount: number;
}

export async function generateInsight(params: InsightParams, modelId?: string): Promise<string> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const model = modelId || DEFAULT_MODEL;
  console.log('[claudeService] generateInsight using model:', model);

  const prompt = INSIGHT_PROMPT
    .replace('{projectName}', params.projectName || '미정')
    .replace('{businessGoals}', params.businessGoals || '미정')
    .replace('{coreValues}', params.coreValues.join(', ') || '미정')
    .replace('{moduleCount}', String(params.moduleCount))
    .replace('{featureCount}', String(params.featureCount));

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

export async function streamChatResponse(
  history: Message[],
  currentModules: ModuleItem[],
  onChunk: (text: string) => void,
  modelSettings?: ChatModelSettings
): Promise<void> {
  if (!anthropic) {
    onChunk("<CHAT>\nAnthropic API Key가 설정되지 않았습니다.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
    return;
  }

  const model = modelSettings?.streamChatResponse || DEFAULT_MODEL;
  console.log('[claudeService] streamChatResponse using model:', model);

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

  const messages = history.map(h => ({
    role: (h.role === 'model' ? 'assistant' : h.role) as 'user' | 'assistant',
    content: h.text
  }));

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
