
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  totalCost: number;
}

export const ReportBuilderModal: React.FC<ReportBuilderModalProps> = ({ isOpen, onClose, projectName, totalCost }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'config' | 'generating' | 'done'>('config');

  useEffect(() => {
    if (isOpen) setStep('config');
  }, [isOpen]);

  const handleGenerate = () => {
    setStep('generating');
    setTimeout(() => {
      setStep('done');
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Icons.File size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900">스마트 견적 리포트 빌더</h2>
                <p className="text-xs text-slate-500">임원 보고용 PDF 제안서를 생성합니다.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <Icons.Minus size={24} className="rotate-45" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
           {step === 'config' && (
             <div className="space-y-8">
                {/* AI Executive Summary Preview */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 relative">
                   <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      AI Executive Summary
                   </div>
                   <p className="text-sm text-slate-700 leading-relaxed mt-2">
                      "본 프로젝트는 <strong>{projectName}</strong> 구축을 목표로 하며, 총 예산 <strong>{(totalCost/10000).toLocaleString()}만원</strong>, 예상 기간 <strong>4.5개월</strong>로 산정되었습니다. 경쟁사 대비 효율적인 <strong>Microservice Architecture</strong>를 채택하여 유지보수 비용을 약 20% 절감할 수 있도록 설계되었습니다."
                   </p>
                </div>

                {/* Section Selection */}
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-4">포함할 섹션 선택</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {['프로젝트 개요', '상세 견적서 (Excel 호환)', 'WBS 일정표', '시스템 아키텍처 도면', '리스크 분석 리포트', '유사 구축 사례'].map((item, i) => (
                         <label key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                            <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center bg-white text-indigo-600">
                               <Icons.CheckMark size={14} />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{item}</span>
                         </label>
                      ))}
                   </div>
                </div>

                <button 
                   onClick={handleGenerate}
                   className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                   <Icons.Printer size={18} />
                   PDF 리포트 생성하기
                </button>
             </div>
           )}

           {step === 'generating' && (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                 <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                       <Icons.Bot size={24} />
                    </div>
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">AI가 리포트를 작성 중입니다...</h3>
                 <p className="text-sm text-slate-500">시장 데이터를 분석하고 최적의 제안서를 구성하고 있습니다.</p>
              </div>
           )}

           {step === 'done' && (
              <div className="py-8 text-center flex flex-col items-center justify-center animate-fade-in-up">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <Icons.CheckMark size={32} strokeWidth={3} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">리포트 생성 완료!</h3>
                 <p className="text-sm text-slate-500 mb-8">성공적으로 PDF 파일이 생성되었습니다.</p>
                 
                 <div className="flex gap-4 w-full">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">
                       닫기
                    </button>
                    <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                       <Icons.Download size={18} />
                       다운로드
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
