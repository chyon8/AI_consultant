import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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
⚠️ 중요: moduleId와 featureId는 반드시 아래 "CURRENT PROJECT STATE"에 [대괄호] 안에 표시된 정확한 ID를 사용하세요.

1. toggle_module: 모듈 활성화/비활성화 토글
   - payload: { "moduleId": "<CURRENT PROJECT STATE에 [대괄호]로 표시된 모듈 ID>" }
   - 예시: { "moduleId": "module_payment" } (실제 ID는 아래 상태에서 확인)

2. toggle_feature: 세부 기능 활성화/비활성화 토글
   - payload: { "moduleId": "<모듈 ID>", "featureId": "<기능 ID>" }
   - 예시: { "moduleId": "module_payment", "featureId": "payment_card" }

3. update_partner_type: 파트너 유형 변경
   - payload: { "partnerType": "AGENCY" | "STUDIO" | "AI_NATIVE" }

4. update_scale: 프로젝트 규모 변경
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
6. ⚠️ ACTION의 moduleId/featureId는 반드시 아래 상태에서 [대괄호] 안의 정확한 값을 복사하세요.
7. 필수 모듈(required: true)은 비활성화할 수 없습니다. 비활성화 요청 시 CHAT에서 안내하고 no_action을 사용하세요.

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
    onChunk("<CHAT>\nAPI Key가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 설정해주세요.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"payload\": {}}\n</ACTION>");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

  const lastUserMessage = history[history.length - 1];
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
    onChunk("<CHAT>\n죄송합니다. AI 서비스 연결 중 오류가 발생했습니다.\n</CHAT>\n\n<ACTION>\n{\"type\": \"no_action\", \"payload\": {}}\n</ACTION>");
  }
}
