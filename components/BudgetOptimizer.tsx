import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { ModuleItem } from '../types';

interface BudgetOptimizerProps {
  currentTotal: number;
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
}

export const BudgetOptimizer: React.FC<BudgetOptimizerProps> = ({ currentTotal, modules, setModules }) => {
  // Budget range: 20 million to 300 million KRW
  const MIN_BUDGET = 20000000;
  const MAX_BUDGET = 300000000;
  const STEP = 5000000;

  const [targetBudget, setTargetBudget] = useState(currentTotal);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [message, setMessage] = useState('');

  // Sync target budget when modules change externally (unless user is dragging)
  useEffect(() => {
    if (!isOptimizing) {
       // Only update if the difference is significant to avoid jitter
       if (Math.abs(targetBudget - currentTotal) > STEP) {
          setTargetBudget(currentTotal);
       }
    }
  }, [currentTotal]);

  const optimizeModules = (budget: number) => {
    setIsOptimizing(true);
    let tempModules = JSON.parse(JSON.stringify(modules)) as ModuleItem[];
    let tempCost = calculateCost(tempModules);

    // AI Logic: Prioritize Core > Required > Selected Subfeatures
    
    // 1. If Over Budget: Remove items (Reverse Priority)
    if (tempCost > budget) {
      // First, remove optional sub-features from Non-Core modules
      tempModules = toggleFeatures(tempModules, budget, false);
    } 
    // 2. If Under Budget: Add items (Forward Priority)
    else if (tempCost < budget) {
       tempModules = toggleFeatures(tempModules, budget, true);
    }

    setModules(tempModules);
    
    // Feedback Message
    const diff = budget - calculateCost(tempModules);
    if (Math.abs(diff) < 2000000) setMessage("AI가 예산에 맞춰 최적화했습니다.");
    else if (diff > 0) setMessage("예산이 충분하여 더 많은 기능을 추가할 수 있습니다.");
    else setMessage("핵심 기능 유지를 위해 최소 예산이 필요합니다.");

    setTimeout(() => setIsOptimizing(false), 800);
  };

  const toggleFeatures = (mods: ModuleItem[], target: number, isAdding: boolean): ModuleItem[] => {
     let current = calculateCost(mods);
     
     // Flat list of toggleable items (Subfeatures first)
     for (const mod of mods) {
         // Process subfeatures (reverse order for removing)
         const subs = isAdding ? mod.subFeatures : [...mod.subFeatures].reverse();
         
         for (const sub of subs) {
             if (mod.required && sub.id.endsWith('1')) continue; // Skip core subfeatures

             if (isAdding && !sub.isSelected) {
                 if (current + sub.price <= target) {
                     sub.isSelected = true;
                     current += sub.price;
                 }
             } else if (!isAdding && sub.isSelected) {
                 if (current > target) {
                     sub.isSelected = false;
                     current -= sub.price;
                 }
             }
         }
         
         // Then toggle optional modules
         if (!mod.required) {
             if (isAdding && !mod.isSelected) {
                  // Approximate module cost (1st subfeature only)
                  const estimatedCost = mod.subFeatures[0]?.price || 0;
                  if (current + estimatedCost <= target) {
                      mod.isSelected = true;
                      mod.subFeatures.forEach((s, i) => s.isSelected = i === 0); // Activate base feature
                      current += estimatedCost;
                  }
             } else if (!isAdding && mod.isSelected) {
                 if (current > target) {
                     mod.isSelected = false;
                     current -= mod.subFeatures.reduce((a,c) => a + (c.isSelected?c.price:0), 0);
                 }
             }
         }
     }
     return mods;
  };

  const calculateCost = (mods: ModuleItem[]) => {
    return mods.filter(m => m.isSelected).reduce((acc, m) => 
        acc + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0)
    , 0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setTargetBudget(val);
    optimizeModules(val);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 mb-8 transition-all hover:shadow-soft">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Icons.Zap size={16} fill="currentColor" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI 예산 최적화</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">원하는 예산을 설정하면 기능을 자동으로 추천합니다.</p>
             </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Target Budget</span>
             <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {(targetBudget / 10000).toLocaleString()}만원
             </p>
          </div>
       </div>

       <div className="relative h-2 mb-6">
          <input 
            type="range" 
            min={MIN_BUDGET} 
            max={MAX_BUDGET} 
            step={STEP} 
            value={targetBudget}
            onChange={handleSliderChange}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="absolute w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full top-1/2 -translate-y-1/2 overflow-hidden">
             <div 
               className="h-full bg-indigo-500 dark:bg-indigo-500 transition-all duration-300 ease-out"
               style={{ width: `${((targetBudget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%` }}
             ></div>
          </div>
          <div 
             className="absolute w-4 h-4 bg-white dark:bg-slate-200 border-2 border-indigo-500 rounded-full top-1/2 -translate-y-1/2 shadow-sm transition-all duration-300 ease-out pointer-events-none"
             style={{ left: `${((targetBudget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%`, transform: 'translate(-50%, -50%)' }}
          ></div>
       </div>

       <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 dark:text-slate-600">최소 2천만원</span>
          <span className={`font-medium transition-colors ${message.includes('최소 예산') ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {message}
          </span>
          <span className="text-slate-400 dark:text-slate-600">최대 3억원</span>
       </div>
    </div>
  );
};