import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, ModuleItem, ChatAction } from '../types';
import { Icons } from './Icons';

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/chat`;
}

class TypingEffectManager {
  private buffer = '';
  private displayed = '';
  private isTyping = false;
  private callback: ((text: string) => void) | null = null;
  private speed = 10;
  private timerId: NodeJS.Timeout | null = null;

  startTyping(onUpdate: (text: string) => void, speed: number = 10) {
    this.callback = onUpdate;
    this.speed = speed;
    
    if (!this.isTyping) {
      this.isTyping = true;
      this.typeNextChars();
    }
  }

  private typeNextChars = () => {
    if (this.displayed.length < this.buffer.length) {
      const remaining = this.buffer.length - this.displayed.length;
      const charsToAdd = Math.min(2, remaining);
      this.displayed = this.buffer.substring(0, this.displayed.length + charsToAdd);
      
      if (this.callback) {
        this.callback(this.displayed);
      }
      
      this.timerId = setTimeout(this.typeNextChars, this.speed);
    } else {
      this.isTyping = false;
    }
  }

  addToBuffer(text: string) {
    this.buffer += text;
    if (!this.isTyping && this.callback) {
      this.isTyping = true;
      this.typeNextChars();
    }
  }

  reset() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.buffer = '';
    this.displayed = '';
    this.isTyping = false;
  }

  getFullText() {
    return this.buffer;
  }
}

const typingManager = new TypingEffectManager();

interface ChatModelSettings {
  classifyUserIntent?: string;
  streamChatResponse?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
  onChatAction?: (action: ChatAction) => { success: boolean; error?: string };
  modelSettings?: ChatModelSettings;
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

interface PendingAction {
  action: ChatAction;
  messageId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  modules, 
  setModules,
  onChatAction,
  modelSettings
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConfirmAction = () => {
    if (pendingAction && onChatAction) {
      console.log('[Chat] User confirmed action:', pendingAction.action);
      const result = onChatAction(pendingAction.action);
      console.log('[Chat] Action result:', result);
      
      if (result.success) {
        const confirmMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          text: '✅ 변경이 적용되었습니다. 견적이 재산정되었습니다.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMsg]);
      } else {
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          text: `❌ 변경에 실패했습니다: ${result.error || '알 수 없는 오류'}\n\n다시 시도하시거나, 다른 방법으로 요청해 주세요.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    if (pendingAction) {
      console.log('[Chat] User cancelled action:', pendingAction.action);
      
      const cancelMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: '❌ 변경이 취소되었습니다. 다른 질문이 있으시면 말씀해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, cancelMsg]);
      setPendingAction(null);
    }
  };

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

    typingManager.reset();
    let fullResponseText = '';

    try {
      const ws = new WebSocket(getWebSocketUrl());
      
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          console.log('[WebSocket] Connected');
          ws.send(JSON.stringify({
            type: 'chat',
            history: [...messages, userMsg].map(m => ({
              role: m.role,
              text: m.text
            })),
            currentModules: modules,
            modelSettings: modelSettings,
          }));
          resolve();
        };
        
        ws.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          reject(error);
        };
        
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      });

      const updateDisplay = (displayedText: string) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, text: displayedText } 
            : msg
        ));
      };

      typingManager.startTyping(updateDisplay, 10);

      await new Promise<void>((resolve, reject) => {
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'chunk' && data.chunk) {
              fullResponseText += data.chunk;
              const displayText = extractDisplayText(fullResponseText);
              typingManager.addToBuffer(extractDisplayText(data.chunk));
            }
            
            if (data.type === 'done') {
              console.log('[WebSocket] Stream complete');
              ws.close();
              setTimeout(() => resolve(), 500);
            }
            
            if (data.type === 'error') {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId 
                  ? { ...msg, text: data.error || 'AI 서비스 오류', isStreaming: false } 
                  : msg
              ));
              ws.close();
              reject(new Error(data.error));
            }
          } catch (e) {
            console.warn('[WebSocket] JSON parse error:', e);
          }
        };
        
        ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
        };
        
        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };
      });

      const { chatText, action } = parseAIResponse(fullResponseText);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: chatText, isStreaming: false } 
          : msg
      ));

      if (action && action.type !== 'no_action') {
        if (!action.intent) {
          console.warn('[Chat] Action missing intent field, defaulting to command:', action);
          action.intent = 'command';
        }
        
        if (action.intent === 'command') {
          console.log('[Chat] Command detected, awaiting confirmation:', action);
          setPendingAction({ action, messageId: aiMsgId });
        } else if (onChatAction) {
          console.log('[Chat] Executing general action:', action);
          onChatAction(action);
        }
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
        
        {pendingAction && (
          <div className="flex w-full gap-4 flex-row animate-slide-up">
            <div className="max-w-[85%] text-sm leading-relaxed">
              <div className="inline-block py-3 px-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-bl-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Warning className="text-amber-600 dark:text-amber-400" size={18} />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">확인 필요</span>
                </div>
                <p className="text-amber-700 dark:text-amber-300 mb-3">
                  추가 시 재산정이 필요합니다. 진행하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmAction}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-indigo-500 transition-colors"
                  >
                    예, 진행합니다
                  </button>
                  <button
                    onClick={handleCancelAction}
                    className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
            disabled={isLoading || !!pendingAction}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !!pendingAction}
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
