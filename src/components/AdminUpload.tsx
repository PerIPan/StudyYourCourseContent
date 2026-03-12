'use client';

import { useState, useRef } from 'react';

interface AdminUploadProps {
  courses: { id: string; name: string; slug: string }[];
  onUploaded: () => void;
}

export function AdminUpload({ courses, onUploaded }: AdminUploadProps) {
  const [courseId, setCourseId] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!courseId) { setStatus('Select a course first'); return; }
    setUploading(true);
    setStatus(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('lectureNumber', String(lectureNumber));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setStatus(`Done: ${file.name}: ${data.chunkCount} chunks (${data.priority} priority)`);
      onUploaded();
    } catch {
      setStatus(`Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Upload Document</h3>

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
        <p className="text-slate-400 text-sm">Drop PDF, PPTX, or DOCX here</p>
        <p className="text-slate-300 text-xs mt-1">or click to browse</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.pptx,.docx"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        className="hidden"
      />

      {status && (
        <p className={`mt-3 text-sm ${status.startsWith('Done') ? 'text-emerald-600' : status.startsWith('Failed') ? 'text-red-500' : 'text-slate-500'}`}>
          {uploading ? 'Processing... ' : ''}{status}
        </p>
      )}
    </div>
  );
}
