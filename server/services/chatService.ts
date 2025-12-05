import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ===== AI-BASED CONTEXT LOCKING POLICY =====
// Dynamic judgment instead of hardcoded keywords

export interface ProjectContext {
  projectTitle: string;
  moduleNames: string[];
  coreModules: string[];
  commonModules: string[];
  projectDescription: string;
}

type ContextJudgment = 'RELATED' | 'NEW_PROJECT' | 'GENERAL';

const CONTEXT_CLASSIFIER_PROMPT = `# ROLE
You are a Context Lock Classifier for an IT project estimation tool.

# TASK
Determine if the user's message is:
- RELATED: Request related to the current project (feature additions, minor changes, questions)
- NEW_PROJECT: Attempt to change the CORE technology/architecture of the project
- GENERAL: General conversation, greetings, or questions not specific to any project

# CURRENT PROJECT CONTEXT
Title: {{PROJECT_TITLE}}
Core Domain Modules: {{CORE_MODULES}}
Common Modules (IGNORE these): {{COMMON_MODULES}}
Description: {{PROJECT_DESCRIPTION}}

# USER MESSAGE
"{{USER_MESSAGE}}"

# ⚠️ CRITICAL: JUDGMENT CRITERIA

## Step 1: Identify Common Modules (IGNORE these in judgment)
These utility modules exist in almost every project and should NOT affect your judgment:
- 회원/인증/로그인/소셜로그인 (authentication)
- 알림/푸시 (notifications)
- 파일 업로드/미디어 저장 (file storage)
- 관리자 대시보드/통계 (admin analytics)
- 결제/정산 (payment processing)

## Step 2: Focus ONLY on Core Domain Modules
Core domain modules define the project's identity and CANNOT be changed within the same project:
- AI 챗봇, RAG, LLM 연동, GPT/Claude → "AI 기반 프로젝트"
- 시나리오 엔진, 룰 기반 챗봇, 분기 로직 → "시나리오 기반 프로젝트"  
- 강의/학습/수강/진도/LMS → "교육 플랫폼"
- 매칭/소개팅/프로필/스와이프 → "소셜/매칭 앱"
- 상품/재고/주문/장바구니/배송/커머스 → "이커머스 플랫폼"
- IoT/센서/디바이스/엔드포인트 → "IoT 플랫폼"
- 게임/퀘스트/레벨/캐릭터 → "게임 플랫폼"

## Step 3: Apply Judgment Rules

| User Request | Judgment | Reason |
|--------------|----------|--------|
| "결제 기능 추가해줘" | RELATED | Common module addition |
| "로그인 방식 바꿔줘" | RELATED | Common module change |
| "AI 대신 시나리오 기반으로" | NEW_PROJECT | Core tech stack change (AI→Rule-based) |
| "소개팅 앱으로 바꿔" | NEW_PROJECT | Completely different domain |
| "GPT 대신 Claude 써줘" | RELATED | Same tech stack (LLM→LLM) |
| "챗봇 응답 속도 개선해줘" | RELATED | Optimization of existing module |

## Key Principle
"바꿔줘/변경해줘/대신" keywords do NOT automatically mean NEW_PROJECT.
→ Check if the CORE TECHNOLOGY STACK changes.
→ AI↔시나리오, 웹↔네이티브, LMS↔커머스 = NEW_PROJECT
→ 카카오페이↔네이버페이, GPT↔Claude, MySQL↔PostgreSQL = RELATED

# RESPONSE
Reply with exactly one word: RELATED, NEW_PROJECT, or GENERAL`;

const DEFAULT_MODEL = 'gemini-2.5-flash';

const PRICE_MANIPULATION_PATTERNS = [
  /싸게|저렴하게|할인|깎아|낮춰|줄여.*가격|예산.*줄|비용.*줄|금액.*줄/i,
  /비싸게|올려.*가격|높여.*가격|가격.*올|비용.*올|금액.*올/i,
  /\d+\s*(원|만원|천만원|억)\s*(으로|이면|에|내에|안에)/i,
  /예산\s*\d+|가격\s*\d+|비용\s*\d+/i,
  /가격.*맞춰|예산.*맞춰|금액.*조정/i,
  /더\s*싸게|더\s*저렴/i,
  /가격\s*(을|를)?\s*(낮춰|줄여|내려)/i,
  /(예산|비용|가격)\s*(범위|한도)\s*(을|를)?\s*\d+/i,
  /\d+\s*(만원|천만|억)\s*(정도|이내|이하|미만)/i,
];

function detectPriceManipulation(message: string): boolean {
  return PRICE_MANIPULATION_PATTERNS.some(pattern => pattern.test(message));
}

export async function classifyUserIntent(
  userMessage: string,
  projectContext: ProjectContext,
  modelId?: string
): Promise<{ judgment: ContextJudgment; shouldBlock: boolean; refusalMessage?: string }> {
  if (detectPriceManipulation(userMessage)) {
    console.log('[chatService] Price manipulation detected:', userMessage);
    return {
      judgment: 'RELATED',
      shouldBlock: true,
      refusalMessage: `<CHAT>
💰 **가격 무결성 정책 안내**

견적 금액은 **선택된 기능과 파트너 유형에 따라 자동으로 계산**되는 결과값입니다.

가격을 직접 조정하는 것은 견적의 신뢰성을 위해 지원하지 않습니다.

**비용을 조정하고 싶으시다면:**
1. 📋 **기능 범위 조정** - 선택적(Optional) 기능을 줄여보세요
2. 🏢 **파트너 유형 변경** - AI Native(가성비) ↔ Agency(안정성)
3. 📊 **규모 조정** - MVP/Standard/High-End 중 선택

어떤 방식으로 조정해드릴까요?
</CHAT>

<ACTION>
{"type": "no_action", "intent": "general", "payload": {}}
</ACTION>`
    };
  }

  if (!GEMINI_API_KEY) {
    return { judgment: 'GENERAL', shouldBlock: false };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const model = modelId || DEFAULT_MODEL;
    
    console.log('[chatService] classifyUserIntent using model:', model);
    
    const prompt = CONTEXT_CLASSIFIER_PROMPT
      .replace('{{PROJECT_TITLE}}', projectContext.projectTitle || '미정')
      .replace('{{CORE_MODULES}}', projectContext.coreModules.join(', ') || '없음')
      .replace('{{COMMON_MODULES}}', projectContext.commonModules.join(', ') || '없음')
      .replace('{{PROJECT_DESCRIPTION}}', projectContext.projectDescription || '프로젝트 분석 중')
      .replace('{{USER_MESSAGE}}', userMessage);

    const result = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0,
        maxOutputTokens: 10
      }
    });

    const responseText = (result as any).text || '';
    const response = responseText.trim().toUpperCase();
    
    console.log('[Context Classifier] Raw response:', responseText);
    
    let judgment: ContextJudgment = 'GENERAL';
    if (response.includes('RELATED')) judgment = 'RELATED';
    else if (response.includes('NEW_PROJECT')) judgment = 'NEW_PROJECT';
    else if (response.includes('GENERAL')) judgment = 'GENERAL';

    if (judgment === 'NEW_PROJECT') {
      return {
        judgment,
        shouldBlock: true,
        refusalMessage: `<CHAT>
⚠️ **새 프로젝트 감지 - 새 채팅 필요**

현재 세션은 **[${projectContext.projectTitle || '현재 프로젝트'}]** 분석 전용입니다.

입력하신 내용은 현재 프로젝트와 다른 새로운 프로젝트로 판단됩니다.

**→ 좌측 사이드바에서 [+ 새 프로젝트]를 클릭하여 새 채팅을 시작해주세요.**

현재 프로젝트의 기능 추가/수정은 계속 가능합니다.
</CHAT>

<ACTION>
{"type": "no_action", "intent": "general", "payload": {}}
</ACTION>`
      };
    }

    return { judgment, shouldBlock: false };

  } catch (error) {
    console.error('[Context Classifier] Error:', error);
    return { judgment: 'GENERAL', shouldBlock: false };
  }
}

const COMMON_MODULE_KEYWORDS = [
  '회원', '인증', '로그인', '소셜로그인', '권한', 'auth', 'authentication',
  '알림', '푸시', 'notification', 'push',
  '파일', '업로드', 'storage', 'file',
  '관리자', '어드민', 'admin', '대시보드', 'dashboard', '통계', 'analytics',
  '결제', 'payment', '정산'
];

const CORE_DOMAIN_KEYWORDS = [
  'ai', '챗봇', 'rag', 'llm', '자연어', 'gpt', 'claude', 'gemini',
  '시나리오', '룰기반', '분기', '스크립트',
  '강의', '학습', 'lms', '교육', '수강', '진도',
  '매칭', '소개팅', '프로필', '스와이프',
  '상품', '재고', '주문', '장바구니', '배송', '커머스', 'commerce',
  'iot', '센서', '디바이스', '엔드포인트', 'mdm',
  '게임', '퀘스트', '레벨', '캐릭터'
];

function isCommonModule(moduleName: string): boolean {
  const lowerName = moduleName.toLowerCase();
  
  if (CORE_DOMAIN_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
    return false;
  }
  
  return COMMON_MODULE_KEYWORDS.some(keyword => lowerName.includes(keyword.toLowerCase()));
}

export function extractProjectContext(modules: ModuleItem[]): ProjectContext {
  const moduleNames = modules.map(m => m.name);
  
  const coreModules = modules
    .filter(m => !isCommonModule(m.name))
    .map(m => m.name);
  
  const commonModules = modules
    .filter(m => isCommonModule(m.name))
    .map(m => m.name);
  
  const description = coreModules.length > 0
    ? `핵심 도메인: ${coreModules.slice(0, 3).join(', ')} 기반 프로젝트`
    : `${moduleNames.slice(0, 3).join(', ')} 등 ${modules.length}개 모듈로 구성된 프로젝트`;
  
  return {
    projectTitle: inferProjectTitle(modules),
    moduleNames,
    coreModules,
    commonModules,
    projectDescription: description
  };
}

function inferProjectTitle(modules: ModuleItem[]): string {
  const keywords = modules.flatMap(m => [m.name, m.description]).join(' ').toLowerCase();
  
  if (keywords.includes('학습') || keywords.includes('강의') || keywords.includes('교육') || keywords.includes('lms')) {
    return 'LMS/교육 플랫폼';
  }
  if (keywords.includes('쇼핑') || keywords.includes('결제') || keywords.includes('상품') || keywords.includes('주문')) {
    return '이커머스 플랫폼';
  }
  if (keywords.includes('에이전트') || keywords.includes('mdm') || keywords.includes('엔드포인트')) {
    return '엔드포인트 관리 시스템';
  }
  if (keywords.includes('iot') || keywords.includes('센서') || keywords.includes('디바이스')) {
    return 'IoT 플랫폼';
  }
  if (keywords.includes('관리자') || keywords.includes('대시보드') || keywords.includes('통계')) {
    return '관리 시스템';
  }
  
  return modules[0]?.name ? `${modules[0].name} 기반 시스템` : 'IT 프로젝트';
}

const CHAT_SYSTEM_PROMPT = `# SYSTEM ROLE
당신은 IT 프로젝트 견적 컨설턴트 AI입니다.
사용자의 질문에 답변하고, 필요시 대시보드(모듈/기능/견적)를 제어합니다.

# ⚠️ CRITICAL: 모듈 분류 이해 (반드시 숙지)

## 공통 모듈 (Common Modules) - 모든 프로젝트에 존재하는 유틸리티
- 회원/인증/로그인/소셜로그인 (authentication)
- 알림/푸시 (notifications)
- 파일 업로드/미디어 저장 (file storage)
- 관리자 대시보드/통계 (admin analytics)
- 결제/정산 (payment processing)

## 핵심 도메인 모듈 (Core Domain Modules) - 프로젝트 정체성 결정
- AI 챗봇, RAG, LLM 연동, GPT/Claude → "AI 기반 프로젝트"
- 시나리오 엔진, 룰 기반 챗봇, 분기 로직 → "시나리오 기반 프로젝트"
- 강의/학습/수강/진도/LMS → "교육 플랫폼"
- 매칭/소개팅/프로필/스와이프 → "소셜/매칭 앱"
- 상품/재고/주문/장바구니/배송/커머스 → "이커머스 플랫폼"
- IoT/센서/디바이스/엔드포인트 → "IoT 플랫폼"
- 게임/퀘스트/레벨/캐릭터 → "게임 플랫폼"

# INTENT CLASSIFICATION (의도 분류) - 필수
사용자의 입력을 먼저 분류하세요:
- **command**: 모듈/기능 추가, 삭제, 변경, 규모 조정 등 대시보드 데이터를 수정하는 요청
  예: "결제 모듈 추가해줘", "알림 기능 빼줘", "MVP로 줄여줘", "이 기능 삭제", "AI 기능 추가"
- **general**: 단순 질문, 설명 요청, 비용 문의, 일반 대화
  예: "이 모듈이 뭐야?", "비용이 얼마야?", "추천해줘", "감사합니다"

# 🌳 DECISION TREE: 요청 처리 (필수)

## Step 0: 요청 유형 분류 (가장 먼저 수행)
| 요청 패턴 | 분류 | 처리 |
|----------|------|------|
| "~추가해줘", "~넣어줘" | ADD | Step 1로 이동 |
| "~빼줘", "~삭제해줘" | REMOVE | toggle_module/toggle_feature 사용 |
| "A 대신 B로", "A 말고 B", "A 안 쓰고 B로" | REPLACE | Step 0-1로 이동 |
| "~로 바꿔", "~로 변경" | CHANGE | Step 0-1로 이동 |

## Step 0-1: REPLACE/CHANGE 요청 세부 판단
**핵심 질문: "변경 대상이 공통 모듈인가, 핵심 도메인 모듈인가?"**

| 변경 대상 | 변경 내용 | 판정 | 예시 |
|----------|----------|------|------|
| 공통 모듈 | 방식 변경 | RELATED (처리 가능) | "카카오페이→네이버페이", "이메일→카카오 로그인" |
| 핵심 도메인 | 같은 기술 스택 | RELATED (처리 가능) | "GPT→Claude", "MySQL→PostgreSQL" |
| 핵심 도메인 | 다른 기술 스택 | ❌ 처리 불가 | "AI 챗봇→시나리오 챗봇", "웹→네이티브 앱" |
| 프로젝트 전체 | 완전히 다른 서비스 | ❌ 처리 불가 | "LMS→소개팅앱", "쇼핑몰→게임" |

**❌ 처리 불가인 경우 응답:**
CHAT에서 "해당 요청은 프로젝트의 핵심 기술 스택을 변경하는 것으로, 새 프로젝트로 진행해야 합니다. 좌측 사이드바에서 [+ 새 프로젝트]를 클릭해주세요." 안내 후 no_action 사용.

## Step 1: 통합 가능성 평가 (ADD 요청일 때)
요청한 기능이 기존 모듈의 카테고리(backend/frontend/infra/etc)와 일치하거나 확장 가능한가?
- ✅ 일치/확장 가능 → **기존 모듈에 병합 (Merge)** → add_feature 액션 사용
- ❌ 불일치/독립적 → **신규 모듈 생성 (Create New)** → create_module 액션 사용

## Step 2: 카테고리 매칭 가이드
| 요청 키워드 | 매칭 카테고리 | 예시 기존 모듈 |
|------------|--------------|---------------|
| 로그인, 인증, 소셜, 권한 | backend | 회원 및 인증 모듈 |
| 결제, 주문, 카드, 환불 | backend | 결제 및 주문 모듈 |
| 영상, 학습, 플레이어, 진도 | frontend | 강좌 및 학습 플레이어 |
| 관리자, CMS, 통계, 대시보드 | etc | 관리자 대시보드 |
| 서버, 인프라, CDN, 미디어 | infra | 인프라 및 미디어 서버 |
| AI, 챗봇, 추천, ML | 신규 생성 | (새 모듈로 생성) |

## Step 3: 결과 표시
- 추가/변경된 항목에는 반드시 isNew: true 플래그를 포함
- CHAT 응답에서 "(New)" 또는 "✨신규" 태그로 변경사항 강조

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

# ACTION TYPES (가용 액션)
⚠️ 중요: moduleId와 featureId는 반드시 아래 "CURRENT PROJECT STATE"에 [대괄호] 안에 표시된 정확한 ID를 사용하세요.

1. toggle_module: 기존 모듈 활성화/비활성화 토글
   - intent: "command"
   - payload: { "moduleId": "<모듈 ID>" }
   - 용도: 이미 존재하는 모듈을 켜거나 끌 때

2. toggle_feature: 기존 세부 기능 활성화/비활성화 토글
   - intent: "command"
   - payload: { "moduleId": "<모듈 ID>", "featureId": "<기능 ID>" }
   - 용도: 이미 존재하는 세부 기능을 켜거나 끌 때

3. add_feature: 기존 모듈에 새 기능 병합 (Merge)
   - intent: "command"
   - payload: { 
       "moduleId": "<병합할 기존 모듈 ID>",
       "feature": {
         "name": "<새 기능명>",
         "price": <예상 비용(원)>,
         "manWeeks": <예상 공수(주)>,
         "isNew": true
       }
     }
   - 용도: 기존 모듈 카테고리와 일치하는 기능 추가 시 (Decision Tree Step 1 → Merge)
   - 예시: 결제 모듈에 "암호화폐 결제" 기능 추가

4. create_module: 신규 모듈 생성 (Create New)
   - intent: "command"
   - payload: {
       "module": {
         "name": "<새 모듈명>",
         "description": "<모듈 설명>",
         "baseCost": <기본 비용(원)>,
         "baseManMonths": <기본 공수(MM)>,
         "category": "backend" | "frontend" | "infra" | "etc",
         "isNew": true,
         "subFeatures": [
           { "name": "<기능명>", "price": <비용>, "manWeeks": <공수>, "isNew": true }
         ]
       }
     }
   - 용도: 기존 모듈과 성격이 다른 독립적 기능 추가 시 (Decision Tree Step 1 → Create New)
   - 예시: "AI 챗봇", "블록체인", "IoT 연동" 등 새로운 도메인

5. update_scale: 프로젝트 규모 변경
   - intent: "command"
   - payload: { "scale": "MVP" | "STANDARD" | "HIGH_END" }
   - MVP: 필수 모듈만 유지, 각 모듈의 첫 번째 기능만 활성화
   - STANDARD: 현재 상태 유지
   - HIGH_END: 모든 모듈과 기능 활성화

6. no_action: 대시보드 변경 없음 (단순 답변)
   - intent: "general"
   - payload: {}

# ⛔ PROHIBITED ACTIONS (금지된 동작)
- update_partner_type: 이 액션은 더 이상 존재하지 않습니다. 절대 사용하지 마세요.
- 파트너 유형 변경 요청이 들어오면, CHAT에서 "파트너 유형은 대시보드에서 직접 변경해주세요"라고 안내하고 no_action을 사용하세요.

# RULES
1. 사용자가 모듈/기능 제거, 추가, 변경을 요청하면 toggle_module 또는 toggle_feature를 사용하고 intent를 "command"로 설정하세요.
2. 단순 질문(설명 요청, 비용 문의 등)에는 no_action을 사용하고 intent를 "general"로 설정하세요.
3. 여러 변경이 필요하면 가장 중요한 하나만 ACTION에 포함하고, 나머지는 CHAT에서 안내하세요.
4. 한국어로 답변하세요.
5. <CHAT>과 <ACTION> 태그는 반드시 포함해야 합니다.
6. ⚠️ ACTION의 moduleId/featureId는 반드시 아래 상태에서 [대괄호] 안의 정확한 값을 복사하세요.
7. 필수 모듈(required: true)은 비활성화할 수 없습니다. 비활성화 요청 시 CHAT에서 안내하고 no_action을 사용하세요.
8. ⚠️ intent 필드는 ACTION에 반드시 포함해야 합니다. command 또는 general 중 하나입니다.

# CURRENT PROJECT STATE
아래는 현재 프로젝트 상태입니다. [대괄호] 안의 ID를 ACTION에서 사용하세요.
`;

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
  if (!GEMINI_API_KEY) {
    onChunk("<CHAT>\nAPI Key가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 설정해주세요.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
    return;
  }

  // ===== AI-BASED CONTEXT LOCKING VALIDATION =====
  const lastUserMessage = history[history.length - 1];
  const projectContext = extractProjectContext(currentModules);
  
  console.log('[Context Lock] Classifying user intent for:', lastUserMessage.text.substring(0, 50));
  console.log('[Context Lock] Project context:', projectContext.projectTitle);
  
  const contextValidation = await classifyUserIntent(
    lastUserMessage.text, 
    projectContext,
    modelSettings?.classifyUserIntent
  );
  
  console.log('[Context Lock] Judgment:', contextValidation.judgment);
  
  if (contextValidation.shouldBlock) {
    onChunk(contextValidation.refusalMessage!);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelSettings?.streamChatResponse || DEFAULT_MODEL;
  
  console.log('[chatService] streamChatResponse using model:', model);

  const { totalCost, totalWeeks } = calculateTotals(currentModules);
  const modulesText = formatModulesForPrompt(currentModules);
  
  const projectState = `
=== 현재 프로젝트 상태 ===
프로젝트: ${projectContext.projectTitle}
총 예상 비용: ${(totalCost / 10000).toLocaleString()}만원
총 예상 기간: 약 ${Math.ceil(totalWeeks / 4)}개월 (${totalWeeks}주)

=== 모듈 상세 ===
${modulesText}
`;

  const fullSystemPrompt = CHAT_SYSTEM_PROMPT + projectState;

  const previousHistory = history.slice(0, history.length - 1).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const contents = [
    ...previousHistory,
    { role: 'user', parts: [{ text: lastUserMessage.text }] }
  ];

  try {
    const result = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: fullSystemPrompt
      }
    });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    onChunk("<CHAT>\n죄송합니다. AI 서비스 연결 중 오류가 발생했습니다.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"intent\": \"general\", \"payload\": {}}\n</ACTION>");
  }
}
