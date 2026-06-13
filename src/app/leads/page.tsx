'use client';
import { useEffect, useState } from 'react';
import { Lead } from '@/types';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => setLeads(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.email?.toLowerCase().includes(search.toLowerCase())
  );

  const contactedCount = leads.filter((l) => l.contacted).length;

  const toggleContacted = async (lead: Lead) => {
    const next = !lead.contacted;
    setUpdatingId(lead.id);

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, contacted: next } : l)));

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, contacted: next }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, contacted: !next } : l)));
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteLead = async (lead: Lead) => {
    setDeletingId(lead.id);
    const previous = leads;

    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setConfirmingId(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setLeads(previous);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] bg-grain text-[var(--color-ink)]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--color-mute)] mb-3">
              <Link href="/" className="hover:text-[var(--color-ink)] transition-colors">Home</Link>
              <span>/</span>
              <span>Leads</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight">
              Captured leads
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link
              href="/chat"
              className="font-mono text-[11px] uppercase tracking-[0.15em] border border-[var(--color-line)] hover:border-[var(--color-ink)] rounded-full px-4 py-2.5 transition-colors"
            >
              ← Back to assistant
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-line)]">
          <div className="flex items-baseline gap-5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl">{leads.length}</span>
              <span className="text-sm text-[var(--color-mute)]">total {leads.length === 1 ? 'lead' : 'leads'}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-[var(--color-forest)]">{contactedCount}</span>
              <span className="text-sm text-[var(--color-mute)]">contacted</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 bg-[var(--color-card)] border border-[var(--color-line-strong)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-ink)] transition-colors placeholder-[var(--color-mute)]"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-mute)]">
            Loading…
          </div>
        ) : error ? (
          <div className="crop-marks border border-[var(--color-line)] rounded-2xl py-20 text-center">
            <span className="crop-tr" /><span className="crop-br" />
            <div className="font-display text-2xl mb-2">Couldn&apos;t load leads</div>
            <p className="text-sm text-[var(--color-mute)] max-w-sm mx-auto">
              Something went wrong while fetching leads. Please refresh the page to try again.
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="crop-marks border border-[var(--color-line)] rounded-2xl py-20 text-center">
            <span className="crop-tr" /><span className="crop-br" />
            <div className="font-display text-2xl mb-2">No leads yet</div>
            <p className="text-sm text-[var(--color-mute)] max-w-sm mx-auto">
              Run the assistant through a full conversation to generate and qualify your first contact.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] uppercase tracking-[0.15em] bg-[var(--color-ink)] text-[var(--color-paper)] rounded-full px-5 py-2.5"
            >
              Open assistant →
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            <div className="hidden md:grid grid-cols-[1fr_1.4fr_auto_auto_auto] gap-6 px-1 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)] border-b border-[var(--color-line)]">
              <span>Client</span>
              <span>Contact</span>
              <span>Captured</span>
              <span className="text-right">Status</span>
              <span></span>
            </div>

            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className={`grid md:grid-cols-[1fr_1.4fr_auto_auto_auto] gap-2 md:gap-6 py-5 border-b border-[var(--color-line)] hover:bg-[var(--color-card)] transition-colors px-1 -mx-1 rounded-lg items-center ${lead.contacted ? 'opacity-60' : ''} ${deletingId === lead.id ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <div>
                  <div className="font-medium text-[15px]">{lead.name || 'Anonymous client'}</div>
                  <div className="font-mono text-[11px] text-[var(--color-mute)] mt-0.5">
                    #{lead.id.slice(0, 8)}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-[var(--color-ink-soft)]">{lead.email || '—'}</div>
                  <div className="font-mono text-[12px] text-[var(--color-mute)] mt-0.5">{lead.phone || '—'}</div>
                </div>
                <div className="text-sm text-[var(--color-mute)]">
                  {new Date(lead.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="md:text-right">
                  <button
                    type="button"
                    onClick={() => toggleContacted(lead)}
                    disabled={updatingId === lead.id}
                    className={`font-mono text-[11px] uppercase tracking-[0.1em] rounded-full px-3.5 py-1.5 border transition-colors disabled:opacity-50
                      ${lead.contacted
                        ? 'border-[var(--color-forest)] text-[var(--color-forest)] bg-[var(--color-forest-soft)]'
                        : 'border-[var(--color-line-strong)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
                      }`}
                  >
                    {lead.contacted ? '✓ Contacted' : 'Mark contacted'}
                  </button>
                </div>
                <div className="md:text-right">
                  {confirmingId === lead.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-[var(--color-mute)]">Delete?</span>
                      <button
                        type="button"
                        onClick={() => deleteLead(lead)}
                        className="font-mono text-[11px] uppercase tracking-[0.1em] rounded-full px-3 py-1.5 border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="font-mono text-[11px] uppercase tracking-[0.1em] rounded-full px-3 py-1.5 border border-[var(--color-line-strong)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(lead.id)}
                      aria-label="Delete lead"
                      title="Delete lead"
                      className="w-8 h-8 rounded-full border border-[var(--color-line)] hover:border-red-500/40 hover:text-red-500 text-[var(--color-mute)] flex items-center justify-center transition-colors ml-auto"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}