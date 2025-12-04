

import { ModuleItem, SimilarProject, PartnerConfig, PartnerType, PresetType, PresetDetail } from './types';

export const INITIAL_MODULES: ModuleItem[] = [
  {
    id: 'm1',
    name: '사용자 관리 시스템',
    description: '서비스의 기본이 되는 계정 및 권한 관리',
    baseCost: 10000000,
    baseManMonths: 1.0,
    category: 'Core',
    isSelected: true,
    required: true,
    subFeatures: [
      { id: 's1-1', name: '이메일 회원가입/로그인', price: 2000000, manWeeks: 1, isSelected: true },
      { id: 's1-2', name: 'SNS 소셜 로그인 (Kakao/Naver)', price: 3000000, manWeeks: 1.5, isSelected: true },
      { id: 's1-3', name: '관리자(Admin) 대시보드', price: 5000000, manWeeks: 2, isSelected: true },
      { id: 's1-4', name: 'SSO 연동 (Enterprise)', price: 8000000, manWeeks: 3, isSelected: false },
    ],
  },
  {
    id: 'm2',
    name: '강의 관리 시스템',
    description: 'LMS의 핵심인 커리큘럼 및 강좌 관리',
    baseCost: 15000000,
    baseManMonths: 1.5,
    category: 'LMS Core',
    isSelected: true,
    subFeatures: [
      { id: 's2-1', name: '커리큘럼 빌더 (챕터/강의)', price: 5000000, manWeeks: 2, isSelected: true },
      { id: 's2-2', name: '자료실 (파일 업로드)', price: 3000000, manWeeks: 1, isSelected: true },
      { id: 's2-3', name: '강의 복사 및 템플릿', price: 2000000, manWeeks: 1, isSelected: false },
    ],
  },
  {
    id: 'm3',
    name: '콘텐츠 플레이어',
    description: '동영상 및 학습 자료 재생 환경',
    baseCost: 12000000,
    baseManMonths: 1.5,
    category: 'LMS Core',
    isSelected: true,
    subFeatures: [
      { id: 's3-1', name: '영상 플레이어 (이어보기/배속)', price: 5000000, manWeeks: 2, isSelected: true },
      { id: 's3-2', name: 'DRM 보안 (녹화 방지)', price: 10000000, manWeeks: 3, isSelected: false },
      { id: 's3-3', name: 'CDN 트래픽 연동', price: 3000000, manWeeks: 1, isSelected: true },
    ],
  },
  {
    id: 'm4',
    name: '평가 및 시험',
    description: '학습 성취도 평가 및 과제 시스템',
    baseCost: 10000000,
    baseManMonths: 1.0,
    category: 'Education',
    isSelected: true,
    subFeatures: [
      { id: 's4-1', name: '객관식 문제은행', price: 5000000, manWeeks: 2, isSelected: true },
      { id: 's4-2', name: '서술형 과제 및 첨삭', price: 4000000, manWeeks: 1.5, isSelected: true },
      { id: 's4-3', name: '부정행위 방지 (화면이탈 감지)', price: 8000000, manWeeks: 3, isSelected: false },
    ],
  },
  {
    id: 'm5',
    name: '실시간 화상 수업',
    description: 'Zoom 연동 또는 WebRTC 자체 구축',
    baseCost: 5000000,
    baseManMonths: 0.5,
    category: 'Communication',
    isSelected: true,
    subFeatures: [
      { id: 's5-1', name: 'Zoom API 연동', price: 5000000, manWeeks: 2, isSelected: true },
      { id: 's5-2', name: 'WebRTC 자체 화상 구축', price: 25000000, manWeeks: 8, isSelected: false },
      { id: 's5-3', name: '화이트보드 공유', price: 6000000, manWeeks: 2.5, isSelected: false },
    ],
  },
  {
    id: 'm6',
    name: '모바일 앱 (App)',
    description: 'iOS, Android 네이티브 앱 지원',
    baseCost: 15000000,
    baseManMonths: 1.5,
    category: 'Platform',
    isSelected: false,
    subFeatures: [
      { id: 's6-1', name: '하이브리드 앱 패키징', price: 8000000, manWeeks: 3, isSelected: true },
      { id: 's6-2', name: '푸시 알림 시스템', price: 3000000, manWeeks: 1, isSelected: true },
      { id: 's6-3', name: '오프라인 저장소', price: 6000000, manWeeks: 2, isSelected: false },
    ],
  },
];

export const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'model' as const,
    text: "안녕하세요! 위시켓 AI 컨설턴트입니다.\n\n고객님의 니즈에 맞춰 최적의 파트너와 견적을 설계해 드립니다. 현재 **'소규모 스튜디오(Studio)'** 기준으로 세팅되어 있습니다.\n\n안정성이 최우선이라면 '전문 개발사', 압도적인 가성비를 원하신다면 'AI 네이티브' 파트너를 선택해보세요.",
    timestamp: new Date(),
  },
];

export const SIMILAR_PROJECTS_DATA: SimilarProject[] = [
  {
    id: 'p1',
    title: 'A 대학교 온라인 강의 플랫폼',
    similarity: 94,
    category: '교육',
    budget: 135000000,
    duration: '4.5개월',
    features: ['강의 관리', '화상 수업', '학습 분석', '결제'],
    outcome: '학생 만족도 92%, 수강률 35% 증가',
    satisfaction: 4.8
  },
  {
    id: 'p2',
    title: 'B 기업 사내 교육 시스템',
    similarity: 88,
    category: '기업교육',
    budget: 85000000,
    duration: '3.0개월',
    features: ['영상 보안', '법정 의무 교육', '수료증 발급'],
    outcome: '교육 운영 리소스 60% 절감',
    satisfaction: 4.6
  },
  {
    id: 'p3',
    title: 'C 어학원 라이브 클래스',
    similarity: 82,
    category: '학원/과외',
    budget: 65000000,
    duration: '2.5개월',
    features: ['Zoom 연동', '실시간 출석체크', '과제 첨삭'],
    outcome: '온라인 수강생 200% 증가 달성',
    satisfaction: 4.9
  }
];

export const PARTNER_PRESETS: Record<PartnerType, PartnerConfig> = {
  AGENCY: {
    type: 'AGENCY',
    title: '전문 개발사',
    description: '실패 없는 안정성과 체계적인 프로세스',
    costMultiplier: 1.5,
    durationMultiplier: 1.2,
    teamInfo: '6~8명 (PM, PL, Designer, Dev, QA)',
    pros: ['체계적인 문서화', '하자보수 보장', '리스크 최소화'],
    cons: ['높은 비용', '긴 커뮤니케이션'],
    recommendedFor: '대기업, 공공기관, 대규모 프로젝트'
  },
  STUDIO: {
    type: 'STUDIO',
    title: '소규모 스튜디오',
    description: '합리적인 비용과 기민한 커뮤니케이션',
    costMultiplier: 1.0,
    durationMultiplier: 1.0,
    teamInfo: '3~5인 (PM겸임, Full-stack Devs)',
    pros: ['합리적 견적', '빠른 속도', '유연한 대응'],
    cons: ['인력 의존도 높음'],
    recommendedFor: '스타트업 MVP, 중소기업'
  },
  AI_NATIVE: {
    type: 'AI_NATIVE',
    title: 'AI 네이티브 팀',
    description: 'AI 도구를 활용한 압도적 속도와 비용 혁신',
    costMultiplier: 0.6,
    durationMultiplier: 0.5,
    teamInfo: '1~2인 + AI Copilot Agents',
    pros: ['파격적인 비용 절감', '개발 속도 2배'],
    cons: ['문서화 약함', '복잡한 인프라 한계'],
    recommendedFor: 'PoC, 초기 창업, 예산 한정'
  }
};

export const PRESET_DETAILS: Record<PresetType, PresetDetail> = {
  MVP: {
    title: 'MVP (최소 기능)',
    description: '핵심 기능 위주로 빠르게 검증',
    cost: 30000000,
    duration: '2개월',
    features: ['기본 회원가입', 'VOD 강의 재생', '간편 결제', '기본 관리자']
  },
  STANDARD: {
    title: 'Standard (표준)',
    description: '안정적인 서비스 운영을 위한 표준 구성',
    cost: 80000000,
    duration: '3.5개월',
    features: ['소셜 로그인', '진도율 체크', '수료증 발급', '질의응답 게시판']
  },
  ENTERPRISE: {
    title: 'Enterprise (기업형)',
    description: '대규모 트래픽과 보안을 고려한 시스템',
    cost: 150000000,
    duration: '5개월+',
    features: ['SSO 연동', '라이브 스트리밍', '부정행위 방지 AI', '전용 인프라']
  }
};
