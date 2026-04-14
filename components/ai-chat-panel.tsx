'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: { tool: string; input: any; result: any }[];
}

const STARTER_QUESTIONS = [
  'Add a $10,000 emergency fund goal by December',
  "Set my Food and Drink budget to $500",
  "What's my biggest recurring expense?",
  'Analyze my investment portfolio',
];

// Friendly labels for tool actions
const TOOL_LABELS: Record<string, (input: any, result: any) => string> = {
  create_goal: (input) => `Created goal: ${input.name} ($${input.target?.toLocaleString()})`,
  update_goal: (input) => `Updated goal`,
  delete_goal: () => `Deleted goal`,
  list_goals: (_, result) => `Listed ${result?.result?.goals?.length ?? 0} goals`,
  set_budget_target: (input) => `Set ${input.category} budget to $${input.amount}`,
  create_budget_category: (input) => `Created ${input.section} budget: ${input.emoji || '💰'} ${input.name} ($${input.amount}/mo)`,
  exclude_from_recurring: (input) => `Hid ${input.merchant} from recurring`,
  update_transaction: (input) => `Updated transaction`,
  update_setting: (input) => `Updated setting: ${input.key}`,
  add_manual_recurring: (input) => `Added ${input.type}: ${input.name} ($${input.amount} ${input.frequency})`,
  rename_category: (input) => `Renamed "${input.original_category}" → "${input.new_name}"`,
  create_rule: (input) => `Created rule: when merchant contains "${input.merchant_pattern}"`,
  hide_account: () => `Hid account from totals`,
};

export function AIChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { sendChatMessage, isUsingMockData, refreshAllUserData } = useData();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Listen for "Ask AI" events from other pages
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ prompt: string }>;
      const prompt = ce.detail?.prompt;
      if (prompt) {
        window.dispatchEvent(new CustomEvent('flourish:open-ai-chat'));
        setTimeout(() => handleSend(prompt), 200);
      }
    };
    window.addEventListener('flourish:ask-ai', handler);
    return () => window.removeEventListener('flourish:ask-ai', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: 'Please sign in to chat with your AI Assistant and let me take actions on your behalf.' },
      ]);
      setInput('');
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const { response, actions } = await sendChatMessage(message, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: response, actions }]);

      // If AI took actions that modify user data, refresh
      if (actions && actions.length > 0) {
        await refreshAllUserData();
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I ran into an error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90] bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-[95] w-full sm:w-[480px] h-screen bg-white shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-flourish-border bg-gradient-to-r from-flourish-orange/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-flourish-orange/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-flourish-orange" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-flourish-dark">AI Assistant</h2>
              <p className="text-xs text-flourish-secondary">
                {isUsingMockData ? 'Demo mode — sign in for real data' : 'Can answer questions and take actions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors"
          >
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col h-full justify-center">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-flourish-orange/20 to-flourish-orange/5 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-flourish-orange" />
                </div>
                <h3 className="font-display text-lg font-bold text-flourish-dark mb-1">
                  How can I help?
                </h3>
                <p className="text-sm text-flourish-secondary">
                  Ask questions or tell me to do something
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-flourish-secondary mb-3">
                  Try this
                </p>
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-flourish-border hover:border-flourish-orange hover:bg-flourish-orange/5 transition-colors text-sm text-flourish-dark"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-flourish-orange text-white rounded-br-md ml-auto'
                        : 'bg-[#fdf8f4] text-flourish-dark rounded-bl-md'
                    } ${msg.role === 'user' ? 'inline-block' : ''}`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Action pills */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.actions.map((a, i) => {
                        const label = TOOL_LABELS[a.tool]?.(a.input, a.result) ?? a.tool;
                        const ok = a.result?.success !== false;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              ok
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            <span className="font-medium">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#fdf8f4] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-flourish-orange" />
                <span className="text-sm text-flourish-secondary">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-flourish-border">
          <div className="flex items-center gap-2 bg-[#fdf8f4] rounded-2xl px-4 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or give a command..."
              className="flex-1 bg-transparent text-sm text-flourish-dark placeholder-flourish-secondary outline-none"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-flourish-orange text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-flourish-secondary text-center mt-2">
            AI can take actions on your behalf. Verify important decisions.
          </p>
        </div>
      </div>
    </>
  );
}
