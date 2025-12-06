import React, { useState, useEffect, useRef } from 'react';
import { ProgressiveLoadingState } from '../types';
import { Icons } from './Icons';

interface AnalysisStatusIndicatorProps {
  isAnalyzing: boolean;
  progressiveState?: ProgressiveLoadingState;
}

type AnalysisStage = 'estimating' | 'planning' | 'summarizing' | 'complete';

const STAGE_MESSAGES: Record<AnalysisStage, string> = {
  estimating: '견적을 산출하는 중입니다.',
  planning: '수행 계획을 작성하는 중입니다.',
  summarizing: '내용을 요약하는 중입니다.',
  complete: '분석 완료되었습니다.'
};

function determineStage(progressiveState?: ProgressiveLoadingState): AnalysisStage {
  if (!progressiveState) {
    return 'estimating';
  }
  
  if (progressiveState.summaryReady) {
    return 'complete';
  }
  
  if (progressiveState.scheduleReady) {
    return 'summarizing';
  }
  
  if (progressiveState.estimatesReady) {
    return 'planning';
  }
  
  return 'estimating';
}

export const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({
  isAnalyzing,
  progressiveState
}) => {
  const [displayedStage, setDisplayedStage] = useState<AnalysisStage>('estimating');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevStageRef = useRef<AnalysisStage>('estimating');
  
  useEffect(() => {
    if (!isAnalyzing) {
      prevStageRef.current = 'estimating';
      setDisplayedStage('estimating');
      return;
    }
    
    const newStage = determineStage(progressiveState);
    
    if (newStage !== prevStageRef.current) {
      setIsTransitioning(true);
      
      const fadeOutTimer = setTimeout(() => {
        setDisplayedStage(newStage);
        prevStageRef.current = newStage;
        
        const fadeInTimer = setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
        
        return () => clearTimeout(fadeInTimer);
      }, 200);
      
      return () => clearTimeout(fadeOutTimer);
    }
  }, [isAnalyzing, progressiveState]);
  
  if (!isAnalyzing) {
    return null;
  }
  
  const isComplete = displayedStage === 'complete';
  
  return (
    <div className="flex items-start gap-3 animate-slide-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        {isComplete ? (
          <Icons.Check size={16} className="text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Icons.Refresh size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
        )}
      </div>
      <div 
        className={`
          flex items-center gap-2 px-4 py-2.5 
          bg-gradient-to-r from-indigo-50 to-purple-50 
          dark:from-indigo-900/20 dark:to-purple-900/20 
          border border-indigo-100 dark:border-indigo-800/50
          rounded-xl shadow-sm
          transition-opacity duration-200 ease-in-out
          ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {STAGE_MESSAGES[displayedStage]}
        </span>
        {!isComplete && (
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  );
};
