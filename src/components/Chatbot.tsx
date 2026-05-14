import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles, MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOrCreateViewerKey, getRecentViews, sendChatbotMessage, type ChatbotSuggestion } from '../lib/api';
import { cldUrl } from '../lib/cloudinary';

type MessageRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  suggestions?: ChatbotSuggestion[];
  source?: 'gemini' | 'rules' | 'fallback';
  clarifyingQuestion?: string | null;
  error?: boolean;
};

const highlightColors: Record<string, string> = {
  primary: 'border-primary/40 bg-primary/5',
  secondary: 'border-cyan-400/30 bg-cyan-400/5',
  highlight: 'border-rose-400/30 bg-rose-400/5',
};

const highlightDots: Record<string, string> = {
  primary: 'bg-primary shadow-[0_0_8px_rgba(233,195,73,0.6)]',
  secondary: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]',
  highlight: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
};

const QUICK_CHIPS = [
  'Recommend a beach trip',
  'I want culture and history',
  'Best photo spots?',
  'Food-focused trip',
  'Somewhere chill for a weekend',
];

const CLARIFYING_CHIPS = ['Beach sunset', 'Culture and history', 'Food trip', 'Nature escape', 'Photo spots'];

function createMessage(role: MessageRole, content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...extra,
  };
}

export default function Chatbot({ setActiveTab, currentLocationId }: { setActiveTab: (tab: string) => void; currentLocationId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', 'Hey traveler! Tell me what kind of trip you want, and I will suggest the best matching destinations from our journal.'),
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isOpen]);

  const canSend = useMemo(() => !sending && input.trim().length > 0, [sending, input]);

  const resetConversation = () => {
    setMessages([
      createMessage('assistant', 'Fresh start. Tell me your vibe, food mood, weather, duration, or whether you want beach, culture, food, nature, or photo spots.'),
    ]);
    setInput('');
    setError('');
  };

  const submitMessage = async (content: string) => {
    const normalized = content.trim();
    if (!normalized || sending) return;

    const userMessage = createMessage('user', normalized);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError('');
    setSending(true);

    const history = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-12)
      .map(msg => ({ role: msg.role, content: msg.content }));

    try {
      const response = await sendChatbotMessage({
        message: normalized,
        history,
        current_location_id: currentLocationId,
        viewer_key: getOrCreateViewerKey(),
        recent_location_ids: getRecentViews(),
      });

      setMessages(prev => [
        ...prev,
        createMessage('assistant', response.reply, {
          suggestions: response.suggestions || [],
          source: response.source,
          clarifyingQuestion: response.clarifying_question,
        }),
      ]);
    } catch (err: any) {
      const detail = err?.message || 'Could not fetch chatbot reply. Please try again.';
      setError(detail);
      setMessages(prev => [
        ...prev,
        createMessage('assistant', 'I am having trouble right now. Please try again in a moment.', { error: true }),
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  const open = () => setIsOpen(v => !v);

  const chipOptions = useMemo(() => {
    const contextual = currentLocationId ? ['Tell me about this place'] : [];
    return [...QUICK_CHIPS, ...contextual];
  }, [currentLocationId]);

  return (
    <>
      <div className="fixed bottom-8 right-32 z-50">
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.08 }}
          onClick={open}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-background shadow-[0_0_24px_rgba(233,195,73,0.5)] hover:shadow-[0_0_36px_rgba(233,195,73,0.7)] border border-primary/50 transition-all cursor-pointer"
          aria-label="Chat with trip assistant"
        >
          {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-28 right-8 z-50 w-[380px] max-h-[560px] rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                  <Sparkles size={12} className="text-primary" />
                </div>
                <span className="text-[11px] font-tech uppercase tracking-[0.2em] text-primary">Trip Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={resetConversation}
                  className="text-[10px] font-tech uppercase tracking-[0.15em] text-secondary/60 hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={10} />
                  New
                </motion.button>
                <span className="text-[10px] font-tech text-secondary/40">{sending ? 'Thinking…' : 'Chat'}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-xl px-3 py-2.5 border ${msg.role === 'user' ? 'bg-primary/15 border-primary/30 text-on-surface' : msg.error ? 'bg-rose-500/10 border-rose-400/30 text-rose-200' : 'bg-white/[0.03] border-white/10 text-on-surface/90'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none [&_p]:text-[12px] [&_p]:leading-relaxed [&_p]:m-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:text-[12px] [&_strong]:text-on-surface">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {!!msg.suggestions?.length && (
                      <div className="mt-3 space-y-2">
                        {msg.suggestions.map((rec) => {
                          const targetTab = rec.action === 'gallery' ? `Gallery:${rec.id}` : `Destinations:${rec.id}`;
                          return (
                            <motion.button
                              key={`${msg.id}-${rec.id}`}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setIsOpen(false);
                                setActiveTab(targetTab);
                              }}
                              className={`w-full text-left rounded-xl border p-2.5 transition-all cursor-pointer hover:border-primary/40 hover:bg-white/[0.04] ${highlightColors[rec.highlight_type] || highlightColors.secondary}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 overflow-hidden">
                                  {rec.img ? (
                                    <img
                                      src={cldUrl(rec.img, { width: 200 })}
                                      alt={rec.name}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <MapPin size={14} className="text-primary/50" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${highlightDots[rec.highlight_type] || highlightDots.secondary}`} />
                                    <span className="text-xs font-semibold text-on-surface truncate">{rec.name}</span>
                                  </div>
                                  <p className="text-[10px] text-secondary/50 mt-0.5 truncate">{rec.chapter} — {rec.short_desc}</p>
                                  {!!rec.why_matched?.length && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {rec.why_matched.slice(0, 2).map((reason) => (
                                        <span key={`${rec.id}-${reason}`} className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-tech uppercase tracking-wider text-secondary/70">
                                          {reason}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {msg.clarifyingQuestion && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-tech uppercase tracking-[0.16em] text-secondary/50">Refine</p>
                        <div className="flex flex-wrap gap-1.5">
                          {CLARIFYING_CHIPS.map((chip) => (
                            <button
                              key={`${msg.id}-${chip}`}
                              type="button"
                              onClick={() => submitMessage(chip)}
                              disabled={sending}
                              className="px-2 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-tech uppercase tracking-wider text-secondary/70 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2 border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center gap-2 text-secondary/60 text-[11px] font-tech uppercase tracking-widest">
                      <Bot size={12} className="text-primary" />
                      thinking
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[11px] text-rose-400 text-center">{error}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-white/5 space-y-3 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {chipOptions.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submitMessage(chip)}
                    disabled={sending}
                    className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-tech uppercase tracking-wider text-secondary/70 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value.slice(0, 1000))}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask about beach, culture, food, photo spots..."
                  className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:border-primary/40"
                />
                <button
                  type="button"
                  onClick={() => submitMessage(input)}
                  disabled={!canSend}
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary text-background border border-primary/50 shadow-[0_0_14px_rgba(233,195,73,0.35)] hover:shadow-[0_0_22px_rgba(233,195,73,0.55)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[10px] text-secondary/35">Enter to send, Shift+Enter for newline.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
