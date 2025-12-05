import { FileValidationError, FileValidationErrorCode, FileAttachment, FileAttachmentType } from '../types';

export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_FILES: 10,
  ALLOWED_DOCUMENT_EXTENSIONS: ['.txt', '.pdf', '.doc', '.docx', '.md'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  ALLOWED_DOCUMENT_MIMES: [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown'
  ],
  ALLOWED_IMAGE_MIMES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

export const ALL_ALLOWED_EXTENSIONS = [
  ...FILE_CONSTANTS.ALLOWED_DOCUMENT_EXTENSIONS,
  ...FILE_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS
];

export const ALL_ALLOWED_MIMES = [
  ...FILE_CONSTANTS.ALLOWED_DOCUMENT_MIMES,
  ...FILE_CONSTANTS.ALLOWED_IMAGE_MIMES
];

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileType(file: File): FileAttachmentType {
  const ext = getFileExtension(file.name);
  return FILE_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'document';
}

export function isImageFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  return FILE_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.includes(ext) ||
    FILE_CONSTANTS.ALLOWED_IMAGE_MIMES.includes(file.type);
}

export interface ValidationResult {
  isValid: boolean;
  error?: FileValidationError;
}

export function validateFile(
  file: File,
  existingFiles: File[] = []
): ValidationResult {
  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_FILE',
        message: '빈 파일은 첨부할 수 없습니다.',
        fileName: file.name
      }
    };
  }

  if (file.size > FILE_CONSTANTS.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `파일 크기가 너무 큽니다. (${formatFileSize(file.size)})`,
        fileName: file.name,
        details: `최대 허용 크기: ${formatFileSize(FILE_CONSTANTS.MAX_FILE_SIZE)}`
      }
    };
  }

  const ext = getFileExtension(file.name);
  const isValidExtension = ALL_ALLOWED_EXTENSIONS.includes(ext);
  const isValidMime = ALL_ALLOWED_MIMES.includes(file.type) || file.type === '';
  
  if (!isValidExtension) {
    return {
      isValid: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: `지원하지 않는 파일 형식입니다. (${ext || '확장자 없음'})`,
        fileName: file.name,
        details: `지원 형식: ${ALL_ALLOWED_EXTENSIONS.join(', ')}`
      }
    };
  }

  const isDuplicate = existingFiles.some(
    existingFile => 
      existingFile.name === file.name && 
      existingFile.size === file.size
  );
  
  if (isDuplicate) {
    return {
      isValid: false,
      error: {
        code: 'DUPLICATE_FILE',
        message: '이미 첨부된 파일입니다.',
        fileName: file.name
      }
    };
  }

  return { isValid: true };
}

export function validateFileCount(
  currentCount: number,
  addingCount: number
): ValidationResult {
  const totalCount = currentCount + addingCount;
  
  if (totalCount > FILE_CONSTANTS.MAX_FILES) {
    return {
      isValid: false,
      error: {
        code: 'MAX_FILES_EXCEEDED',
        message: `최대 ${FILE_CONSTANTS.MAX_FILES}개의 파일만 첨부할 수 있습니다.`,
        details: `현재 ${currentCount}개, 추가 시도 ${addingCount}개`
      }
    };
  }
  
  return { isValid: true };
}

export function validateFiles(
  files: File[],
  existingFiles: File[] = []
): { validFiles: File[]; errors: FileValidationError[] } {
  const errors: FileValidationError[] = [];
  const validFiles: File[] = [];
  
  const countResult = validateFileCount(existingFiles.length, files.length);
  if (!countResult.isValid && countResult.error) {
    errors.push(countResult.error);
    return { validFiles, errors };
  }
  
  const allExisting = [...existingFiles];
  
  for (const file of files) {
    const result = validateFile(file, allExisting);
    
    if (result.isValid) {
      validFiles.push(file);
      allExisting.push(file);
    } else if (result.error) {
      errors.push(result.error);
    }
  }
  
  return { validFiles, errors };
}

export function createFileAttachment(file: File, url?: string): FileAttachment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: file.size,
    type: getFileType(file),
    mimeType: file.type,
    url: url
  };
}

export async function createImageThumbnailUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('Not an image file'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

export function getErrorIcon(code: FileValidationErrorCode): string {
  switch (code) {
    case 'FILE_TOO_LARGE':
      return 'size';
    case 'UNSUPPORTED_FORMAT':
      return 'format';
    case 'MAX_FILES_EXCEEDED':
      return 'count';
    case 'DUPLICATE_FILE':
      return 'duplicate';
    case 'EMPTY_FILE':
      return 'empty';
    case 'UPLOAD_FAILED':
      return 'error';
    default:
      return 'error';
  }
}
