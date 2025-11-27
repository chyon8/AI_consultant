import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface ModuleItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseManMonths: number;
  category: string;
  isSelected: boolean;
  required?: boolean;
  subFeatures: {
    id: string;
    name: string;
    price: number;
    manWeeks: number;
    isSelected: boolean;
  }[];
}

interface ChatContext {
  modules: ModuleItem[];
  partnerType: string;
  currentScale: string;
  estimates?: {
    typeA?: { minCost: number; maxCost: number; duration: string };
    typeB?: { minCost: number; maxCost: number; duration: string };
    typeC?: { minCost: number; maxCost: number; duration: string };
  };
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
  "payload": { ... }
}
</ACTION>

# ACTION TYPES
1. toggle_module: 모듈 활성화/비활성화 토글 (현재 상태 반전)
   - payload: { "moduleId": "mod_1" }
   - 예: 현재 활성화된 모듈이면 비활성화, 비활성화면 활성화

2. toggle_feature: 세부 기능 활성화/비활성화 토글 (현재 상태 반전)
   - payload: { "moduleId": "mod_1", "featureId": "feat_1_1" }

3. update_partner_type: 파트너 유형 변경
   - payload: { "partnerType": "AGENCY" | "STUDIO" | "AI_NATIVE" }

4. update_scale: 프로젝트 규모 변경 (현재 모듈 기준으로 조정)
   - payload: { "scale": "MVP" | "STANDARD" | "HIGH_END" }
   - MVP: 필수 모듈만 유지, 각 모듈의 첫 번째 기능만 활성화
   - STANDARD: 현재 상태 유지
   - HIGH_END: 모든 모듈과 기능 활성화

5. no_action: 대시보드 변경 없음 (단순 답변)
   - payload: {}

# RULES
1. 사용자가 모듈/기능 제거, 추가, 변경을 요청하면 적절한 ACTION을 포함하세요.
2. 단순 질문(설명 요청, 비용 문의 등)에는 no_action을 사용하세요.
3. 여러 변경이 필요하면 가장 중요한 하나만 ACTION에 포함하고, 나머지는 CHAT에서 안내하세요.
4. 한국어로 답변하세요.
5. <CHAT>과 <ACTION> 태그는 반드시 포함해야 합니다.

# CURRENT PROJECT STATE
아래는 현재 프로젝트 상태입니다. 이를 참고하여 답변하세요.
`;

function buildContextPrompt(context: ChatContext): string {
  const modulesSummary = context.modules.map(m => ({
    id: m.id,
    name: m.name,
    isSelected: m.isSelected,
    baseCost: m.baseCost,
    subFeatures: m.subFeatures.map(f => ({
      id: f.id,
      name: f.name,
      isSelected: f.isSelected,
      price: f.price
    }))
  }));

  return `
## 현재 모듈 구성
\`\`\`json
${JSON.stringify(modulesSummary, null, 2)}
\`\`\`

## 파트너 유형: ${context.partnerType}
## 프로젝트 규모: ${context.currentScale}

## 견적 정보
${context.estimates ? JSON.stringify(context.estimates, null, 2) : '아직 견적이 생성되지 않았습니다.'}
`;
}

export async function processChat(
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[],
  context: ChatContext,
  onChunk: (chunk: string) => void
): Promise<{ chatMessage: string; action?: { type: string; payload: Record<string, any> } }> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const systemPrompt = CHAT_SYSTEM_PROMPT + buildContextPrompt(context);

  const contents = [
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }]
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] }
  ];

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    }
  });

  let fullResponse = '';
  
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      fullResponse += text;
      onChunk(text);
    }
  }

  return parseResponse(fullResponse);
}

function parseResponse(response: string): { chatMessage: string; action?: { type: string; payload: Record<string, any> } } {
  const chatMatch = response.match(/<CHAT>([\s\S]*?)<\/CHAT>/);
  const actionMatch = response.match(/<ACTION>([\s\S]*?)<\/ACTION>/);

  let chatMessage = chatMatch ? chatMatch[1].trim() : response;
  let action: { type: string; payload: Record<string, any> } | undefined;

  if (actionMatch) {
    try {
      const actionJson = actionMatch[1].trim();
      action = JSON.parse(actionJson);
    } catch (e) {
      console.error('Failed to parse ACTION JSON:', e);
    }
  }

  if (!action) {
    action = { type: 'no_action', payload: {} };
  }

  return { chatMessage, action };
}
