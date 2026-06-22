export type ChatContext = {
  transaction: 'rent' | 'buy' | null;
  city: string | null;
  district: string | null;
  budget: number | null;
  rooms: number | null;
  status: 'greeting' | 'qualifying' | 'matching' | 'awaiting_contact' | 'collecting_contact' | 'completed';
};

const STATUS_LABELS: Record<ChatContext['status'], string> = {
  greeting: 'Getting started',
  qualifying: 'Qualifying lead',
  matching: 'Matching properties',
  awaiting_contact: 'Awaiting contact details',
  collecting_contact: 'Collecting contact details',
  completed: 'Lead captured',
};

function Row({ label, value }: { label: string; value: string }) {
  const isEmpty = value === '—';
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 border-b border-dashed border-[var(--color-line)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)] shrink-0">
        {label}
      </span>
      <span className={`text-sm text-right truncate ${isEmpty ? 'text-[var(--color-mute)]' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

export default function ContextPanel({ context }: { context: ChatContext }) {
  const transactionLabel = context.transaction
    ? context.transaction === 'rent' ? 'Rent' : 'Buy'
    : '—';

  const districtLabel = context.district || (context.city ? 'Whole city' : '—');

  const budgetLabel = context.budget != null
    ? `€${new Intl.NumberFormat('en-US').format(context.budget)}${context.transaction === 'rent' ? ' / mo' : ''}`
    : '—';

  const pastQualifying = context.status !== 'greeting' && context.status !== 'qualifying';
  const roomsLabel = context.rooms != null ? `${context.rooms}` : (pastQualifying ? 'Any' : '—');

  return (
    <div className="crop-marks border border-[var(--color-line)] rounded-2xl bg-[var(--color-card)] p-5">
      <span className="crop-tr" /><span className="crop-br" />

      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)] mb-1">
        Live context — Fig. 02
      </div>
      <h2 className="font-display text-xl mb-4">Current search</h2>

      <div>
        <Row label="Transaction" value={transactionLabel} />
        <Row label="City" value={context.city || '—'} />
        <Row label="District" value={districtLabel} />
        <Row label="Budget" value={budgetLabel} />
        <Row label="Rooms" value={roomsLabel} />
      </div>

      <div className="mt-4 pt-4 flex items-center justify-between">
        <span className="text-xs text-[var(--color-mute)]">Status</span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              context.status === 'completed'
                ? 'bg-[var(--color-forest)]'
                : 'bg-[var(--color-copper)] animate-pulse'
            }`}
          />
          {STATUS_LABELS[context.status]}
        </span>
      </div>
    </div>
  );
}