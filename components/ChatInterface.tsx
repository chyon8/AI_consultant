import React, { useRef, useEffect, useState } from 'react';
import { Message, ModuleItem } from '../types';
import { Icons } from './Icons';
import { streamGeminiResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  modules: ModuleItem[];
  setModules: React.Dispatch<React.SetStateAction<ModuleItem[]>>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  modules, 
  setModules 
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

    await streamGeminiResponse(
      [...messages, userMsg],
      modules,
      (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, text: msg.text + chunk } 
            : msg
        ));
      }
    );

    setMessages(prev => prev.map(msg => 
      msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
    ));
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 relative transition-colors duration-300">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
        <div className="text-center py-4">
           <div className="inline-block p-3 bg-slate-50 dark:bg-slate-900 rounded-full mb-2 transition-colors">
             <Icons.Bot className="text-slate-900 dark:text-slate-100" size={24} />
           </div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Consultant</h3>
           <p className="text-xs text-slate-400 dark:text-slate-500">Ask about features & budget</p>
        </div>

        {messages.map((msg, idx) => {
           const isUser = msg.role === 'user';
           return (
            <div
              key={msg.id}
              className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Bubble */}
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
                    {msg.text}
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

      {/* Minimal Input Area */}
      <div className="p-6 bg-white dark:bg-slate-950 border-t border-transparent dark:border-slate-800 transition-colors">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your requirements..."
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