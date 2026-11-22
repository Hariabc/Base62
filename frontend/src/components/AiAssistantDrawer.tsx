import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Bot, User as UserIcon, Loader2, ArrowRight,
  Lightbulb, Compass, Clock, CheckCircle2, X
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
  const [insightsLoading, setInsightsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load insights whenever drawer opens or selectedUrl changes
  useEffect(() => {
    if (isOpen) {
      loadInsights();
      if (messages.length === 0) {
        initWelcomeMessage();
      }
    }
  }, [isOpen, selectedUrl]);

  // Handle initial auto-query if provided
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
      setInsightsLoading(true);
      const data = selectedUrl
        ? await aiApi.getUrlInsights(selectedUrl.id)
        : await aiApi.getOverallInsights();
      setInsights(data);
    } catch (e) {
      console.error('Failed to load AI insights', e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const initWelcomeMessage = () => {
    const welcomeText = selectedUrl
      ? `Hello! I am Base62 AI. I have analyzed telemetry for **${selectedUrl.title}**. You can ask me why traffic changed, how to boost engagement, or forecast clicks.`
      : `Hello! I am Base62 AI. I monitor your entire URL platform. Ask me questions like *"Why did my traffic decrease this week?"* or *"How can I improve click rates?"*`;

    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'Why did my link traffic decrease this week?',
          'How can I improve click conversion rate?',
          'Forecast next week\'s traffic volume',
          'What is the best time to share this link?',
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
        quickInsights: response.quickInsights,
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (response.quickInsights) {
        setInsights(response.quickInsights);
      }
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue analyzing that request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in-50 duration-200">
      <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Base62 AI Assistant</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  GPT-4o / Heuristic Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedUrl ? `Target: ${selectedUrl.title}` : 'Target: Portfolio Overview'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Health Score Header Card */}
        {insights && (
          <div className="p-4 bg-gradient-to-r from-slate-900 to-purple-950/40 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Engagement Health Score
              </span>
              <span className="text-xs font-mono font-bold text-purple-300">
                {insights.engagementScore} / 100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${insights.engagementScore}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <Clock className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                <span className="truncate">Best: {insights.optimalPostingWindow}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <Compass className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Audience: {insights.dominantAudience}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[85%]">
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-600/25'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      msg.sender === 'user' ? 'text-brand-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/30">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Suggested Follow-Ups */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5">
                  {msg.suggestedFollowUps.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(question)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 transition-all flex items-center gap-1"
                    >
                      <span>{question}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 ml-9">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Analyzing telemetry with AI...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Base62 AI (e.g. Why did traffic decrease?)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white disabled:opacity-50 transition-all shadow-md shadow-purple-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
