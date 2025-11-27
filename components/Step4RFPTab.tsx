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
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded">STEP 4</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">입찰 공고문 (RFP)</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Request for Proposal - 상세 입찰 공고문 생성</p>
      </div>

      {!hasGenerated && !isGenerating ? (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Icons.File size={32} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">공고문 생성 준비 완료</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            STEP 1~3에서 정의된 프로젝트 기획, 견적, 일정을 바탕으로 완벽한 입찰 공고문을 생성합니다.
          </p>
          <button
            onClick={handleGenerate}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-black dark:hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
          >
            <Icons.Sparkles size={18} />
            공고문 생성하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                <Icons.Close size={24} className="text-red-500" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-black dark:hover:bg-slate-200 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icons.File size={18} className="text-amber-500" />
                  생성된 공고문
                </h4>
                <div className="flex items-center gap-2">
                  {rfpContent && !isGenerating && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Icons.Copy size={16} />
                        복사
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Icons.Refresh size={16} />
                        재생성
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {isGenerating && !rfpContent ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Icons.Refresh size={32} className="text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">공고문을 생성하고 있습니다...</p>
                  </div>
                ) : (
                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {rfpContent}
                      {isGenerating && (
                        <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Icons.Help size={18} className="text-slate-400" />
          공고문 활용 안내
        </h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
            생성된 공고문은 복사하여 위시켓, 이랜서 등 외주 플랫폼에 활용할 수 있습니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
            프로젝트 상황에 맞게 내용을 수정하여 사용하시기 바랍니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
            STEP 1~3의 내용을 수정하면 공고문도 새로 생성해야 합니다.
          </li>
        </ul>
      </div>
    </div>
  );
};
