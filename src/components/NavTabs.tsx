'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function NavTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/chat', label: 'Chat' },
    { href: '/exam', label: 'Exam Prep - beta' },
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
              ? 'font-semibold border-b-2'
              : 'border-transparent'
          }`}
          style={
            pathname === tab.href
              ? { color: 'var(--accent)', borderColor: 'var(--accent)' }
              : { color: 'var(--text-secondary)' }
          }
        >
          {tab.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="ml-2 px-3 py-1.5 text-xs transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        Logout
      </button>
    </div>
  );
}
