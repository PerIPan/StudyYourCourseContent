'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(setCourses)
      .catch(() => {});
  }, []);

  const isAll = selected.length === 0;

  function toggleCourse(slug: string) {
    if (isAll) {
      // switching from All → pick just this one
      onSelect([slug]);
    } else if (selected.includes(slug)) {
      // deselect — if last one, go back to All
      const next = selected.filter(s => s !== slug);
      onSelect(next);
    } else {
      // add course — if all courses now selected, auto-enable All
      const next = [...selected, slug];
      if (courses.length > 0 && next.length >= courses.length) {
        onSelect([]);
      } else {
        onSelect(next);
      }
    }
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onSelect([])}
        className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer border"
        style={
          isAll
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
          onClick={() => toggleCourse(c.slug)}
          className="text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer border"
          style={
            !isAll && selected.includes(c.slug)
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
