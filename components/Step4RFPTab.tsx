import React, { useState, useEffect } from 'react';
import { ModuleItem } from '../types';
import { Icons } from './Icons';
import { generateRFP } from '../services/apiService';

interface Step4RFPTabProps {
  modules: ModuleItem[];
  projectSummary: string;
}

export const Step4RFPTab: React.FC<Step4RFPTabProps> = ({
  modules,
  projectSummary
}) => {
  const [rfpContent, setRfpContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setRfpContent('');

    try {
      await generateRFP(
        modules.filter(m => m.isSelected),
        projectSummary,
        (chunk) => {
          setRfpContent(prev => prev + chunk);
        },
        (err) => {
          setError(err);
        }
      );
      setHasGenerated(true);
    } catch (err) {
      setError('공고문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rfpContent);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 pt-2">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-semibold tracking-wider uppercase rounded">Step 4</span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-700 dark:text-neutral-200 mb-2">입찰 공고문 (RFP)</h3>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Request for Proposal — 상세 입찰 공고문 생성</p>
      </div>

      {!hasGenerated && !isGenerating ? (
        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-12 border border-neutral-100 dark:border-neutral-800 text-center">
          <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <Icons.File size={28} className="text-neutral-400 dark:text-neutral-500" />
          </div>
          <h4 className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-2">공고문 생성 준비 완료</h4>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8 max-w-md mx-auto">
            STEP 1~3에서 정의된 프로젝트 기획, 견적, 일정을 바탕으로 완벽한 입찰 공고문을 생성합니다.
          </p>
          <button
            onClick={handleGenerate}
            className="px-6 py-3 bg-neutral-700 dark:bg-neutral-300 text-neutral-200 dark:text-neutral-700 rounded-md font-medium hover:bg-neutral-600 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2 mx-auto"
          >
            <Icons.Sparkles size={16} />
            공고문 생성하기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {error ? (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-8 border border-neutral-200 dark:border-neutral-800 text-center">
              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Icons.Close size={24} className="text-neutral-500" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-6">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-neutral-700 dark:bg-neutral-300 text-neutral-200 dark:text-neutral-700 rounded-md font-medium hover:bg-neutral-600 dark:hover:bg-neutral-200 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
                  <Icons.File size={16} className="text-neutral-400" />
                  생성된 공고문
                </h4>
                <div className="flex items-center gap-2">
                  {rfpContent && !isGenerating && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-2"
                      >
                        <Icons.Copy size={14} />
                        복사
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-2"
                      >
                        <Icons.Refresh size={14} />
                        재생성
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                {isGenerating && !rfpContent ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Icons.Refresh size={24} className="text-neutral-400 animate-spin mb-4" />
                    <p className="text-neutral-400 dark:text-neutral-500">공고문을 생성하고 있습니다...</p>
                  </div>
                ) : (
                  <div className="p-8 max-h-[600px] overflow-y-auto">
                    <div className="whitespace-pre-wrap font-mono text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {rfpContent}
                      {isGenerating && (
                        <span className="inline-block w-2 h-4 bg-neutral-400 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-8 border border-neutral-100 dark:border-neutral-800">
        <h4 className="font-medium text-neutral-700 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <Icons.Help size={16} className="text-neutral-400" />
          공고문 활용 안내
        </h4>
        <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-1 h-1 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
            생성된 공고문은 복사하여 위시켓, 이랜서 등 외주 플랫폼에 활용할 수 있습니다.
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1 h-1 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
            프로젝트 상황에 맞게 내용을 수정하여 사용하시기 바랍니다.
          </li>
          <li className="flex items-start gap-3">
            <span className="w-1 h-1 rounded-full bg-neutral-400 mt-2 flex-shrink-0" />
            STEP 1~3의 내용을 수정하면 공고문도 새로 생성해야 합니다.
          </li>
        </ul>
      </div>
    </div>
  );
};
