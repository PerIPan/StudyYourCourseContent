'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavTabs } from '@/components/NavTabs';
import { AdminUpload } from '@/components/AdminUpload';
import { AdminDocList } from '@/components/AdminDocList';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { AdminDoc } from '@/types';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<AdminDoc[]>([]);

  useEffect(() => {
    if (!loading && role !== 'admin') router.push('/');
  }, [loading, role, router]);

  useEffect(() => {
    if (role === 'admin') fetchDocuments();
  }, [role]);

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    if (res.ok) setDocuments(await res.json());
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document and all its chunks?')) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchDocuments();
  }

  if (loading || role !== 'admin') return null;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header
        className="border-b px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--text-muted)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            CLA Knowledgebase
          </span>
          <NavTabs isAdmin={true} />
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Admin Panel
        </h2>

        <AdminUpload onUploaded={fetchDocuments} />

        <h3 className="font-semibold text-sm mb-2 mt-6" style={{ color: 'var(--text-secondary)' }}>
          Uploaded Documents
        </h3>
        <AdminDocList documents={documents} onDelete={handleDelete} />
      </main>
    </div>
  );
}
