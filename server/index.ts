import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { analyzeProject, generateRFP, generateInsight, streamChatResponse, InsightParams } from './services/aiRouter';
import { parseAnalysisResponse } from './services/responseParser';

const app = express();
const PORT = process.env.PORT || 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/chat' });

app.use(cors());
app.use(express.json());

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

app.post('/api/upload', upload.array('files', MAX_FILES), (req, res) => {
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
    
    const fileInfos = files.map(f => ({
      id: f.filename.split('.')[0],
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size,
      type: getFileType(f.originalname),
      mimeType: f.mimetype,
      url: `/uploads/${f.filename}`
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

app.post('/api/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const { text, fileContents, modelId } = req.body;
    let fullResponse = '';

    console.log('[Analyze] Starting analysis for:', text?.substring(0, 100), 'with model:', modelId || 'default');

    await analyzeProject(text, fileContents, (chunk: string) => {
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
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const { modules, summary, modelId } = req.body;

    console.log('[RFP] Generating RFP with model:', modelId || 'default');

    await generateRFP(modules, summary, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }, modelId);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    console.error('RFP generation error:', error);
    res.write(`data: ${JSON.stringify({ error: 'RFP generation failed' })}\n\n`);
  } finally {
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

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Client connected');
  
  ws.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WebSocket] Received message type:', data.type);
      
      if (data.type === 'chat') {
        const { history, currentModules, modelSettings } = data;
        
        console.log('[WebSocket Chat] Using model settings:', modelSettings || 'default');
        
        await streamChatResponse(history, currentModules, (chunk: string) => {
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
