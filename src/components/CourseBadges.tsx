'use client';

import { useState, useEffect } from 'react';

interface Course {
  id: string;
  name: string;
  slug: string;
}

interface CourseBadgesProps {
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

const COLORS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-100' },
  { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'bg-rose-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', activeBg: 'bg-cyan-100' },
];

export function CourseBadges({ selected, onSelect }: CourseBadgesProps) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(setCourses)
      .catch(() => {});
  }, []);

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
          selected === null
            ? 'bg-slate-200 text-slate-600 ring-2 ring-current ring-opacity-30'
            : 'bg-slate-100 text-slate-600 hover:ring-2 hover:ring-current hover:ring-opacity-20'
        }`}
      >
        All
      </button>
      {courses.map((c, i) => {
        const color = COLORS[i % COLORS.length];
        return (
          <button
            key={c.slug}
            onClick={() => onSelect(c.slug)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
              selected === c.slug
                ? `${color.activeBg} ${color.text} ring-2 ring-current ring-opacity-30`
                : `${color.bg} ${color.text} hover:ring-2 hover:ring-current hover:ring-opacity-20`
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
