import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as ipaddr from 'ipaddr.js';
import { analyzeProject, generateRFP, generateInsight, streamChatResponse, InsightParams } from './services/aiRouter';
import { extractTextFromFile, isExtractableDocument, ExtractionResult } from './services/textExtractor';
import { parseAnalysisResponse, detectCompletedStages, StageType } from './services/responseParser';
import { jobRegistry, Job } from './services/jobRegistry';

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 5000 : 3001);
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/chat' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const UPLOADS_DIR = 'uploads';
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_DOCUMENT_TYPES = ['.txt', '.pdf', '.doc', '.docx', '.md'];
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALL_ALLOWED_TYPES = [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALL_ALLOWED_TYPES.includes(ext)) {
      cb(null, true);
    } else {
      const error = new Error(`UNSUPPORTED_FORMAT:${file.originalname}:지원하지 않는 파일 형식입니다. (${ext})`);
      cb(error);
    }
  }
});

app.use('/uploads', express.static(UPLOADS_DIR));

function getFileType(filename: string): 'image' | 'document' {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_IMAGE_TYPES.includes(ext) ? 'image' : 'document';
}

function decodeFilename(filename: string): string {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch {
    return filename;
  }
}

const handleUploadError = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '파일 크기가 10MB를 초과했습니다.',
          details: `최대 허용 크기: 10MB`
        }
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MAX_FILES_EXCEEDED',
          message: `최대 ${MAX_FILES}개의 파일만 업로드할 수 있습니다.`,
          details: `현재 제한: ${MAX_FILES}개`
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '파일 업로드 중 오류가 발생했습니다.',
        details: err.message
      }
    });
  }
  
  if (err.message && err.message.startsWith('UNSUPPORTED_FORMAT:')) {
    const parts = err.message.split(':');
    const fileName = parts[1];
    const details = parts[2];
    return res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: details,
        fileName: fileName,
        details: `지원 형식: ${ALL_ALLOWED_TYPES.join(', ')}`
      }
    });
  }
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'UPLOAD_FAILED',
      message: '파일 업로드 중 알 수 없는 오류가 발생했습니다.',
      details: err.message
    }
  });
};

app.post('/api/upload', upload.array('files', MAX_FILES), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: '업로드할 파일이 없습니다.'
        }
      });
    }
    
    const emptyFiles = files.filter(f => f.size === 0);
    if (emptyFiles.length > 0) {
      emptyFiles.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: '빈 파일은 업로드할 수 없습니다.',
          fileName: emptyFiles[0].originalname
        }
      });
    }
    
    const fileInfos = await Promise.all(files.map(async (f) => {
      const decodedName = decodeFilename(f.originalname);
      const fileInfo: any = {
        id: f.filename.split('.')[0],
        filename: f.filename,
        originalName: decodedName,
        path: f.path,
        size: f.size,
        type: getFileType(f.originalname),
        mimeType: f.mimetype,
        url: `/uploads/${f.filename}`
      };
      
      if (isExtractableDocument(f.mimetype, f.originalname)) {
        console.log(`[Upload] Extracting text from: ${decodedName}`);
        const extraction = await extractTextFromFile(f.path, f.mimetype);
        fileInfo.extraction = extraction;
        if (extraction.success) {
          console.log(`[Upload] Extracted ${extraction.wordCount} words from ${decodedName}`);
        } else {
          console.log(`[Upload] Extraction failed for ${decodedName}: ${extraction.error}`);
        }
      }
      
      return fileInfo;
    }));
    
    res.json({ success: true, files: fileInfos });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '파일 업로드 중 오류가 발생했습니다.',
        details: error.message
      }
    });
  }
}, handleUploadError);

interface FileData {
  type: 'text' | 'image';
  name: string;
  content?: string;
  base64?: string;
  mimeType?: string;
}

app.post('/api/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const { text, fileDataList, modelId } = req.body as { text: string; fileDataList: FileData[]; modelId?: string };
    let fullResponse = '';

    console.log('[Analyze] Starting analysis for:', text?.substring(0, 100), 'with model:', modelId || 'default');
    console.log('[Analyze] File data count:', fileDataList?.length || 0);

    await analyzeProject(text, fileDataList || [], (chunk: string) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }, modelId);

    console.log('[Analyze] Full response length:', fullResponse.length);
    console.log('[Analyze] Response contains json:modules?', fullResponse.includes('```json:modules'));
    console.log('[Analyze] Response contains ```json?', fullResponse.includes('```json'));

    const parsedData = parseAnalysisResponse(fullResponse);
    
    console.log('[Analyze] Parsed data:', parsedData ? {
      projectTitle: parsedData.projectTitle,
      modulesCount: parsedData.modules?.length || 0,
      hasEstimates: !!parsedData.estimates
    } : 'null');

    res.write(`data: ${JSON.stringify({ 
      done: true, 
      parsed: parsedData 
    })}\n\n`);
  } catch (error) {
    console.error('Analyze error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Analysis failed' })}\n\n`);
  } finally {
    res.end();
  }
});

app.post('/api/rfp', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 100);

  try {
    const { modules, summary, modelId } = req.body;

    console.log('[RFP] Generating RFP with model:', modelId || 'default');

    await generateRFP(modules, summary, (chunk: string) => {
      const padding = ' '.repeat(2048);
      res.write(`data: ${JSON.stringify({ chunk })}${padding}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }, modelId);

    clearInterval(heartbeat);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    clearInterval(heartbeat);
    console.error('RFP generation error:', error);
    res.write(`data: ${JSON.stringify({ error: 'RFP generation failed' })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 100);

  try {
    const { history, currentModules, modelSettings } = req.body;
    
    console.log('[Chat] Using model settings:', modelSettings || 'default');
    
    await streamChatResponse(history, currentModules, (chunk: string) => {
      const padding = ' '.repeat(2048);
      res.write(`data: ${JSON.stringify({ chunk })}${padding}\n\n`);
    }, modelSettings);
    
    clearInterval(heartbeat);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    clearInterval(heartbeat);
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Chat failed' })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

app.post('/api/insight', async (req, res) => {
  try {
    const { modelId, ...params } = req.body as InsightParams & { modelId?: string };
    console.log('[Insight] Generating insight for:', params.projectName, 'with model:', modelId || 'default');
    
    const insight = await generateInsight(params, modelId);
    console.log('[Insight] Generated:', insight.substring(0, 100));
    
    res.json({ success: true, insight });
  } catch (error) {
    console.error('Insight generation error:', error);
    res.status(500).json({ success: false, error: 'Insight generation failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    console.log('[FetchURL] Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch URL: ${response.status}` });
    }

    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    const maxLength = 50000;
    if (textContent.length > maxLength) {
      textContent = textContent.substring(0, maxLength) + '... (truncated)';
    }

    console.log('[FetchURL] Extracted text length:', textContent.length, 'Title:', title);

    res.json({ 
      success: true, 
      title,
      url,
      content: textContent,
      wordCount: textContent.split(/\s+/).length
    });
  } catch (error: any) {
    console.error('[FetchURL] Error:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch URL' });
  }
});

app.get('/api/jobs/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const jobs = jobRegistry.getJobsBySession(sessionId);
  res.json({ 
    success: true, 
    jobs: jobs.map(j => ({
      id: j.id,
      type: j.type,
      status: j.status,
      progress: j.progress,
      result: j.result,
      error: j.error,
      chunkCount: j.chunkLog.length,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      completedAt: j.completedAt
    }))
  });
});

app.get('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const acknowledgedStages = (req.query.ack as string)?.split(',').filter(Boolean) || [];
  const job = jobRegistry.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  
  const newStagedResults = jobRegistry.getNewStagedResults(jobId, acknowledgedStages as StageType[]);
  
  res.json({ 
    success: true, 
    job: {
      id: job.id,
      sessionId: job.sessionId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      chunkCount: job.chunkLog.length,
      stagedResults: newStagedResults,
      completedStages: Array.from(job.completedStages),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt
    }
  });
});

app.get('/api/jobs/:jobId/chunks', (req, res) => {
  const { jobId } = req.params;
  const afterSequence = parseInt(req.query.after as string) || -1;
  
  const job = jobRegistry.getJob(jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  
  const chunks = jobRegistry.getChunksAfter(jobId, afterSequence);
  res.json({ 
    success: true, 
    chunks,
    totalChunks: job.chunkLog.length,
    status: job.status,
    result: job.status === 'completed' ? job.result : null
  });
});

app.post('/api/jobs/:jobId/cancel', (req, res) => {
  const { jobId } = req.params;
  const cancelled = jobRegistry.cancelJob(jobId);
  
  if (!cancelled) {
    return res.status(400).json({ success: false, error: 'Job cannot be cancelled' });
  }
  
  res.json({ success: true });
});

interface AnalyzeJobRequest {
  sessionId: string;
  text: string;
  fileDataList: FileData[];
  modelId?: string;
}

app.post('/api/jobs/analyze', async (req, res) => {
  const { sessionId, text, fileDataList, modelId } = req.body as AnalyzeJobRequest;
  
  const existingJob = jobRegistry.getActiveJobForSession(sessionId);
  if (existingJob) {
    return res.json({ 
      success: true, 
      job: { id: existingJob.id, status: existingJob.status },
      message: 'Existing job in progress'
    });
  }
  
  const job = jobRegistry.createJob(sessionId, 'analyze', { text, fileDataList, modelId });
  
  res.json({ 
    success: true, 
    job: { id: job.id, status: job.status }
  });
  
  (async () => {
    try {
      jobRegistry.updateJobStatus(job.id, 'running');
      let fullResponse = '';
      const detectedStages = new Set<StageType>();
      
      console.log(`[Job ${job.id}] Starting staged analysis in background`);
      
      await analyzeProject(text, fileDataList || [], (chunk: string) => {
        const currentJob = jobRegistry.getJob(job.id);
        if (currentJob?.status === 'cancelled') {
          throw new Error('Job cancelled');
        }
        
        fullResponse += chunk;
        jobRegistry.appendChunk(job.id, chunk, 'content');
        
        const stageResult = detectCompletedStages(fullResponse, detectedStages);
        if (stageResult) {
          console.log(`[Job ${job.id}] Stage detected: ${stageResult.stage}`);
          detectedStages.add(stageResult.stage);
          jobRegistry.addStagedResult(job.id, stageResult.stage, stageResult.data);
          
          const stageProgress: Record<StageType, number> = {
            modules: 25,
            estimates: 50,
            schedule: 75,
            summary: 90
          };
          jobRegistry.updateJobProgress(job.id, stageProgress[stageResult.stage]);
        }
      }, modelId);
      
      const parsedData = parseAnalysisResponse(fullResponse);
      
      jobRegistry.setJobResult(job.id, parsedData);
      jobRegistry.updateJobProgress(job.id, 100);
      jobRegistry.updateJobStatus(job.id, 'completed');
      
      console.log(`[Job ${job.id}] Completed successfully with ${detectedStages.size} stages`);
      
    } catch (error: any) {
      if (error.message === 'Job cancelled') {
        console.log(`[Job ${job.id}] Was cancelled`);
      } else {
        console.error(`[Job ${job.id}] Failed:`, error);
        jobRegistry.updateJobStatus(job.id, 'failed', error.message);
      }
    }
  })();
});

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected');
  
  ws.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WebSocket] Received message type:', data.type);
      
      if (data.type === 'chat') {
        const { history, currentModules, modelSettings, urls } = data;
        
        console.log('[WebSocket Chat] Using model settings:', modelSettings || 'default');
        console.log('[WebSocket Chat] URLs to fetch:', urls?.length || 0);
        
        let enhancedHistory = [...history];
        
        if (urls && urls.length > 0) {
          let urlContents: string[] = [];
          
          const isPrivateUrl = (urlString: string): boolean => {
            try {
              const parsedUrl = new URL(urlString);
              const protocol = parsedUrl.protocol.toLowerCase();
              if (protocol !== 'http:' && protocol !== 'https:') return true;
              
              let hostname = parsedUrl.hostname.toLowerCase();
              
              if (hostname.startsWith('[') && hostname.endsWith(']')) {
                hostname = hostname.slice(1, -1);
              }
              
              const reservedTLDs = ['.local', '.internal', '.localhost', '.arpa', '.test', '.example', '.invalid', '.onion'];
              if (reservedTLDs.some(tld => hostname.endsWith(tld))) return true;
              if (hostname === 'localhost') return true;
              
              if (ipaddr.isValid(hostname)) {
                const addr = ipaddr.parse(hostname);
                
                if (addr.kind() === 'ipv4') {
                  const ipv4 = addr as ipaddr.IPv4;
                  const range = ipv4.range();
                  const privateRanges = ['loopback', 'private', 'linkLocal', 'carrierGradeNat', 'broadcast', 'unspecified'];
                  if (privateRanges.includes(range)) return true;
                  if (range === 'reserved') return true;
                }
                
                if (addr.kind() === 'ipv6') {
                  const ipv6 = addr as ipaddr.IPv6;
                  const range = ipv6.range();
                  const privateRanges = ['loopback', 'uniqueLocal', 'linkLocal', 'unspecified', 'reserved', 'discard'];
                  if (privateRanges.includes(range)) return true;
                  
                  if (ipv6.isIPv4MappedAddress()) {
                    const mappedIPv4 = ipv6.toIPv4Address();
                    const mappedRange = mappedIPv4.range();
                    const ipv4PrivateRanges = ['loopback', 'private', 'linkLocal', 'carrierGradeNat', 'broadcast', 'unspecified', 'reserved'];
                    if (ipv4PrivateRanges.includes(mappedRange)) return true;
                  }
                }
              } else {
                if (/^\d+$/.test(hostname)) return true;
                if (/^0x[0-9a-f]+$/i.test(hostname)) return true;
                if (/^0[0-7]+(\.[0-7]+)*$/.test(hostname)) return true;
                
                const parts = hostname.split('.');
                if (parts.every(p => /^\d+$/.test(p) || /^0x[0-9a-f]+$/i.test(p) || /^0[0-7]+$/.test(p))) {
                  return true;
                }
              }
              
              return false;
            } catch {
              return true;
            }
          };
          
          for (const url of urls) {
            try {
              if (isPrivateUrl(url)) {
                console.warn('[WebSocket Chat] Blocked private URL:', url);
                continue;
              }
              
              console.log('[WebSocket Chat] Fetching URL:', url);
              const response = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                signal: AbortSignal.timeout(15000)
              });
              
              if (response.ok) {
                const html = await response.text();
                const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
                const title = titleMatch ? titleMatch[1].trim() : url;
                
                let textContent = html
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                  .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                  .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .substring(0, 10000);
                
                urlContents.push(`[웹페이지: ${title}]\nURL: ${url}\n\n${textContent}`);
                console.log('[WebSocket Chat] URL content fetched:', title);
              }
            } catch (err: any) {
              console.warn('[WebSocket Chat] Failed to fetch URL:', url, err.message);
            }
          }
          
          if (urlContents.length > 0 && enhancedHistory.length > 0) {
            const lastIdx = enhancedHistory.length - 1;
            enhancedHistory[lastIdx] = {
              ...enhancedHistory[lastIdx],
              text: enhancedHistory[lastIdx].text + '\n\n--- 참조 웹페이지 내용 ---\n' + urlContents.join('\n\n---\n\n')
            };
          }
        }
        
        await streamChatResponse(enhancedHistory, currentModules, (chunk: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'chunk', chunk }));
          }
        }, modelSettings);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'done' }));
        }
      }
    } catch (error) {
      console.error('[WebSocket Error]:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', error: 'Chat failed' }));
      }
    }
  });
  
  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// Serve static files in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  // Express 5 requires named wildcard parameters
  app.get('/{*path}', (req, res) => {
    const reqPath = req.path;
    if (!reqPath.startsWith('/api') && !reqPath.startsWith('/uploads') && !reqPath.startsWith('/ws')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log(`[Production] Serving static files from ${distPath}`);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
