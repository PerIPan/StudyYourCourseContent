'use client';

import { useState, useEffect, useRef } from 'react';

interface Course {
  id: string;
  name: string;
  slug: string;
}

interface CourseBadgesProps {
  selected: string[];
  onSelect: (slugs: string[]) => void;
}

export function CourseBadges({ selected, onSelect }: CourseBadgesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(setCourses)
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isAll = selected.length === 0;

  function toggleCourse(slug: string) {
    if (isAll) {
      onSelect([slug]);
    } else if (selected.includes(slug)) {
      const next = selected.filter(s => s !== slug);
      onSelect(next);
    } else {
      const next = [...selected, slug];
      if (courses.length > 0 && next.length >= courses.length) {
        onSelect([]);
      } else {
        onSelect(next);
      }
    }
  }

  const label = isAll
    ? 'All Courses'
    : selected.length === 1
      ? courses.find(c => c.slug === selected[0])?.name ?? '1 course'
      : `${selected.length} courses`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer border"
        style={{
          backgroundColor: isAll ? 'var(--bg-muted)' : 'var(--accent-subtle)',
          color: isAll ? 'var(--text-secondary)' : 'var(--accent-text)',
          borderColor: isAll ? 'var(--border)' : 'var(--accent)',
        }}
      >
        {label}
        <svg
          className="w-3 h-3 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 min-w-[180px] rounded-lg border py-1 z-50"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* All option */}
          <button
            onClick={() => { onSelect([]); setOpen(false); }}
            className="w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors hover:brightness-95"
            style={{
              backgroundColor: isAll ? 'var(--accent-subtle)' : 'transparent',
              color: isAll ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <span
              className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: isAll ? 'var(--accent)' : 'var(--border)',
                backgroundColor: isAll ? 'var(--accent)' : 'transparent',
              }}
            >
              {isAll && (
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            All Courses
          </button>

          <div className="mx-2 my-0.5 border-t" style={{ borderColor: 'var(--border)' }} />

          {/* Individual courses */}
          {courses.map(c => {
            const active = !isAll && selected.includes(c.slug);
            return (
              <button
                key={c.slug}
                onClick={() => toggleCourse(c.slug)}
                className="w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors hover:brightness-95"
                style={{
                  backgroundColor: active ? 'var(--tag-active-bg)' : 'transparent',
                  color: active ? 'var(--tag-active-text)' : 'var(--text-secondary)',
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: active ? 'var(--tag-active-border)' : 'var(--border)',
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {active && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
