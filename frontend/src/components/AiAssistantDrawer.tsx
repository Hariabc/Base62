import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Bot, Loader2, ArrowRight, X, Clock, Compass
} from 'lucide-react';
import { AiChatMessage, AiInsights, UrlItem } from '../types';
import { aiApi } from '../api/client';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUrl: UrlItem | null;
  initialQuestion?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  selectedUrl,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadInsights();
      if (messages.length === 0) {
        initWelcomeMessage();
      }
    }
  }, [isOpen, selectedUrl]);

  useEffect(() => {
    if (isOpen && initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [isOpen, initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadInsights = async () => {
    try {
      const data = selectedUrl
        ? await aiApi.getUrlInsights(selectedUrl.id)
        : await aiApi.getOverallInsights();
      setInsights(data);
    } catch (e) {
      console.error('Failed to load AI insights', e);
    }
  };

  const initWelcomeMessage = () => {
    const welcomeText = selectedUrl
      ? `Hello! I have analyzed traffic telemetry for **${selectedUrl.title}**. Ask me about traffic changes, optimal posting times, or engagement tips.`
      : `Hello! I monitor your links and telemetry stream. Ask me questions like *"Why did traffic drop this week?"* or *"How can I improve click rates?"*`;

    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'Why did link traffic decrease this week?',
          'How can I improve click conversion rate?',
          'Forecast next week\'s traffic volume',
        ],
      },
    ]);
  };

  const handleSend = async (questionText?: string) => {
    const query = questionText || inputValue.trim();
    if (!query || loading) return;

    const userMsg: AiChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputValue('');
    setLoading(true);

    try {
      const response = await aiApi.chat(query, selectedUrl?.id);
      const aiMsg: AiChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: response.suggestedFollowUps,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Unable to analyze that query right now. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in-50 duration-150">
      <div className="w-full max-w-lg bg-theme-page border-l border-theme-border h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-theme-border bg-theme-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-palette-terracotta text-palette-cream flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-bold text-theme-main text-sm">AI Assistant</h2>
              <p className="text-[11px] text-theme-muted">
                {selectedUrl ? selectedUrl.title : 'Global Telemetry Insights'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-faint hover:text-theme-main hover:bg-theme-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Health Score Pill */}
        {insights && (
          <div className="p-3.5 bg-theme-subtle/50 border-b border-theme-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-theme-muted font-medium">Health Score:</span>
              <span className="font-mono font-bold text-palette-terracotta">{insights.engagementScore}/100</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-theme-muted">
              <Clock className="w-3 h-3 text-palette-amber" />
              <span>{insights.optimalPostingWindow}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'bg-palette-terracotta text-palette-cream rounded-tr-none shadow-xs font-medium'
                    : 'bg-theme-card border border-theme-border text-theme-main rounded-tl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <div
                  className={`text-[9px] mt-1 font-mono ${
                    msg.sender === 'user' ? 'text-palette-cream/70 text-right' : 'text-theme-faint'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {/* Follow-up Chips */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.suggestedFollowUps.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(question)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-subtle text-theme-muted hover:text-theme-main border border-theme-border transition-colors flex items-center gap-1"
                    >
                      <span>{question}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-palette-terracotta" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-theme-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-palette-terracotta" />
              <span>Analyzing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-theme-border bg-theme-card/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question about your traffic..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-theme-page border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded-xl bg-palette-terracotta hover:bg-brand-700 text-palette-cream disabled:opacity-40 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
