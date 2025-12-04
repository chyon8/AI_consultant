import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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

interface ModuleInfo {
  name: string;
  isSelected: boolean;
  subFeatures: { name: string; isSelected: boolean }[];
}

const DEFAULT_MODEL = 'gemini-3-pro-preview';

export async function generateRFP(
  modules: ModuleInfo[],
  summary: string,
  onChunk: (chunk: string) => void,
  modelId?: string
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const model = modelId || DEFAULT_MODEL;
  
  console.log('[rfpService] generateRFP using model:', model);

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

  const response = await ai.models.generateContentStream({
    model: model,
    contents: [
      { role: 'user', parts: [{ text: PART2_PROMPT + '\n\n---\n\n' + userContent }] }
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
