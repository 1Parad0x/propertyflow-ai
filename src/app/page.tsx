import Link from 'next/link';
import { headers } from 'next/headers';
import ThemeToggle from '@/components/ThemeToggle';

export default async function Home() {
  const headerList = await headers();
  const lat = headerList.get('x-vercel-ip-latitude');
  const lon = headerList.get('x-vercel-ip-longitude');
  const city = headerList.get('x-vercel-ip-city');

  const locationLabel = lat && lon
    ? `Lat ${Number(lat).toFixed(4)} · Lon ${Number(lon).toFixed(4)}`
    : null;

  return (
    <div className="relative min-h-screen bg-[var(--color-paper)] bg-grain text-[var(--color-ink)] overflow-hidden">

      <header className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-[1.5px] border-[var(--color-ink)] rounded-full flex items-center justify-center">
            <span className="font-display text-base">P</span>
          </div>
          <span className="font-display text-lg tracking-tight">PropertyFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[var(--color-mute)] tracking-wider uppercase">
            {city && (
              <>
                <span>{decodeURIComponent(city)}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-line-strong)]" />
              </>
            )}
            {locationLabel && (
              <>
                <span>{locationLabel}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-line-strong)]" />
              </>
            )}
            <span>Demo build</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20">
        <div className="grid md:grid-cols-[1.3fr_1fr] gap-12 md:gap-8 items-start">

          <div>
            <div className="flex items-center gap-3 mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-forest)]">
              <span className="w-8 h-px bg-[var(--color-forest)]" />
              Real estate · automated qualification
            </div>

            <h1 className="font-display text-[13vw] sm:text-7xl md:text-[5.5rem] leading-[0.98] tracking-tight font-medium">
              Every lead,
              <br />
              <span className="italic text-[var(--color-forest)]">qualified</span>
              <br />
              before coffee.
            </h1>

            <p className="mt-8 max-w-md text-[var(--color-ink-soft)] text-lg leading-relaxed">
              An AI assistant that talks to your site visitors, learns what they
              need, matches it against live inventory, and hands your team a
              ready-to-call lead — around the clock.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/chat"
                className="group inline-flex items-center gap-3 bg-[var(--color-ink)] text-[var(--color-paper)] px-7 py-4 rounded-full font-medium text-sm transition-transform hover:-translate-y-0.5"
              >
                Try the assistant
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/leads"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-medium text-sm border border-[var(--color-line-strong)] hover:border-[var(--color-ink)] transition-colors"
              >
                View captured leads
              </Link>
            </div>
          </div>

          <div className="relative crop-marks border border-[var(--color-line)] rounded-2xl bg-[var(--color-card)] p-6 md:p-8 mt-2">
            <span className="crop-tr" />
            <span className="crop-br" />

            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)] mb-6">
              Conversation flow — Fig. 01
            </div>

            <ol className="space-y-5">
              {[
                { n: '01', label: 'Rent or buy', detail: 'Intent established up front' },
                { n: '02', label: 'City & district', detail: 'Location narrowed to area' },
                { n: '03', label: 'Budget & rooms', detail: 'Two filters, no friction' },
                { n: '04', label: 'Live match', detail: 'Pulled straight from inventory' },
                { n: '05', label: 'Contact captured', detail: 'Name, email, phone → CRM' },
              ].map((step, i) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="font-mono text-xs text-[var(--color-mute)] pt-0.5 shrink-0">{step.n}</span>
                  <div className="flex-1 border-b border-dashed border-[var(--color-line)] pb-4">
                    <div className="font-medium text-[15px]">{step.label}</div>
                    <div className="text-sm text-[var(--color-mute)] mt-0.5">{step.detail}</div>
                  </div>
                  {i === 4 && (
                    <span className="font-mono text-[10px] text-[var(--color-forest)] pt-0.5 shrink-0">→ CRM</span>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 pt-5 border-t border-[var(--color-line)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-mute)]">Average flow time</span>
              <span className="font-display text-2xl">~90s</span>
            </div>
          </div>

        </div>
      </main>

      <section className="relative z-10 border-t border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14 grid sm:grid-cols-3 gap-10">
          {[
            {
              tag: 'A',
              title: 'Always on',
              body: 'No missed enquiries overnight, on weekends, or during showings.',
            },
            {
              tag: 'B',
              title: 'Inventory-aware',
              body: 'Matches are pulled live from your listings — nothing invented.',
            },
            {
              tag: 'C',
              title: 'CRM-ready',
              body: 'Qualified contacts land directly in your leads dashboard.',
            },
          ].map((f) => (
            <div key={f.tag}>
              <div className="font-mono text-xs text-[var(--color-copper)] mb-3">{f.tag}</div>
              <h3 className="font-display text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[var(--color-mute)]">
          <span>PropertyFlow — demo environment</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}