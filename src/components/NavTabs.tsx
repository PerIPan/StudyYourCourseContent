'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function NavTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/chat', label: 'Chat' },
    { href: '/exam', label: 'Exam Prep' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  }

  return (
    <div className="flex gap-0 items-center">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
            pathname === tab.href
              ? 'text-indigo-500 font-semibold border-indigo-500'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="ml-2 px-3 py-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
