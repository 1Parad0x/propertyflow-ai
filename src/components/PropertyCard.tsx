import { Property } from '@/types';

function formatPrice(price: number, listingType: Property['listingType']) {
  const formatted = new Intl.NumberFormat('en-US').format(price);
  return listingType === 'rent' ? `€${formatted} / mo` : `€${formatted}`;
}

function titleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="crop-marks border border-[var(--color-line)] rounded-2xl bg-[var(--color-card)] overflow-hidden shrink-0 w-[230px] snap-start">
      <span className="crop-tr" /><span className="crop-br" />

      <div className="w-full h-28 border-b border-[var(--color-line)] bg-[var(--color-overlay)] flex flex-col items-center justify-center gap-1 relative overflow-hidden">
        <svg className="w-8 h-8 text-[var(--color-mute)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-mute)]">
          #{property.id}
        </span>
      </div>

      <div className="p-3.5">
        <div className="font-display text-lg leading-tight mb-1 truncate">
          {titleCase(property.propertyType)}
        </div>
        <div className="text-xs text-[var(--color-mute)] mb-2 truncate">
          {property.district}, {property.city}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-ink-soft)] mb-3">
          <span>{property.rooms} rm</span>
          <span>{property.area} m²</span>
          {property.petsAllowed && (
            <span className="text-[var(--color-forest)]" title="Pets allowed">🐾</span>
          )}
        </div>

        <div className="pt-3 border-t border-dashed border-[var(--color-line)] flex items-baseline justify-between">
          <span className="font-display text-xl">{formatPrice(property.price, property.listingType)}</span>
        </div>
      </div>
    </div>
  );
}