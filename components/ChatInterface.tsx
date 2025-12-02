import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, ModuleItem, ChatAction } from '../types';
import { Icons } from './Icons';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
  onChatAction?: (action: ChatAction) => void;
}

function parseAIResponse(fullText: string): { chatText: string; action: ChatAction | null } {
  const chatMatch = fullText.match(/<CHAT>([\s\S]*?)<\/CHAT>/);
  const actionMatch = fullText.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
  
  let chatText = fullText;
  let action: ChatAction | null = null;
  
  if (chatMatch) {
    chatText = chatMatch[1].trim();
  } else {
    chatText = fullText
      .replace(/<CHAT>[\s\S]*?<\/CHAT>/g, '')
      .replace(/<ACTION>[\s\S]*?<\/ACTION>/g, '')
      .trim();
  }
  
  if (actionMatch) {
    try {
      const actionJson = actionMatch[1].trim();
      action = JSON.parse(actionJson);
    } catch (e) {
      console.warn('Failed to parse action JSON:', e);
    }
  }
  
  return { chatText, action };
}

function extractDisplayText(text: string): string {
  const chatMatch = text.match(/<CHAT>([\s\S]*?)(<\/CHAT>|$)/);
  if (chatMatch) {
    return chatMatch[1].trim();
  }
  
  let displayText = text
    .replace(/<ACTION>[\s\S]*?<\/ACTION>/g, '')
    .replace(/<ACTION>[\s\S]*$/g, '')
    .trim();
  
  if (displayText.startsWith('<CHAT>')) {
    displayText = displayText.replace('<CHAT>', '').trim();
  }
  
  return displayText;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  modules, 
  setModules,
  onChatAction
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, aiMsg]);

    let fullResponseText = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: [...messages, userMsg].map(m => ({
            role: m.role,
            text: m.text
          })),
          currentModules: modules,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                fullResponseText += data.chunk;
                const displayText = extractDisplayText(fullResponseText);
                
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId 
                    ? { ...msg, text: displayText } 
                    : msg
                ));
              }
              
              if (data.error) {
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMsgId 
                    ? { ...msg, text: data.error, isStreaming: false } 
                    : msg
                ));
              }
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
      }

      const { chatText, action } = parseAIResponse(fullResponseText);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: chatText, isStreaming: false } 
          : msg
      ));

      if (action && action.type !== 'no_action' && onChatAction) {
        console.log('[Chat] Executing action:', action);
        onChatAction(action);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: 'AI 서비스 연결 중 오류가 발생했습니다.', isStreaming: false } 
          : msg
      ));
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-300">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
        <div className="text-center py-4">
           <div className="inline-block p-3 bg-slate-50 dark:bg-slate-900 rounded-full mb-2 transition-colors">
             <Icons.Bot className="text-slate-900 dark:text-slate-100" size={24} />
           </div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Consultant</h3>
           <p className="text-xs text-slate-400 dark:text-slate-500">기능 추가/제거, 예산 조정을 요청하세요</p>
        </div>

        {messages.map((msg, idx) => {
           const isUser = msg.role === 'user';
           return (
            <div
              key={msg.id}
              className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={`max-w-[85%] text-sm leading-relaxed p-0 ${
                  isUser
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                <div className={`inline-block py-2.5 px-4 rounded-2xl transition-colors ${
                  isUser 
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-1.5 ml-1 bg-indigo-500 dark:bg-white rounded-full animate-ping"/>
                    )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white dark:bg-slate-950 border-t border-transparent dark:border-slate-800 transition-colors">
        <div className="relative flex items-center gap-3">
          <button
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="첨부파일"
          >
            <Icons.Attach size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="예: 결제 모듈 제거해줘, MVP로 줄여줘..."
            className="flex-1 py-3 bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-500 focus:outline-none text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 transition-colors duration-200 ${
              input.trim() 
                ? 'text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400' 
                : 'text-slate-200 dark:text-slate-700'
            }`}
          >
            {isLoading ? <Icons.Refresh size={20} className="animate-spin" /> : <Icons.Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
