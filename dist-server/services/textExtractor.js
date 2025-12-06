import fs from 'fs';
import path from 'path';
import * as mammoth from 'mammoth';
const loadPdfParse = async () => {
    const module = await import('pdf-parse');
    return module.default || module;
};
const MAX_EXTRACTED_LENGTH = 100000;
export async function extractTextFromFile(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();
    try {
        if (ext === '.pdf' || mimeType === 'application/pdf') {
            return await extractFromPDF(filePath);
        }
        if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return await extractFromDocx(filePath);
        }
        if (ext === '.doc' || mimeType === 'application/msword') {
            return {
                success: false,
                error: '.doc 파일은 지원되지 않습니다. .docx 형식으로 변환해주세요.'
            };
        }
        if (ext === '.txt' || ext === '.md' || mimeType.startsWith('text/')) {
            return await extractFromText(filePath);
        }
        return {
            success: false,
            error: `지원되지 않는 파일 형식입니다: ${ext}`
        };
    }
    catch (error) {
        console.error(`[textExtractor] Error extracting from ${filePath}:`, error);
        return {
            success: false,
            error: error.message || '텍스트 추출 중 오류가 발생했습니다.'
        };
    }
}
async function extractFromPDF(filePath) {
    const pdfParse = await loadPdfParse();
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    let text = data.text || '';
    const pageCount = data.numpages || 0;
    if (text.length > MAX_EXTRACTED_LENGTH) {
        text = text.substring(0, MAX_EXTRACTED_LENGTH) +
            `\n\n... [PDF 내용이 너무 길어 ${MAX_EXTRACTED_LENGTH}자로 잘렸습니다. 원본: ${text.length}자, ${pageCount}페이지]`;
    }
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`[textExtractor] PDF extracted: ${wordCount} words, ${pageCount} pages`);
    return {
        success: true,
        text,
        pageCount,
        wordCount
    };
}
async function extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    let text = result.value || '';
    if (text.length > MAX_EXTRACTED_LENGTH) {
        text = text.substring(0, MAX_EXTRACTED_LENGTH) +
            `\n\n... [DOCX 내용이 너무 길어 ${MAX_EXTRACTED_LENGTH}자로 잘렸습니다. 원본: ${text.length}자]`;
    }
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (result.messages && result.messages.length > 0) {
        console.log(`[textExtractor] DOCX extraction warnings:`, result.messages);
    }
    console.log(`[textExtractor] DOCX extracted: ${wordCount} words`);
    return {
        success: true,
        text,
        wordCount
    };
}
async function extractFromText(filePath) {
    let text = fs.readFileSync(filePath, 'utf-8');
    if (text.length > MAX_EXTRACTED_LENGTH) {
        text = text.substring(0, MAX_EXTRACTED_LENGTH) +
            `\n\n... [텍스트 파일이 너무 길어 ${MAX_EXTRACTED_LENGTH}자로 잘렸습니다. 원본: ${text.length}자]`;
    }
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`[textExtractor] Text file extracted: ${wordCount} words`);
    return {
        success: true,
        text,
        wordCount
    };
}
export function isExtractableDocument(mimeType, filename) {
    const ext = path.extname(filename).toLowerCase();
    const extractableExts = ['.pdf', '.docx', '.txt', '.md'];
    const extractableMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ];
    return extractableExts.includes(ext) || extractableMimes.includes(mimeType);
}
