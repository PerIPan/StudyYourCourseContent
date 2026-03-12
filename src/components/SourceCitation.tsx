import type { SourceCitation as Citation } from '@/types';

export function SourceCitationBlock({ sources }: { sources: Citation[] }) {
  if (!sources?.length) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-3 mt-3 text-xs">
      <div className="text-slate-400 mb-1">Sources:</div>
      {sources.map((s, i) => (
        <div key={i} className="text-indigo-500">
          {s.courseName} / Lecture {s.lectureNumber} / {s.filename}, p.{s.pageNumber}
        </div>
      ))}
    </div>
  );
}
