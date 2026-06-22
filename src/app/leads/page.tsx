'use client';
import { useEffect, useState } from 'react';
import { Lead } from '@/types';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

type FilterMode = 'all' | 'pending' | 'contacted';

function formatBudget(budget: number, listingType?: string) {
  const formatted = new Intl.NumberFormat('en-US').format(budget);
  return listingType === 'rent' ? `€${formatted}/mo` : `€${formatted}`;
}

function isHotLead(lead: Lead): boolean {
  const r = lead.requirements;
  return !!(r?.price && r?.rooms);
}

function RequirementsBlock({ lead }: { lead: Lead }) {
  const r = lead.requirements;
  if (!r || Object.keys(r).length === 0) return null;

  const badges: { label: string; value: string }[] = [];

  if (r.listingType) {
    badges.push({ label: 'Type', value: r.listingType === 'rent' ? 'Rent' : 'Buy' });
  }
  if (r.city) {
    const loc = r.district ? `${r.city} · ${r.district}` : r.city;
    badges.push({ label: 'Location', value: loc });
  }
  if (r.price) {
    badges.push({ label: 'Budget', value: formatBudget(r.price, r.listingType) });
  }
  if (r.rooms) {
    badges.push({ label: 'Rooms', value: `${r.rooms} rm` });
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-dashed border-[var(--color-line)] flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] bg-[var(--color-overlay)] border border-[var(--color-line)] rounded-full px-2.5 py-1"
        >
          <span className="text-[var(--color-mute)]">{b.label}</span>
          <span className="text-[var(--color-ink-soft)]">{b.value}</span>
        </span>
      ))}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort(
          (a: Lead, b: Lead) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLeads(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads
    .filter((lead) => {
      if (filter === 'pending') return !lead.contacted;
      if (filter === 'contacted') return lead.contacted;
      return true;
    })
    .filter((lead) =>
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    );

  const contactedCount = leads.filter((l) => l.contacted).length;
  const pendingCount = leads.length - contactedCount;

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
            <h1 className="font-display text-4xl md:text-5xl tracking-tight">Captured leads</h1>
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
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl">{leads.length}</span>
              <span className="text-sm text-[var(--color-mute)]">total</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl text-[var(--color-copper)]">{pendingCount}</span>
              <span className="text-sm text-[var(--color-mute)]">pending</span>
            </div>
            <div className="flex items-baseline gap-2">
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

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'contacted'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`font-mono text-[11px] uppercase tracking-[0.15em] rounded-full px-4 py-2 border transition-colors ${
                filter === mode
                  ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]'
                  : 'border-[var(--color-line)] text-[var(--color-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
              }`}
            >
              {mode === 'all' ? `All (${leads.length})` : mode === 'pending' ? `Pending (${pendingCount})` : `Contacted (${contactedCount})`}
            </button>
          ))}
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
            <div className="font-display text-2xl mb-2">
              {filter !== 'all' ? 'No leads in this filter' : 'No leads yet'}
            </div>
            <p className="text-sm text-[var(--color-mute)] max-w-sm mx-auto">
              {filter !== 'all'
                ? 'Try switching the filter above.'
                : 'Run the assistant through a full conversation to generate and qualify your first contact.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] uppercase tracking-[0.15em] bg-[var(--color-ink)] text-[var(--color-paper)] rounded-full px-5 py-2.5"
              >
                Open assistant →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className={`crop-marks border border-[var(--color-line)] rounded-2xl bg-[var(--color-card)] p-5 transition-opacity ${lead.contacted ? 'opacity-60' : ''} ${deletingId === lead.id ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <span className="crop-tr" /><span className="crop-br" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-medium text-[15px]">{lead.name || 'Anonymous client'}</span>
                      {isHotLead(lead) && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] bg-[var(--color-copper-soft)] text-[var(--color-copper)] border border-[var(--color-copper)]/20 rounded-full px-2 py-0.5">
                          Hot lead
                        </span>
                      )}
                      {lead.contacted && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] bg-[var(--color-forest-soft)] text-[var(--color-forest)] border border-[var(--color-forest)]/20 rounded-full px-2 py-0.5">
                          Contacted
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--color-mute)]">#{lead.id.slice(0, 8)}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleContacted(lead)}
                      disabled={updatingId === lead.id}
                      className={`font-mono text-[11px] uppercase tracking-[0.1em] rounded-full px-3.5 py-1.5 border transition-colors disabled:opacity-50 ${
                        lead.contacted
                          ? 'border-[var(--color-forest)] text-[var(--color-forest)] bg-[var(--color-forest-soft)]'
                          : 'border-[var(--color-line-strong)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      {lead.contacted ? '✓ Contacted' : 'Mark contacted'}
                    </button>

                    {confirmingId === lead.id ? (
                      <div className="flex items-center gap-1.5">
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
                          className="font-mono text-[11px] uppercase tracking-[0.1em] rounded-full px-3 py-1.5 border border-[var(--color-line-strong)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(lead.id)}
                        aria-label="Delete lead"
                        className="w-8 h-8 rounded-full border border-[var(--color-line)] hover:border-red-500/40 hover:text-red-500 text-[var(--color-mute)] flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v13a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div className="text-[var(--color-ink-soft)]">{lead.email || '—'}</div>
                  <div className="font-mono text-[12px] text-[var(--color-mute)]">{lead.phone || '—'}</div>
                </div>

                <RequirementsBlock lead={lead} />

                <div className="mt-3 font-mono text-[10px] text-[var(--color-mute)] uppercase tracking-[0.1em]">
                  {new Date(lead.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}