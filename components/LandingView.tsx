import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icons } from './Icons';
import { FileValidationError } from '../types';
import { FileAttachmentError } from './FileAttachmentError';
import { validateFiles, isImageFile, createImageThumbnailUrl, FILE_CONSTANTS } from '../utils/fileValidation';

interface LandingViewProps {
  onAnalyze: (text: string, files: File[]) => void;
  onAbort?: () => void;
  isLoading: boolean;
}

interface AttachedFileWithPreview {
  file: File;
  id: string;
  previewUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const LandingView: React.FC<LandingViewProps> = ({ onAnalyze, onAbort, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileWithPreview[]>([]);
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);
    
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const existingFileObjects = attachedFiles.map(af => af.file);
    const { validFiles, errors } = validateFiles(newFiles, existingFileObjects);
    
    if (errors.length > 0) {
      setValidationErrors(prev => [...prev, ...errors]);
    }
    
    if (validFiles.length > 0) {
      const filesWithPreviews: AttachedFileWithPreview[] = await Promise.all(
        validFiles.map(async (file) => {
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          let previewUrl: string | undefined;
          
          if (isImageFile(file)) {
            try {
              previewUrl = await createImageThumbnailUrl(file);
            } catch (e) {
              console.warn('Failed to create thumbnail:', e);
            }
          }
          
          return { file, id, previewUrl };
        })
      );
      
      setAttachedFiles(prev => [...prev, ...filesWithPreviews]);
    }
  }, [attachedFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      addFiles(newFiles);
      e.target.value = '';
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const dismissError = useCallback((index: number) => {
    setValidationErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const handleSubmit = () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;
    onAnalyze(inputText, attachedFiles.map(af => af.file));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-8 shadow-xl shadow-indigo-500/20 animate-pulse">
            <Icons.Bot size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            프로젝트를 분석하고 있습니다
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-8">
            AI가 모듈 구조, 견적, 일정을 분석 중입니다...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={dropZoneRef}
      className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 px-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-500/10 dark:bg-indigo-500/20 border-2 border-dashed border-indigo-500 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Icons.Upload size={48} className="mx-auto mb-3 text-indigo-500" />
            <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
              파일을 여기에 놓으세요
            </p>
            <p className="text-sm text-indigo-500/70 dark:text-indigo-400/70 mt-1">
              이미지, PDF, 문서 파일 지원 (최대 {FILE_CONSTANTS.MAX_FILES}개)
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-xl shadow-indigo-500/20">
            <Icons.Bot size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            프로젝트 견적 AI 컨설턴트
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            프로젝트 내용을 입력하시면 AI가 기능 범위, 상세 견적, 
            일정을 분석하고 공고문까지 작성해드립니다.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 transition-colors">
          {attachedFiles.length > 0 && (
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
              {attachedFiles.map((af) => (
                <div
                  key={af.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-sm border border-slate-200 dark:border-slate-700"
                >
                  {af.previewUrl ? (
                    <img 
                      src={af.previewUrl} 
                      alt={af.file.name}
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : (
                    <Icons.FileText size={14} className="text-slate-400" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-slate-700 dark:text-slate-300 max-w-[120px] truncate text-xs">
                      {af.file.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatFileSize(af.file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(af.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Icons.Close size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3 p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx,.md,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-all ${
                attachedFiles.length >= FILE_CONSTANTS.MAX_FILES
                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
              title={attachedFiles.length >= FILE_CONSTANTS.MAX_FILES 
                ? `최대 ${FILE_CONSTANTS.MAX_FILES}개 파일까지 첨부 가능` 
                : '파일 첨부 (드래그 앤 드롭 가능)'
              }
              disabled={attachedFiles.length >= FILE_CONSTANTS.MAX_FILES}
            >
              <Icons.Attach size={22} />
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFiles.length > 0 
                ? "파일과 함께 프로젝트 설명을 입력하세요..." 
                : "프로젝트 요구사항을 입력하거나 파일을 드래그해서 첨부해주세요..."
              }
              className="flex-1 py-3 px-2 bg-transparent resize-none text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-h-[52px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />

            {isLoading ? (
              <button
                onClick={onAbort}
                className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg"
                title="생성 중단"
              >
                <Icons.Square size={20} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!inputText.trim() && attachedFiles.length === 0}
                className={`p-3 rounded-xl transition-all ${
                  inputText.trim() || attachedFiles.length > 0
                    ? 'bg-slate-900 dark:bg-indigo-500 text-white hover:bg-black dark:hover:bg-indigo-600 shadow-lg'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                <Icons.Send size={22} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {['LMS 플랫폼', '이커머스 앱', 'IoT 대시보드', 'SaaS MVP'].map((example) => (
            <button
              key={example}
              onClick={() => setInputText(`${example} 개발 프로젝트를 진행하려고 합니다.`)}
              className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <FileAttachmentError 
        errors={validationErrors}
        onDismiss={dismissError}
        autoDismissMs={5000}
      />
    </div>
  );
};
