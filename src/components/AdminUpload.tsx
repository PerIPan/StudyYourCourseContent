'use client';

import { useState, useRef } from 'react';

interface AdminUploadProps {
  onUploaded: () => void;
}

interface FileEntry {
  file: File;
  courseName: string;
}

interface FileStatus {
  name: string;
  courseName: string;
  state: 'pending' | 'uploading' | 'done' | 'error';
  info?: string;
}

/** Infer course name from folder path. Folder name = course. */
function inferCourseName(file: File): string {
  const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
  const parts = path.split('/').filter(Boolean);
  // Use the top-level folder name as course
  if (parts.length >= 2) return parts[0].replace(/[-_]/g, ' ');
  return 'General';
}

export function AdminUpload({ onUploaded }: AdminUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function processFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter(f =>
      ['.pdf', '.pptx', '.docx'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (fileArray.length === 0) return;

    const newEntries = fileArray.map(file => ({
      file,
      courseName: inferCourseName(file),
    }));

    setEntries(newEntries);
    setFileStatuses(newEntries.map(e => ({
      name: e.file.name,
      courseName: e.courseName,
      state: 'pending' as const,
    })));
  }

  function updateCourseName(index: number, value: string) {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], courseName: value };
      return updated;
    });
    setFileStatuses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], courseName: value };
      return updated;
    });
  }

  function setAllCourseName(value: string) {
    setEntries(prev => prev.map(e => ({ ...e, courseName: value })));
    setFileStatuses(prev => prev.map(s => ({ ...s, courseName: value })));
  }

  async function handleUploadAll() {
    if (entries.length === 0) return;
    setUploading(true);

    const statuses: FileStatus[] = entries.map(e => ({
      name: e.file.name,
      courseName: e.courseName,
      state: 'pending',
    }));
    setFileStatuses([...statuses]);

    for (let i = 0; i < entries.length; i++) {
      statuses[i].state = 'uploading';
      setFileStatuses([...statuses]);

      const formData = new FormData();
      formData.append('file', entries[i].file);
      formData.append('courseName', entries[i].courseName);
      formData.append('lectureNumber', '0');

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err);
        }
        const data = await res.json();
        statuses[i] = { ...statuses[i], state: 'done', info: `${data.chunkCount} chunks` };
      } catch (e) {
        statuses[i] = { ...statuses[i], state: 'error', info: e instanceof Error ? e.message : 'Failed' };
      }
      setFileStatuses([...statuses]);
    }

    setUploading(false);
    setEntries([]);
    onUploaded();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  const allDone = fileStatuses.length > 0 && fileStatuses.every(s => s.state === 'done' || s.state === 'error');
  const uniqueCourses = [...new Set(entries.map(e => e.courseName))];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Upload Documents</h3>
      <p className="text-slate-400 text-xs mb-3">
        Select a folder — folder name becomes the course name. All files are treated holistically (no lecture splitting).
      </p>

      {entries.length === 0 && !allDone && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => folderRef.current?.click()}
          >
            <p className="text-slate-400 text-sm">Click to select a course folder</p>
            <p className="text-slate-300 text-xs mt-1">PDF, PPTX, DOCX — folder name = course name</p>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => folderRef.current?.click()}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Select folder
            </button>
            <span className="text-slate-300 text-xs">|</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Select files
            </button>
          </div>

          <input
            ref={folderRef}
            type="file"
            // @ts-expect-error webkitdirectory is not in React types
            webkitdirectory=""
            multiple
            onChange={e => e.target.files && processFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.pptx,.docx"
            multiple
            onChange={e => e.target.files && processFiles(e.target.files)}
            className="hidden"
          />
        </>
      )}

      {entries.length > 0 && !uploading && !allDone && (
        <>
          {/* Bulk course name editor */}
          <div className="flex items-center gap-2 mb-3 bg-indigo-50 rounded-lg px-3 py-2">
            <span className="text-xs text-indigo-600 font-medium whitespace-nowrap">Course for all:</span>
            <input
              type="text"
              value={uniqueCourses.length === 1 ? uniqueCourses[0] : ''}
              onChange={e => setAllCourseName(e.target.value)}
              placeholder={uniqueCourses.length > 1 ? 'Multiple courses detected' : 'Course name'}
              className="flex-1 bg-white border border-indigo-200 rounded px-2 py-1 text-sm"
            />
          </div>

          <div className="max-h-48 overflow-auto space-y-1 mb-3">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded px-3 py-1.5">
                <span className="text-slate-500 truncate flex-1" title={entry.file.name}>
                  {entry.file.name}
                </span>
                <input
                  type="text"
                  value={entry.courseName}
                  onChange={e => updateCourseName(i, e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs w-40"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUploadAll}
              className="bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-600"
            >
              Upload {entries.length} file{entries.length > 1 ? 's' : ''}
            </button>
            <button
              onClick={() => { setEntries([]); setFileStatuses([]); }}
              className="text-slate-400 hover:text-slate-600 text-sm px-3"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {fileStatuses.length > 0 && (uploading || allDone) && (
        <div className="space-y-1 mt-3">
          {fileStatuses.map((fs, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className={
                fs.state === 'done' ? 'text-emerald-500' :
                fs.state === 'error' ? 'text-red-500' :
                fs.state === 'uploading' ? 'text-indigo-500 animate-pulse' :
                'text-slate-400'
              }>
                {fs.state === 'done' ? '✓' : fs.state === 'error' ? '✗' : fs.state === 'uploading' ? '⟳' : '○'}
              </span>
              <span className="text-slate-700 truncate max-w-[200px]">{fs.name}</span>
              <span className="text-slate-400 text-xs">{fs.courseName}</span>
              {fs.info && <span className="text-slate-400 text-xs">— {fs.info}</span>}
            </div>
          ))}
          {allDone && (
            <button
              onClick={() => { setEntries([]); setFileStatuses([]); }}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-700"
            >
              Upload more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
