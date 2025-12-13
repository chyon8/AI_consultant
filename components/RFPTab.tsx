

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ModuleItem, PartnerType, ParsedEstimates } from '../types';
import { Icons } from './Icons';
import { calculateSchedule } from '../services/scheduleEngine';

interface RFPTabProps {
  modules: ModuleItem[];
  currentPartnerType: PartnerType;
  onGenerateRFP?: () => void;
  modelId?: string;
  rfpContent?: string;
  onRfpContentChange?: (content: string) => void;
  isRfpGenerating?: boolean;
  onRfpGenerate?: (modules: ModuleItem[], projectSummary: string) => void;
  onRfpCancel?: () => void;
  estimates?: ParsedEstimates;
}

export const RFPTab: React.FC<RFPTabProps> = ({
  modules,
  currentPartnerType,
  onGenerateRFP,
  modelId,
  rfpContent: externalRfpContent,
  onRfpContentChange,
  isRfpGenerating = false,
  onRfpGenerate,
  onRfpCancel,
  estimates
}) => {
  const [localRfpContent, setLocalRfpContent] = useState('');
  const rfpContent = externalRfpContent !== undefined ? externalRfpContent : localRfpContent;
  const setRfpContent = (content: string) => {
    if (onRfpContentChange) {
      onRfpContentChange(content);
    } else {
      setLocalRfpContent(content);
    }
  };
  const [showResult, setShowResult] = useState(!!rfpContent);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (rfpContent) {
      setShowResult(true);
    } else {
      setShowResult(false);
    }
  }, [rfpContent]);

  const selectedModules = modules.filter(m => m.isSelected);
  
  // Use AI-generated estimates if available, otherwise fallback to frontend calculation
  const getCurrentEstimate = () => {
    if (!estimates) return null;
    if (currentPartnerType === 'AGENCY') return estimates.typeA;
    if (currentPartnerType === 'STUDIO') return estimates.typeB;
    return estimates.typeC;
  };
  
  const currentEstimate = getCurrentEstimate();
  
  // Fallback calculation only if AI estimates not available
  const fallbackCost = useMemo(() => {
    const baseDevCost = selectedModules.reduce((acc, m) => 
      acc + m.subFeatures.filter(s => s.isSelected).reduce((sa, s) => sa + s.price, 0)
    , 0);
    let cost = baseDevCost;
    if (currentPartnerType === 'AGENCY') {
      cost = baseDevCost * 1.3;
    } else if (currentPartnerType === 'STUDIO') {
      cost = baseDevCost * 1.1;
    } else {
      cost = baseDevCost * 0.6;
    }
    return cost;
  }, [selectedModules, currentPartnerType]);
  
  // Use AI estimate if available, otherwise fallback
  const totalCost = currentEstimate 
    ? (currentEstimate.minCost + currentEstimate.maxCost) / 2 
    : fallbackCost;

  const scheduleResult = useMemo(() => {
    return calculateSchedule(modules, currentPartnerType);
  }, [modules, currentPartnerType]);

  const partnerLabel = currentPartnerType === 'AI_NATIVE' ? 'TYPE C (AI 네이티브)' : 
                       currentPartnerType === 'STUDIO' ? 'TYPE B (스튜디오)' : 'TYPE A (에이전시)';

  const totalFeatures = selectedModules.reduce((acc, m) => 
    acc + m.subFeatures.filter(s => s.isSelected).length
  , 0);

  const handleGenerateRFP = () => {
    setShowResult(true);
    setCopied(false);

    const costDisplay = currentEstimate 
      ? `${(currentEstimate.minCost / 10000).toLocaleString()} ~ ${(currentEstimate.maxCost / 10000).toLocaleString()}만원`
      : `${(totalCost / 10000).toLocaleString()}만원`;
    const durationDisplay = currentEstimate?.duration || `${scheduleResult.totalDuration.toFixed(1)}개월`;
    const projectSummary = `총 ${selectedModules.length}개 모듈, 예상 비용 ${costDisplay}, 예상 기간 ${durationDisplay}`;

    if (onRfpGenerate) {
      onRfpGenerate(selectedModules, projectSummary);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rfpContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Icons.File size={20} />
          공고 작성
        </h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">선택된 모듈</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedModules.length}개</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">선택된 기능</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalFeatures}개</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 비용 ({partnerLabel})</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentEstimate 
                ? `${(currentEstimate.minCost / 10000).toLocaleString()} ~ ${(currentEstimate.maxCost / 10000).toLocaleString()}만원`
                : `${(totalCost / 10000).toLocaleString()}만원`}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">예상 기간</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentEstimate?.duration || `${scheduleResult.totalDuration.toFixed(1)}개월`}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">포함 모듈 요약</h4>
          <div className="space-y-2">
            {selectedModules.map(module => {
              const selectedSubs = module.subFeatures.filter(s => s.isSelected);
              return (
                <div key={module.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module.name}</span>
                    {module.required && (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">필수</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{selectedSubs.length}개 기능</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <Icons.Help size={16} />
          공고 생성 안내
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          위 내용을 기반으로 입찰 공고문을 자동 생성합니다. 프로젝트 개요, 과업 범위, 기술 스택, 일정 등이 포함됩니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateRFP}
            disabled={isRfpGenerating}
            className={`flex-1 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              isRfpGenerating 
                ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' 
                : 'bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-900'
            }`}
          >
            {isRfpGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Icons.File size={18} />
                <span>공고문 생성하기</span>
              </>
            )}
          </button>
          {isRfpGenerating && onRfpCancel && (
            <button
              onClick={onRfpCancel}
              className="px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-red-500 hover:bg-red-600 text-white"
            >
              <Icons.Close size={18} />
              <span>중단</span>
            </button>
          )}
        </div>

        {showResult && (
          <div className="mt-6 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Icons.File size={16} />
                생성된 공고문
                {isRfpGenerating && (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </h5>
              <button
                onClick={handleCopy}
                disabled={!rfpContent || isRfpGenerating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copied 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                } ${isRfpGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {copied ? (
                  <>
                    <Icons.CheckMark size={14} />
                    <span>복사됨</span>
                  </>
                ) : (
                  <>
                    <Icons.Copy size={14} />
                    <span>복사</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={rfpContent}
              onChange={(e) => setRfpContent(e.target.value)}
              readOnly={isRfpGenerating}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
              style={{ resize: 'vertical', minHeight: '384px', maxHeight: '80vh', overflow: 'auto' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
