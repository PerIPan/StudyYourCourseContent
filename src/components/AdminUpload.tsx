'use client';

import { useState, useRef } from 'react';

interface AdminUploadProps {
  courses: { id: string; name: string; slug: string }[];
  onUploaded: () => void;
}

interface FileStatus {
  name: string;
  state: 'pending' | 'uploading' | 'done' | 'error';
  info?: string;
}

export function AdminUpload({ courses, onUploaded }: AdminUploadProps) {
  const [courseId, setCourseId] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter(f =>
      ['.pdf', '.pptx', '.docx'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (fileArray.length === 0) return;
    if (!courseId) {
      setFileStatuses([{ name: 'Error', state: 'error', info: 'Select a course first' }]);
      return;
    }

    setUploading(true);
    const statuses: FileStatus[] = fileArray.map(f => ({ name: f.name, state: 'pending' as const }));
    setFileStatuses([...statuses]);

    for (let i = 0; i < fileArray.length; i++) {
      statuses[i].state = 'uploading';
      setFileStatuses([...statuses]);

      const formData = new FormData();
      formData.append('file', fileArray[i]);
      formData.append('courseId', courseId);
      formData.append('lectureNumber', String(lectureNumber));

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        statuses[i] = { name: fileArray[i].name, state: 'done', info: `${data.chunkCount} chunks (${data.priority})` };
      } catch {
        statuses[i] = { name: fileArray[i].name, state: 'error', info: 'Failed' };
      }
      setFileStatuses([...statuses]);
    }

    setUploading(false);
    onUploaded();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Upload Documents</h3>

      <div className="flex gap-3 mb-3">
        <select
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={lectureNumber}
          onChange={e => setLectureNumber(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-28"
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>Lecture {n}</option>
          ))}
        </select>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
      >
        <p className="text-slate-400 text-sm">Drop multiple PDF, PPTX, or DOCX files here</p>
        <p className="text-slate-300 text-xs mt-1">or click to select files (multi-select supported)</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.pptx,.docx"
        multiple
        onChange={e => e.target.files && e.target.files.length > 0 && handleFiles(e.target.files)}
        className="hidden"
      />

      {fileStatuses.length > 0 && (
        <div className="mt-3 space-y-1">
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
              <span className="text-slate-700 truncate max-w-[250px]">{fs.name}</span>
              {fs.info && <span className="text-slate-400 text-xs">{fs.info}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
