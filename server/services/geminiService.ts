import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface FileData {
  type: 'text' | 'image';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

const PART1_PROMPT = `# PROMPT METADATA
# Version: v1.3.0-Staged-Output
# Description: IT 컨설팅 단계별 출력 (모듈 → 견적 → WBS → 요약)

# Role & Objective
당신은 20년 경력의 수석 IT 컨설턴트입니다.
입력 데이터를 분석하여 **반드시 아래 순서대로** 출력합니다:

---

## 📦 STAGE 1: 모듈 및 기능 정의
*   [Mode: Technical & Logical]
*   고객의 요구사항을 기술적 언어로 변환하여 구조화합니다.
*   프로젝트 개요: 비즈니스 목표 및 핵심 가치.
*   시스템 아키텍처 & 기술 스택: SW(FE/BE, Infra), HW(MCU, BOM) 제안.
*   기능 명세 (Functional Specifications):
    - 반드시 '핵심 모듈(Module) > 세부 기능(Detail Features)'의 계층 구조로 작성
    - 예시: [회원 모듈]: 소셜 로그인, 회원가입/탈퇴, 마이페이지
    - 예시: [결제 모듈]: PG사 연동, 결제 이력 조회, 환불 처리

**STAGE 1 완료 후 반드시 JSON 블록 출력:**

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
  ]
}
\`\`\`

<!-- STAGE_MODULES_COMPLETE -->

---

## 💰 STAGE 2: 유형별 비교 견적
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

**STAGE 2 완료 후 반드시 JSON 블록 출력:**

\`\`\`json:estimates
{
  "estimates": {
    "typeA": { "minCost": 50000000, "maxCost": 80000000, "duration": "4개월" },
    "typeB": { "minCost": 30000000, "maxCost": 50000000, "duration": "5개월" },
    "typeC": { "minCost": 20000000, "maxCost": 35000000, "duration": "6개월" }
  }
}
\`\`\`

<!-- STAGE_ESTIMATES_COMPLETE -->

---

## 📅 STAGE 3: 실행 계획 (WBS)
*   [Mode: Visual]
*   통합 WBS: ■(진행), □(대기) 문자를 사용한 시각적 표
*   주차별 마일스톤 및 담당자 역할
*   파트너 선정 어드바이스

**STAGE 3 완료 후 반드시 JSON 블록 출력:**

\`\`\`json:schedule
{
  "schedule": {
    "totalWeeks": 16,
    "phases": [
      { "name": "기획/설계", "weeks": 2, "tasks": ["요구사항 확정", "UI/UX 설계"] },
      { "name": "개발", "weeks": 10, "tasks": ["프론트엔드", "백엔드", "DB구축"] },
      { "name": "테스트", "weeks": 3, "tasks": ["단위테스트", "통합테스트", "UAT"] },
      { "name": "배포", "weeks": 1, "tasks": ["운영환경 배포", "모니터링 설정"] }
    ],
    "milestones": ["기획완료", "알파버전", "베타버전", "정식출시"]
  }
}
\`\`\`

<!-- STAGE_SCHEDULE_COMPLETE -->

---

## 📝 STAGE 4: 프로젝트 요약
*   핵심 포인트 3-5개
*   리스크 및 주의사항
*   성공을 위한 권장사항

**STAGE 4 완료 후 반드시 JSON 블록 출력:**

\`\`\`json:summary
{
  "summary": {
    "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "risks": ["리스크 1", "리스크 2"],
    "recommendations": ["권장사항 1", "권장사항 2"]
  }
}
\`\`\`

<!-- STAGE_SUMMARY_COMPLETE -->

---
응답은 한국어로 작성하고, 마크다운 형식으로 구조화해주세요.
**중요: 각 STAGE의 JSON 블록과 마커를 반드시 순서대로 출력하세요.**`;

const DEFAULT_MODEL = 'gemini-3-pro-preview';

export async function analyzeProject(
  userInput: string,
  fileDataList: FileData[],
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelId || DEFAULT_MODEL;
  
  console.log('[geminiService] analyzeProject using model:', model);
  console.log('[geminiService] fileDataList count:', fileDataList?.length || 0);

  const parts: any[] = [];
  
  parts.push({ text: PART1_PROMPT + '\n\n---\n\n사용자 입력:\n' + userInput });
  
  if (fileDataList && fileDataList.length > 0) {
    for (let i = 0; i < fileDataList.length; i++) {
      const fileData = fileDataList[i];
      
      if (fileData.type === 'image' && fileData.base64) {
        console.log(`[geminiService] Adding image: ${fileData.name} (${fileData.mimeType})`);
        parts.push({ text: `\n\n--- 첨부 이미지 ${i + 1}: ${fileData.name} ---` });
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType || 'image/jpeg',
            data: fileData.base64
          }
        });
      } else if (fileData.type === 'text' && fileData.content) {
        console.log(`[geminiService] Adding text file: ${fileData.name}`);
        parts.push({ text: `\n\n--- 첨부파일 ${i + 1}: ${fileData.name} ---\n${fileData.content}` });
      }
    }
  }

  const response = await ai.models.generateContentStream({
    model: model,
    contents: [
      { role: 'user', parts: parts }
    ],
    config: {
      temperature: 1.0,
      thinkingConfig: {
        thinkingBudget: 8000
      }
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      onChunk(text);
    }
  }
}
