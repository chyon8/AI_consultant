
import React from 'react';
import { Icons } from './Icons';

interface ReverseAuctionWidgetProps {
  totalCost: number;
}

export const ReverseAuctionWidget: React.FC<ReverseAuctionWidgetProps> = () => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
       <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Icons.Zap size={20} className="text-yellow-400" fill="currentColor" />
          </div>
          <span className="text-base md:text-lg text-slate-300">
             지금 등록하면 <strong className="text-white">24시간 내 평균 5개</strong>의 견적을 받을 수 있습니다.
          </span>
       </div>
       
       <button className="flex-shrink-0 px-8 py-4 bg-white text-slate-900 rounded-full text-base font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg shadow-white/5">
          무료로 프로젝트 등록하기
          <Icons.CheckMark size={18} strokeWidth={3} />
       </button>
    </div>
  );
};
