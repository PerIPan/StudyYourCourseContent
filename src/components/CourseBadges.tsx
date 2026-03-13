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
        className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer border"
        style={
          selected === null
            ? {
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                borderColor: 'var(--accent)',
              }
            : {
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border)',
              }
        }
      >
        All
      </button>
      {courses.map(c => (
        <button
          key={c.slug}
          onClick={() => onSelect(c.slug)}
          className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer border"
          style={
            selected === c.slug
              ? {
                  backgroundColor: 'var(--tag-active-bg)',
                  color: 'var(--tag-active-text)',
                  borderColor: 'var(--tag-active-border)',
                }
              : {
                  backgroundColor: 'var(--tag-bg)',
                  color: 'var(--tag-text)',
                  borderColor: 'var(--tag-border)',
                }
          }
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
