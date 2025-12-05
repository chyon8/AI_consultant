import React, { useEffect, useState } from 'react';
import { FileValidationError, FileValidationErrorCode } from '../types';
import { Icons } from './Icons';

interface FileAttachmentErrorProps {
  errors: FileValidationError[];
  onDismiss: (index: number) => void;
  autoDismissMs?: number;
}

function getErrorIcon(code: FileValidationErrorCode) {
  switch (code) {
    case 'FILE_TOO_LARGE':
      return <Icons.Warning className="text-orange-500" size={18} />;
    case 'UNSUPPORTED_FORMAT':
      return <Icons.Close className="text-red-500" size={18} />;
    case 'MAX_FILES_EXCEEDED':
      return <Icons.Warning className="text-yellow-500" size={18} />;
    case 'DUPLICATE_FILE':
      return <Icons.Copy className="text-blue-500" size={18} />;
    case 'EMPTY_FILE':
      return <Icons.FileText className="text-gray-500" size={18} />;
    case 'UPLOAD_FAILED':
      return <Icons.Warning className="text-red-500" size={18} />;
    default:
      return <Icons.Warning className="text-red-500" size={18} />;
  }
}

function getErrorColor(code: FileValidationErrorCode): string {
  switch (code) {
    case 'FILE_TOO_LARGE':
      return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30';
    case 'UNSUPPORTED_FORMAT':
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30';
    case 'MAX_FILES_EXCEEDED':
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30';
    case 'DUPLICATE_FILE':
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30';
    case 'EMPTY_FILE':
      return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50';
    case 'UPLOAD_FAILED':
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30';
    default:
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30';
  }
}

interface ErrorItemProps {
  error: FileValidationError;
  index: number;
  onDismiss: (index: number) => void;
  autoDismissMs: number;
}

const ErrorItem: React.FC<ErrorItemProps> = ({ error, index, onDismiss, autoDismissMs }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(index), 300);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [index, onDismiss, autoDismissMs]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(index), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg border shadow-lg
        transition-all duration-300 ease-out
        ${getErrorColor(error.code)}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getErrorIcon(error.code)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
            {error.message}
          </span>
        </div>
        {error.fileName && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
            파일: {error.fileName}
          </p>
        )}
        {error.details && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
            {error.details}
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
      >
        <Icons.Close size={14} className="text-slate-400" />
      </button>
    </div>
  );
};

export const FileAttachmentError: React.FC<FileAttachmentErrorProps> = ({
  errors,
  onDismiss,
  autoDismissMs = 5000
}) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((error, index) => (
        <ErrorItem
          key={`${error.code}-${error.fileName || index}-${Date.now()}`}
          error={error}
          index={index}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
};
