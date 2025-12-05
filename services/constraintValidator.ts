import { ModuleItem, ChatAction, ProjectScale } from '../types';

export interface ValidationResult {
  valid: boolean;
  errorCode?: 'PRICE_INTEGRITY' | 'ESSENTIAL_LOGIC_LOCK' | 'MINIMUM_VIABLE_SCOPE' | 'LOGICAL_VALIDATION';
  message?: string;
}

const CORE_CATEGORIES = ['Core', 'LMS Core'];

const MODULE_DEPENDENCIES: Record<string, string[]> = {
  'm1': [],
  'm2': ['m1'],
  'm3': ['m1', 'm2'],
  'm4': ['m1', 'm2'],
  'm5': ['m1'],
  'm6': ['m1'],
};

const FEATURE_DEPENDENCIES: Record<string, { moduleId: string; featureId: string }[]> = {
  's1-3': [],
  's1-4': [{ moduleId: 'm1', featureId: 's1-1' }],
  's2-1': [],
  's2-2': [],
  's2-3': [{ moduleId: 'm2', featureId: 's2-1' }],
  's3-1': [],
  's3-2': [{ moduleId: 'm3', featureId: 's3-1' }],
  's3-3': [{ moduleId: 'm3', featureId: 's3-1' }],
  's4-1': [],
  's4-2': [],
  's4-3': [{ moduleId: 'm4', featureId: 's4-1' }],
  's5-1': [],
  's5-2': [],
  's5-3': [{ moduleId: 'm5', featureId: 's5-1' }, { moduleId: 'm5', featureId: 's5-2' }],
  's6-1': [],
  's6-2': [{ moduleId: 'm6', featureId: 's6-1' }],
  's6-3': [{ moduleId: 'm6', featureId: 's6-1' }],
};

export function isEssentialModule(module: ModuleItem): boolean {
  return module.required === true || CORE_CATEGORIES.some(cat => module.category.includes(cat));
}

export function isEssentialFeature(module: ModuleItem, featureId: string): boolean {
  if (isEssentialModule(module)) {
    const feature = module.subFeatures.find(f => f.id === featureId);
    if (feature) {
      const isBasicAuth = featureId === 's1-1';
      const isAdminDashboard = featureId === 's1-3';
      const isCorePlayer = featureId === 's3-1';
      const isCurriculum = featureId === 's2-1';
      return isBasicAuth || isAdminDashboard || isCorePlayer || isCurriculum;
    }
  }
  return false;
}

export function validateModuleToggle(
  modules: ModuleItem[],
  moduleId: string,
  targetState?: boolean
): ValidationResult {
  const module = modules.find(m => m.id === moduleId);
  if (!module) {
    return { valid: false, errorCode: 'LOGICAL_VALIDATION', message: '모듈을 찾을 수 없습니다.' };
  }

  const willBeDisabled = targetState === false || (targetState === undefined && module.isSelected);

  if (willBeDisabled && isEssentialModule(module)) {
    return {
      valid: false,
      errorCode: 'ESSENTIAL_LOGIC_LOCK',
      message: `"${module.name}"은(는) 핵심(Core) 모듈이므로 비활성화할 수 없습니다. 서비스 구동에 필수적인 기능입니다.`
    };
  }

  if (willBeDisabled) {
    const dependentModules = modules.filter(m => {
      const deps = MODULE_DEPENDENCIES[m.id] || [];
      return deps.includes(moduleId) && m.isSelected;
    });

    if (dependentModules.length > 0) {
      const depNames = dependentModules.map(m => m.name).join(', ');
      return {
        valid: false,
        errorCode: 'LOGICAL_VALIDATION',
        message: `"${module.name}"을(를) 비활성화하면 "${depNames}"이(가) 정상 작동하지 않습니다. 먼저 해당 모듈을 비활성화해주세요.`
      };
    }
  }

  if (!willBeDisabled) {
    const deps = MODULE_DEPENDENCIES[moduleId] || [];
    const missingDeps = deps.filter(depId => {
      const depModule = modules.find(m => m.id === depId);
      return depModule && !depModule.isSelected;
    });

    if (missingDeps.length > 0) {
      const missingNames = missingDeps.map(id => modules.find(m => m.id === id)?.name).join(', ');
      return {
        valid: false,
        errorCode: 'LOGICAL_VALIDATION',
        message: `"${module.name}"을(를) 활성화하려면 먼저 "${missingNames}"이(가) 필요합니다.`
      };
    }
  }

  return { valid: true };
}

export function validateFeatureToggle(
  modules: ModuleItem[],
  moduleId: string,
  featureId: string,
  targetState?: boolean
): ValidationResult {
  const module = modules.find(m => m.id === moduleId);
  if (!module) {
    return { valid: false, errorCode: 'LOGICAL_VALIDATION', message: '모듈을 찾을 수 없습니다.' };
  }

  const feature = module.subFeatures.find(f => f.id === featureId);
  if (!feature) {
    return { valid: false, errorCode: 'LOGICAL_VALIDATION', message: '기능을 찾을 수 없습니다.' };
  }

  const willBeDisabled = targetState === false || (targetState === undefined && feature.isSelected);

  if (willBeDisabled && isEssentialFeature(module, featureId)) {
    return {
      valid: false,
      errorCode: 'ESSENTIAL_LOGIC_LOCK',
      message: `"${feature.name}"은(는) "${module.name}"의 핵심 기능이므로 비활성화할 수 없습니다.`
    };
  }

  if (willBeDisabled) {
    for (const [depFeatureId, deps] of Object.entries(FEATURE_DEPENDENCIES)) {
      const hasDep = deps.some(d => d.moduleId === moduleId && d.featureId === featureId);
      if (hasDep) {
        const depModule = modules.find(m => m.subFeatures.some(f => f.id === depFeatureId));
        if (depModule) {
          const depFeature = depModule.subFeatures.find(f => f.id === depFeatureId);
          if (depFeature?.isSelected) {
            return {
              valid: false,
              errorCode: 'LOGICAL_VALIDATION',
              message: `"${feature.name}"을(를) 비활성화하면 "${depFeature.name}"이(가) 정상 작동하지 않습니다.`
            };
          }
        }
      }
    }
  }

  return { valid: true };
}

export function validateMinimumViableScope(modules: ModuleItem[]): ValidationResult {
  const activeModules = modules.filter(m => m.isSelected);
  
  const hasAuth = activeModules.some(m => m.id === 'm1');
  if (!hasAuth) {
    return {
      valid: false,
      errorCode: 'MINIMUM_VIABLE_SCOPE',
      message: '사용자 관리 시스템은 모든 서비스의 기본입니다. 최소 하나의 인증 모듈이 필요합니다.'
    };
  }

  const hasCoreFeatures = activeModules.some(m => 
    CORE_CATEGORIES.some(cat => m.category.includes(cat)) || m.required
  );
  
  if (!hasCoreFeatures) {
    return {
      valid: false,
      errorCode: 'MINIMUM_VIABLE_SCOPE',
      message: '서비스 구동에 필요한 핵심 기능이 하나도 없습니다. 최소 하나의 Core 모듈이 필요합니다.'
    };
  }

  return { valid: true };
}

export function validateChatAction(
  action: ChatAction,
  modules: ModuleItem[]
): ValidationResult {
  switch (action.type) {
    case 'toggle_module':
      if (action.payload.moduleId) {
        return validateModuleToggle(modules, action.payload.moduleId);
      }
      break;

    case 'toggle_feature':
      if (action.payload.moduleId && action.payload.featureId) {
        return validateFeatureToggle(modules, action.payload.moduleId, action.payload.featureId);
      }
      break;

    case 'update_scale':
      if (action.payload.scale === 'MVP') {
        const essentialModules = modules.filter(m => isEssentialModule(m));
        const wouldViolate = essentialModules.some(m => !m.isSelected);
        if (wouldViolate) {
          return {
            valid: false,
            errorCode: 'ESSENTIAL_LOGIC_LOCK',
            message: 'MVP 스케일로 변경하더라도 핵심(Core) 모듈은 유지됩니다.'
          };
        }
      }
      break;
  }

  return { valid: true };
}

const PRICE_MANIPULATION_PATTERNS = [
  /싸게|저렴하게|할인|깎아|낮춰|줄여.*가격|예산.*줄|비용.*줄|금액.*줄/i,
  /비싸게|올려.*가격|높여.*가격|가격.*올|비용.*올|금액.*올/i,
  /\d+원으로|예산.*\d+|가격.*\d+만원|비용.*\d+/i,
  /가격.*맞춰|예산.*맞춰|금액.*조정/i,
];

export function detectPriceManipulation(message: string): boolean {
  return PRICE_MANIPULATION_PATTERNS.some(pattern => pattern.test(message));
}

export function validatePriceIntegrity(userMessage: string): ValidationResult {
  if (detectPriceManipulation(userMessage)) {
    return {
      valid: false,
      errorCode: 'PRICE_INTEGRITY',
      message: '견적 금액은 선택된 기능과 파트너 유형에 따라 자동으로 계산됩니다. 가격을 직접 조정하는 것은 불가능합니다. 대신 기능 범위를 조정하거나 파트너 유형을 변경해보세요.'
    };
  }
  return { valid: true };
}

export const CONSTRAINT_ERROR_MESSAGES = {
  PRICE_INTEGRITY: '💰 가격 무결성 위반: 견적은 계산의 결과값이며, 임의로 조정할 수 없습니다.',
  ESSENTIAL_LOGIC_LOCK: '🔒 필수 로직 잠금: 핵심(Core) 기능은 서비스 운영에 필수적이므로 비활성화할 수 없습니다.',
  MINIMUM_VIABLE_SCOPE: '⚠️ 최소 범위 미달: 서비스 구동에 필요한 최소 기능이 충족되지 않습니다.',
  LOGICAL_VALIDATION: '❌ 논리적 모순: 요청하신 변경사항이 기술적으로 성립하지 않습니다.',
};
