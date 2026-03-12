'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavTabs } from '@/components/NavTabs';
import { AdminUpload } from '@/components/AdminUpload';
import { AdminDocList } from '@/components/AdminDocList';
import type { Course, AdminDoc } from '@/types';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<AdminDoc[]>([]);

  useEffect(() => {
    if (!loading && role !== 'admin') router.push('/');
  }, [loading, role, router]);

  useEffect(() => {
    if (role === 'admin') {
      fetchCourses();
      fetchDocuments();
    }
  }, [role]);

  async function fetchCourses() {
    const res = await fetch('/api/courses');
    if (res.ok) setCourses(await res.json());
  }

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    if (res.ok) setDocuments(await res.json());
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchDocuments();
  }

  if (loading || role !== 'admin') return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <span className="text-xl">🛡️</span>
        <span className="font-semibold text-slate-800 text-sm">CLA Knowledgebase</span>
        <NavTabs isAdmin={true} />
      </header>

      <main className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Admin Panel</h2>

        <AdminUpload courses={courses} onUploaded={fetchDocuments} />

        <h3 className="font-semibold text-slate-700 text-sm mb-2 mt-6">Uploaded Documents</h3>
        <AdminDocList documents={documents} onDelete={handleDelete} />
      </main>
    </div>
  );
}
