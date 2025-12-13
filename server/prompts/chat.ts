export const CHAT_SYSTEM_PROMPT = `# SYSTEM ROLE
당신은 IT 프로젝트 견적 컨설턴트 AI입니다.
사용자의 질문에 답변하고, 필요시 대시보드(모듈/기능/견적)를 제어합니다.

# INTENT CLASSIFICATION (의도 분류)
- **command**: 모듈/기능 추가, 삭제, 변경 요청 → 적절한 ACTION 사용
- **general**: 질문, 설명 요청, 일반 대화 → no_action 사용

# REQUEST HANDLING
- 추가 요청: 기존 모듈과 관련되면 add_feature, 새 도메인이면 create_module
- 삭제 요청: toggle_module 또는 toggle_feature
- 규모 조정: update_scale
- 프로젝트 핵심 변경(AI→시나리오, LMS→쇼핑몰 등): 새 프로젝트 안내 후 no_action

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
   - 용도: 기존 모듈 카테고리와 일치하는 기능 추가 시
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
   - 용도: 기존 모듈과 성격이 다른 독립적 기능 추가 시
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

# RULES
1. 한국어로 답변하세요.
2. <CHAT>과 <ACTION> 태그는 반드시 포함해야 합니다.
3. moduleId/featureId는 아래 상태에서 [대괄호] 안의 ID를 사용하세요.
4. 필수 모듈(required: true)은 비활성화 불가 → no_action으로 안내.
5. 파트너 유형 변경 → "대시보드에서 직접 변경" 안내 후 no_action.

# CURRENT PROJECT STATE
아래는 현재 프로젝트 상태입니다. [대괄호] 안의 ID를 ACTION에서 사용하세요.
`;

export interface SubFeature {
  id: string;
  name: string;
  price: number;
  manWeeks: number;
  isSelected: boolean;
}

export interface ModuleItem {
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

export interface ProjectOverview {
  projectTitle: string;
  businessGoals: string;
  coreValues: string[];
  techStack: { layer: string; items: string[] }[];
}

export function formatModulesForPrompt(modules: ModuleItem[]): string {
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

export function calculateTotals(modules: ModuleItem[]): { totalCost: number; totalWeeks: number } {
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

export function buildProjectStatePrompt(
  projectTitle: string,
  modules: ModuleItem[],
  projectOverview?: ProjectOverview | null,
  originalInput?: string | null
): string {
  const { totalCost, totalWeeks } = calculateTotals(modules);
  const modulesText = formatModulesForPrompt(modules);
  
  const originalInputSection = originalInput ? `
=== 원본 요구사항 (사용자 초기 입력) ===
${originalInput}
` : '';

  const overviewSection = projectOverview ? `
=== 프로젝트 개요 (AI 분석 결과) ===
프로젝트명: ${projectOverview.projectTitle}
비즈니스 목표: ${projectOverview.businessGoals}
핵심 가치: ${projectOverview.coreValues.join(', ')}
기술 스택: ${projectOverview.techStack.map(t => `${t.layer}: ${t.items.join(', ')}`).join(' | ')}
` : '';
  
  return `
${originalInputSection}
${overviewSection}
=== 현재 프로젝트 상태 ===
프로젝트: ${projectTitle}
총 예상 비용: ${(totalCost / 10000).toLocaleString()}만원
총 예상 기간: 약 ${Math.ceil(totalWeeks / 4)}개월 (${totalWeeks}주)

=== 모듈 상세 ===
${modulesText}
`;
}

export function buildFullChatPrompt(
  projectTitle: string,
  modules: ModuleItem[],
  projectOverview?: ProjectOverview | null,
  originalInput?: string | null
): string {
  const projectState = buildProjectStatePrompt(projectTitle, modules, projectOverview, originalInput);
  return CHAT_SYSTEM_PROMPT + projectState;
}
