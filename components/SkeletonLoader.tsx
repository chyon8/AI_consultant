import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div 
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
    <Skeleton className="h-6 w-1/3 mb-4" />
    <SkeletonText lines={3} />
  </div>
);

interface TabSkeletonProps {
  type: 'schedule' | 'summary';
}

export const TabSkeleton: React.FC<TabSkeletonProps> = ({ type }) => {
  if (type === 'schedule') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 animate-pulse" />
          <Skeleton className="h-6 w-48" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-5 w-32 mb-2" />
          
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3 mt-6">
          <Skeleton className="h-5 w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
          </svg>
          수행계획을 생성하고 있습니다...
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 animate-pulse" />
        <Skeleton className="h-6 w-40" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-5 w-24 mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 mt-0.5 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-5 w-28 mb-2" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 mt-0.5 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
        </svg>
        프로젝트 요약을 생성하고 있습니다...
      </div>
    </div>
  );
};

export const ModulesSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((j) => (
            <Skeleton key={j} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </div>
    ))}
    
    <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4 flex items-center justify-center gap-2">
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
      </svg>
      모듈을 분석하고 있습니다...
    </div>
  </div>
);
