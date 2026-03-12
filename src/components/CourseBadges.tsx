'use client';

const COURSES = [
  { slug: null, label: 'All', bg: 'bg-slate-100', text: 'text-slate-600', activeBg: 'bg-slate-200' },
  { slug: 'foundations', label: 'Foundations', bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-100' },
  { slug: 'strategy', label: 'Strategy', bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-100' },
  { slug: 'threat-landscape', label: 'Threats', bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-100' },
];

interface CourseBadgesProps {
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CourseBadges({ selected, onSelect }: CourseBadgesProps) {
  return (
    <div className="flex gap-1.5">
      {COURSES.map(c => (
        <button
          key={c.slug ?? 'all'}
          onClick={() => onSelect(c.slug)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
            selected === c.slug
              ? `${c.activeBg} ${c.text} ring-2 ring-current ring-opacity-30`
              : `${c.bg} ${c.text}`
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
