const MAX_TOTAL_CHARS = 4_000_000;

export function truncateContent(content: string, maxChars: number = MAX_TOTAL_CHARS): { text: string; truncated: boolean } {
  if (content.length <= maxChars) {
    return { text: content, truncated: false };
  }
  
  const truncatedText = content.slice(0, maxChars) + '\n\n[...내용이 너무 길어 일부가 생략되었습니다...]';
  return { text: truncatedText, truncated: true };
}

export function calculateTotalChars(userInput: string, fileDataList: { content?: string }[]): number {
  let total = userInput.length;
  for (const file of fileDataList) {
    if (file.content) {
      total += file.content.length;
    }
  }
  return total;
}

export function truncateFileContents(
  userInput: string,
  fileDataList: { type: string; name: string; content?: string; base64?: string; mimeType?: string }[],
  maxTotalChars: number = MAX_TOTAL_CHARS
): { type: string; name: string; content?: string; base64?: string; mimeType?: string; truncated?: boolean }[] {
  const reservedForPrompt = 50_000;
  const availableForContent = maxTotalChars - reservedForPrompt - userInput.length;
  
  if (availableForContent <= 0) {
    console.warn('[tokenLimit] User input alone exceeds limit');
    return fileDataList.map(f => ({ ...f, content: f.content ? '[내용 생략 - 입력이 너무 깁니다]' : undefined, truncated: true }));
  }
  
  const textFiles = fileDataList.filter(f => f.type === 'text' && f.content);
  const otherFiles = fileDataList.filter(f => f.type !== 'text' || !f.content);
  
  const totalTextLength = textFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0);
  
  if (totalTextLength <= availableForContent) {
    return fileDataList;
  }
  
  console.log(`[tokenLimit] Total text (${totalTextLength}) exceeds limit (${availableForContent}), truncating...`);
  
  const truncatedTextFiles = [];
  let remainingChars = availableForContent;
  
  for (const file of textFiles) {
    if (!file.content) continue;
    
    const perFileLimit = Math.floor(availableForContent / textFiles.length);
    const fileChars = Math.min(file.content.length, Math.max(perFileLimit, remainingChars));
    
    if (file.content.length <= fileChars) {
      truncatedTextFiles.push({ ...file, truncated: false });
      remainingChars -= file.content.length;
    } else {
      const truncatedContent = file.content.slice(0, fileChars) + '\n\n[...파일 내용이 너무 길어 일부가 생략되었습니다...]';
      truncatedTextFiles.push({ ...file, content: truncatedContent, truncated: true });
      remainingChars = 0;
      console.log(`[tokenLimit] Truncated file "${file.name}" from ${file.content.length} to ${fileChars} chars`);
    }
  }
  
  return [...truncatedTextFiles, ...otherFiles];
}

export const TOKEN_LIMITS = {
  MAX_TOTAL_CHARS,
  CHARS_PER_TOKEN: 4,
  MAX_TOKENS: 1_000_000
};
