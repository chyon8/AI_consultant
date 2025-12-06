import React, { useState, useEffect, useRef } from 'react';
import { ProgressiveLoadingState } from '../types';

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
  const [animationState, setAnimationState] = useState<'idle' | 'swipe-out' | 'swipe-in'>('idle');
  const prevStageRef = useRef<AnalysisStage>('estimating');
  
  useEffect(() => {
    if (!isAnalyzing) {
      prevStageRef.current = 'estimating';
      setDisplayedStage('estimating');
      setAnimationState('idle');
      return;
    }
    
    const newStage = determineStage(progressiveState);
    
    if (newStage !== prevStageRef.current) {
      setAnimationState('swipe-out');
      
      const swipeOutTimer = setTimeout(() => {
        setDisplayedStage(newStage);
        prevStageRef.current = newStage;
        setAnimationState('swipe-in');
        
        const swipeInTimer = setTimeout(() => {
          setAnimationState('idle');
        }, 250);
        
        return () => clearTimeout(swipeInTimer);
      }, 200);
      
      return () => clearTimeout(swipeOutTimer);
    }
  }, [isAnalyzing, progressiveState]);
  
  if (!isAnalyzing) {
    return null;
  }
  
  const isComplete = displayedStage === 'complete';
  
  const getTextAnimationClass = () => {
    if (animationState === 'swipe-out') return 'animate-swipe-out';
    if (animationState === 'swipe-in') return 'animate-swipe-in';
    return isComplete ? '' : 'animate-text-pulse';
  };
  
  return (
    <div className="flex flex-col items-start gap-1.5 animate-slide-up">
      <div 
        className={`
          px-4 py-2.5
          bg-gray-100 dark:bg-slate-700
          rounded-2xl rounded-bl-md
          overflow-hidden
        `}
      >
        <span 
          className={`
            inline-block text-sm font-medium text-gray-500 dark:text-gray-300
            ${getTextAnimationClass()}
          `}
        >
          {STAGE_MESSAGES[displayedStage]}
        </span>
      </div>
      
      {!isComplete && (
        <div 
          className="
            px-3 py-2
            bg-gray-100 dark:bg-slate-700
            rounded-full
          "
        >
          <div className="flex items-center gap-1">
            <span 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-dot"
              style={{ animationDelay: '0ms' }}
            />
            <span 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-dot"
              style={{ animationDelay: '150ms' }}
            />
            <span 
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-typing-dot"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
