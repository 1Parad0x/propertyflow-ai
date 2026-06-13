'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import ContextPanel, { ChatContext } from '@/components/ContextPanel';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types';

type Message = {
  role: string;
  content: string;
  properties?: Property[];
};

const GREETING = "Hi, I'm the PropertyFlow assistant. Are you looking to rent or buy?";

const QUICK_REPLIES = ['Rent', 'Buy', 'Search the whole city', 'Yes, please', 'No, thanks'];

const INITIAL_CONTEXT: ChatContext = {
  transaction: null,
  city: null,
  district: null,
  budget: null,
  rooms: null,
  status: 'greeting',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING }
  ]);
  const [context, setContext] = useState<ChatContext>(INITIAL_CONTEXT);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const completed = context.status === 'completed';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Something went wrong: ${data.error || 'the service is temporarily unavailable.'}` }]);
        return;
      }

      setMessages([...newMessages, {
        role: 'assistant',
        content: data.message.content,
        ...(data.properties ? { properties: data.properties } : {}),
      }]);

      if (data.context) {
        setContext((prev) => ({ ...prev, ...data.context }));
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Connection error — please check your network and try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const restart = () => {
    setMessages([
      { role: 'assistant', content: GREETING }
    ]);
    setContext(INITIAL_CONTEXT);
  };

  return (
    <div className="absolute inset-0 bg-[var(--color-paper)] bg-grain text-[var(--color-ink)] flex flex-col overflow-hidden">

      <header className="vt-skip w-full px-6 md:px-10 py-5 border-b border-[var(--color-line)] flex justify-between items-center shrink-0 bg-[var(--color-paper)]/90 backdrop-blur-sm z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 border-[1.5px] border-[var(--color-ink)] rounded-full flex items-center justify-center group-hover:bg-[var(--color-ink)] group-hover:text-[var(--color-paper)] transition-colors">
            <span className="font-display text-base">P</span>
          </div>
          <div>
            <div className="font-display text-base leading-none">PropertyFlow</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)] mt-0.5">
              Assistant — live
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/leads"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--color-mute)] hover:text-[var(--color-ink)] border border-[var(--color-line)] hover:border-[var(--color-ink)] rounded-full px-4 py-2 transition-colors"
          >
            Leads dashboard
          </Link>
        </div>
      </header>

      <div className="flex-1 w-full max-w-6xl mx-auto flex overflow-hidden relative">

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-8 space-y-5 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-3">
                <div
                  className={`flex gap-3 animate-fade-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-7 h-7 rounded-full border border-[var(--color-line-strong)] flex items-center justify-center text-[10px] font-mono text-[var(--color-mute)] mt-1 shrink-0">
                      AI
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[78%] text-[15px] leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] rounded-tr-sm'
                        : 'bg-[var(--color-card)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-tl-sm'
                      }`}
                  >
                    <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                  </div>
                </div>

                {msg.properties && msg.properties.length > 0 && (
                  <div className="pl-10 animate-fade-up">
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                      {msg.properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 animate-fade-up">
                <div className="w-7 h-7 rounded-full border border-[var(--color-line-strong)] flex items-center justify-center text-[10px] font-mono text-[var(--color-mute)] shrink-0">
                  AI
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-card)] font-mono text-xs text-[var(--color-mute)]">
                  thinking<span className="cursor-blink">…</span>
                </div>
              </div>
            )}

            {completed && (
              <div className="crop-marks border border-[var(--color-forest)] rounded-2xl bg-[var(--color-forest-soft)] p-6 text-center animate-fade-up">
                <span className="crop-tr" /><span className="crop-br" />
                <div className="font-display text-2xl mb-1">Conversation complete</div>
                <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mx-auto mb-4">
                  This lead has been captured and is ready in your dashboard. An agent will reach out shortly.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/leads"
                    className="font-mono text-[11px] uppercase tracking-[0.15em] bg-[var(--color-ink)] text-[var(--color-paper)] rounded-full px-5 py-2.5"
                  >
                    View in leads →
                  </Link>
                  <button
                    type="button"
                    onClick={restart}
                    className="font-mono text-[11px] uppercase tracking-[0.15em] border border-[var(--color-line-strong)] hover:border-[var(--color-ink)] rounded-full px-5 py-2.5 transition-colors"
                  >
                    Start new chat
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!completed && (
            <div className="shrink-0 px-5 md:px-8 pb-6 pt-2">
              <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-thin">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={loading}
                    className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)] border border-[var(--color-line)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="flex items-center gap-2 border border-[var(--color-line-strong)] rounded-full pl-5 pr-2 py-2 bg-[var(--color-card)] focus-within:border-[var(--color-ink)] transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] placeholder-[var(--color-mute)] focus:outline-none disabled:opacity-50"
                  placeholder="Type your reply…"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center transition-transform active:scale-90 disabled:opacity-30 shrink-0"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </main>

        <aside className="hidden lg:block w-[300px] shrink-0 border-l border-[var(--color-line)] p-6 overflow-y-auto scrollbar-thin">
          <ContextPanel context={context} />
        </aside>
      </div>

      <MobileContextBar context={context} />
    </div>
  );
}

function MobileContextBar({ context }: { context: ChatContext }) {
  const [open, setOpen] = useState(false);

  const summary = [
    context.transaction === 'rent' ? 'Rent' : context.transaction === 'buy' ? 'Buy' : null,
    context.city,
    context.district || (context.city ? 'whole city' : null),
  ].filter(Boolean).join(' · ') || 'No details yet';

  return (
    <div className="lg:hidden shrink-0 border-t border-[var(--color-line)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              context.status === 'completed' ? 'bg-[var(--color-forest)]' : 'bg-[var(--color-copper)] animate-pulse'
            }`}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--color-mute)] shrink-0">
            Context
          </span>
          <span className="text-sm truncate">{summary}</span>
        </div>
        <svg
          className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-up">
          <ContextPanel context={context} />
        </div>
      )}
    </div>
  );
}