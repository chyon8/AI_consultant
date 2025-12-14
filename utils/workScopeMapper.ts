import { WorkScopeSelection } from '../types';

export interface WorkScopeResult {
  scope: WorkScopeSelection;
  required: {
    planning: boolean;
    design: boolean;
    development: boolean;
  };
}

const PLANNING_KEYWORDS = ['기획', '설계', '컨설팅', '요구사항', '스토리보드', 'IA'];
const DESIGN_KEYWORDS = ['디자인', 'UI', 'UX', '시안', '리뉴얼', '리디자인'];
const DEVELOPMENT_KEYWORDS = ['개발', '구축', '퍼블리싱', '퍼블', '코딩', '구현', '전체', '턴키', '풀스택'];

export function mapProjectScopeToWorkScope(projectScope: string | undefined): WorkScopeResult {
  if (!projectScope) {
    return {
      scope: { planning: true, design: true, development: true },
      required: { planning: false, design: false, development: true }
    };
  }

  const text = projectScope.toLowerCase();
  
  const hasPlanning = PLANNING_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  const hasDesign = DESIGN_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  const hasDevelopment = DEVELOPMENT_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
  
  const isDesignOnly = hasDesign && !hasDevelopment && !hasPlanning;
  const isPlanningOnly = hasPlanning && !hasDevelopment && !hasDesign;
  const isPlanningAndDesign = hasPlanning && hasDesign && !hasDevelopment;
  const isFullBuild = hasDevelopment || (!hasPlanning && !hasDesign);
  
  if (isDesignOnly) {
    return {
      scope: { planning: false, design: true, development: false },
      required: { planning: false, design: true, development: false }
    };
  }
  
  if (isPlanningOnly) {
    return {
      scope: { planning: true, design: false, development: false },
      required: { planning: true, design: false, development: false }
    };
  }
  
  if (isPlanningAndDesign) {
    return {
      scope: { planning: true, design: true, development: false },
      required: { planning: true, design: true, development: false }
    };
  }
  
  return {
    scope: { planning: true, design: true, development: true },
    required: { planning: false, design: false, development: true }
  };
}
