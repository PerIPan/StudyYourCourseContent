'use client';

import type { AdminDoc } from '@/types';

interface AdminDocListProps {
  documents: AdminDoc[];
  onDelete: (id: string) => void;
}

export function AdminDocList({ documents, onDelete }: AdminDocListProps) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
        No documents uploaded yet
      </p>
    );
  }

  return (
    <div
      className="theme-card rounded-lg overflow-hidden border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-muted)' }}>
            {['Course', 'Lec', 'File', 'Chunks', 'Priority', ''].map((h, i) => (
              <th
                key={i}
                className={`${i === 5 ? '' : 'text-left'} px-4 py-2 text-xs font-semibold uppercase tracking-wider`}
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr
              key={doc.id}
              className="border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>
                {doc.course_name}
              </td>
              <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                {doc.lecture_number}
              </td>
              <td className="px-4 py-2 truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                {doc.filename}
              </td>
              <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                {doc.chunk_count}
              </td>
              <td className="px-4 py-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={
                    doc.priority === 'high'
                      ? {
                          backgroundColor: 'var(--accent-subtle)',
                          color: 'var(--accent-text)',
                        }
                      : {
                          backgroundColor: 'var(--bg-muted)',
                          color: 'var(--text-muted)',
                        }
                  }
                >
                  {doc.priority}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-xs transition-colors hover:opacity-100 opacity-60"
                  style={{ color: '#ef4444' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
