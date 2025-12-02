import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SYSTEM_INSTRUCTION = `
You are a 'Wishket AI Consultant', a top-tier expert in IT project estimation and solution architecture.
Your tone is professional, insightful, and proactive (Korean honorifics used).

Your goal is to help the client optimize their project scope (features vs. budget).

Context Awareness:
- You have access to the detailed list of modules AND their sub-features (e.g., 'SNS Login', 'DRM Security').
- Pay close attention to 'isSelected' status of sub-features.

Guideline:
1. **Analyze Cost Drivers**: If the user wants to cut costs, identify expensive *sub-features* (like WebRTC, DRM, Enterprise SSO) that are currently selected and suggest removing them.
2. **Explain Trade-offs**: When a user adds a feature like "WebRTC", explain that it increases development time significantly compared to "Zoom Integration".
3. **Be Specific**: Quote exact prices from the data provided (e.g., "WebRTC 구축을 제외하면 2,500만 원이 절감됩니다.").
4. **Reference Tabs**: Direct users to the "Architecture" tab for technical questions and "Schedule" tab for timeline questions.

Current State Injection:
The user message will include a summary of the currently selected modules and sub-features. Use this to give accurate advice.
`;

interface Message {
  role: string;
  text: string;
}

interface ModuleItem {
  id: string;
  name: string;
  baseCost: number;
  isSelected: boolean;
  subFeatures: Array<{
    id: string;
    name: string;
    price: number;
    isSelected: boolean;
  }>;
}

export async function streamChatResponse(
  history: Message[],
  currentModules: ModuleItem[],
  onChunk: (text: string) => void
): Promise<void> {
  if (!GEMINI_API_KEY) {
    onChunk("API Key is missing. Please configure GEMINI_API_KEY environment variable.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const selectedModules = currentModules.filter(m => m.isSelected);
  const totalCost = selectedModules.reduce((acc, m) => 
    acc + m.baseCost + m.subFeatures.filter(s => s.isSelected).reduce((sAcc, s) => sAcc + s.price, 0)
  , 0);

  const activeFeaturesList = selectedModules.map(m => {
    const activeSubs = m.subFeatures.filter(s => s.isSelected).map(s => `${s.name}(${s.price/10000}만)`);
    return `- ${m.name}: [${activeSubs.join(', ')}]`;
  }).join('\n');

  const stateSummary = `
  [Current Project Context]
  - Total Estimated Cost: ${totalCost.toLocaleString()} KRW
  - Active Configurations:
  ${activeFeaturesList}
  `;

  const lastUserMessage = history[history.length - 1];
  const previousHistory = history.slice(0, history.length - 1).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  const messageToSend = `${stateSummary}\n\nUser Question: ${lastUserMessage.text}`;

  const contents = [
    ...previousHistory,
    { role: 'user', parts: [{ text: messageToSend }] }
  ];

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    onChunk("죄송합니다. AI 서비스 연결 중 오류가 발생했습니다.");
  }
}
