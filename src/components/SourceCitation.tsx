import type { SourceCitation as Citation } from '@/types';

export function SourceCitationBlock({ sources }: { sources: Citation[] }) {
  if (!sources?.length) return null;

  const defaultOpen = sources.length === 1;

  return (
    <details className="mt-3" open={defaultOpen}>
      <summary
        className="text-xs cursor-pointer select-none list-none flex items-center gap-1 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
      >
        <svg className="w-3 h-3 transition-transform details-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Sources ({sources.length})
      </summary>
      <div className="mt-2">
        {sources.map((s, i) => (
          <div
            key={i}
            className="rounded-lg px-3 py-2 mb-1 border"
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="font-medium text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-text)' }}>Source {i + 1}:</span> {s.courseName}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              Lecture {s.lectureNumber} / {s.filename}, p.{s.pageNumber}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
