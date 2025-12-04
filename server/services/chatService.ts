import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ===== AI-BASED CONTEXT LOCKING POLICY =====
// Dynamic judgment instead of hardcoded keywords

interface ProjectContext {
  projectTitle: string;
  moduleNames: string[];
  projectDescription: string;
}

type ContextJudgment = 'RELATED' | 'NEW_PROJECT' | 'GENERAL';

const CONTEXT_CLASSIFIER_PROMPT = `# ROLE
You are a Context Lock Classifier for an IT project estimation tool.

# TASK
Determine if the user's message is:
- RELATED: Request related to the current project (feature changes, module additions, questions about the project)
- NEW_PROJECT: Attempt to start a completely different/unrelated project
- GENERAL: General conversation, greetings, or questions not specific to any project

# CURRENT PROJECT CONTEXT
Title: {{PROJECT_TITLE}}
Modules: {{MODULE_NAMES}}
Description: {{PROJECT_DESCRIPTION}}

# USER MESSAGE
"{{USER_MESSAGE}}"

# JUDGMENT CRITERIA
- RELATED: Adding features to current project, modifying existing modules, asking about costs/timeline, technical questions about the project
- NEW_PROJECT: Requests for completely different domains (e.g., dating app when working on LMS, game when working on e-commerce, etc.)
- GENERAL: "Hello", "Thanks", "How are you", general IT questions not tied to a specific project

# RESPONSE
Reply with exactly one word: RELATED, NEW_PROJECT, or GENERAL`;

async function classifyUserIntent(
  userMessage: string,
  projectContext: ProjectContext
): Promise<{ judgment: ContextJudgment; shouldBlock: boolean; refusalMessage?: string }> {
  if (!GEMINI_API_KEY) {
    return { judgment: 'GENERAL', shouldBlock: false };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = CONTEXT_CLASSIFIER_PROMPT
      .replace('{{PROJECT_TITLE}}', projectContext.projectTitle || '미정')
      .replace('{{MODULE_NAMES}}', projectContext.moduleNames.join(', ') || '없음')
      .replace('{{PROJECT_DESCRIPTION}}', projectContext.projectDescription || '프로젝트 분석 중')
      .replace('{{USER_MESSAGE}}', userMessage);

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
⚠️ **Context Lock 정책 적용**

현재 세션은 **[${projectContext.projectTitle || '현재 프로젝트'}]** 전용입니다.

입력하신 내용이 기존 프로젝트의 기능 보강(Add-on)이 아닌, 완전히 새로운 프로젝트를 정의하려는 시도로 감지되었습니다.

새 프로젝트를 시작하시려면 좌측 사이드바의 **[+ 새 프로젝트]** 버튼을 이용해주세요.
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

function extractProjectContext(modules: ModuleItem[]): ProjectContext {
  const moduleNames = modules.map(m => m.name);
  const description = `${moduleNames.slice(0, 3).join(', ')} 등 ${modules.length}개 모듈로 구성된 프로젝트`;
  
  return {
    projectTitle: inferProjectTitle(modules),
    moduleNames,
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

# INTENT CLASSIFICATION (의도 분류) - 필수
사용자의 입력을 먼저 분류하세요:
- **command**: 모듈/기능 추가, 삭제, 변경, 규모 조정 등 대시보드 데이터를 수정하는 요청
  예: "결제 모듈 추가해줘", "알림 기능 빼줘", "MVP로 줄여줘", "이 기능 삭제", "AI 기능 추가"
- **general**: 단순 질문, 설명 요청, 비용 문의, 일반 대화
  예: "이 모듈이 뭐야?", "비용이 얼마야?", "추천해줘", "감사합니다"

# 🌳 DECISION TREE: 기능 추가 요청 처리 (필수)
사용자가 기능 추가를 요청하면 다음 판단 로직을 따르세요:

## Step 1: 통합 가능성 평가
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

export async function streamChatResponse(
  history: Message[],
  currentModules: ModuleItem[],
  onChunk: (text: string) => void
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
  
  const contextValidation = await classifyUserIntent(lastUserMessage.text, projectContext);
  
  console.log('[Context Lock] Judgment:', contextValidation.judgment);
  
  if (contextValidation.shouldBlock) {
    onChunk(contextValidation.refusalMessage!);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
      model: 'gemini-2.5-flash',
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
