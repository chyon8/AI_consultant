import React, { useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface MemoTabProps {
  memoContent: string;
  onMemoChange: (content: string) => void;
}

export const MemoTab: React.FC<MemoTabProps> = ({
  memoContent,
  onMemoChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(400, textareaRef.current.scrollHeight) + 'px';
    }
  }, [memoContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMemoChange(e.target.value);
  };

  const wordCount = memoContent.trim() ? memoContent.trim().split(/\s+/).length : 0;
  const charCount = memoContent.length;

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Pencil size={20} />
            메모
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span>{charCount} 글자</span>
            <span>{wordCount} 단어</span>
          </div>
        </div>
        
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={memoContent}
            onChange={handleChange}
            placeholder="프로젝트에 대한 메모를 작성하세요...

• 클라이언트 요구사항
• 주요 결정 사항
• 참고 자료 링크
• TODO 리스트"
            className="w-full min-h-[400px] p-4 bg-slate-50 dark:bg-slate-800/30 border-0 rounded-xl text-slate-700 dark:text-slate-300 text-base leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 resize-none transition-all"
            style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
          />
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            메모는 이 세션에만 저장됩니다. 다른 프로젝트와 공유되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
