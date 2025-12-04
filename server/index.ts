import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { analyzeProject, generateRFP, generateInsight, streamChatResponse, InsightParams } from './services/aiRouter';
import { parseAnalysisResponse } from './services/responseParser';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const fileInfos = files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path,
      size: f.size
    }));
    res.json({ success: true, files: fileInfos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

app.post('/api/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { text, fileContents, modelId } = req.body;
    let fullResponse = '';

    console.log('[Analyze] Starting analysis for:', text?.substring(0, 100), 'with model:', modelId || 'default');

    await analyzeProject(text, fileContents, (chunk: string) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
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

  try {
    const { modules, summary, modelId } = req.body;

    console.log('[RFP] Generating RFP with model:', modelId || 'default');

    await generateRFP(modules, summary, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
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
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { history, currentModules, modelSettings } = req.body;
    
    console.log('[Chat] Using model settings:', modelSettings || 'default');
    
    await streamChatResponse(history, currentModules, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }, modelSettings);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Chat failed' })}\n\n`);
  } finally {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
