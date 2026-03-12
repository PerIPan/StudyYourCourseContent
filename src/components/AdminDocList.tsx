'use client';

import type { AdminDoc } from '@/types';

interface AdminDocListProps {
  documents: AdminDoc[];
  onDelete: (id: string) => void;
}

export function AdminDocList({ documents, onDelete }: AdminDocListProps) {
  if (documents.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">No documents uploaded yet</p>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2">Course</th>
            <th className="text-left px-4 py-2">Lec</th>
            <th className="text-left px-4 py-2">File</th>
            <th className="text-left px-4 py-2">Chunks</th>
            <th className="text-left px-4 py-2">Priority</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className="border-t border-slate-100">
              <td className="px-4 py-2 text-slate-700">{doc.course_name}</td>
              <td className="px-4 py-2 text-slate-500">{doc.lecture_number}</td>
              <td className="px-4 py-2 text-slate-700 truncate max-w-[200px]">{doc.filename}</td>
              <td className="px-4 py-2 text-slate-500">{doc.chunk_count}</td>
              <td className="px-4 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  doc.priority === 'high' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {doc.priority}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
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
