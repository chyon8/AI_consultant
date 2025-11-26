import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { analyzeProject } from './services/geminiService';
import { generateRFP } from './services/rfpService';
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
    const { text, fileContents } = req.body;
    let fullResponse = '';

    await analyzeProject(text, fileContents, (chunk: string) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    const parsedData = parseAnalysisResponse(fullResponse);
    
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
    const { modules, summary } = req.body;

    await generateRFP(modules, summary, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    console.error('RFP generation error:', error);
    res.write(`data: ${JSON.stringify({ error: 'RFP generation failed' })}\n\n`);
  } finally {
    res.end();
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
