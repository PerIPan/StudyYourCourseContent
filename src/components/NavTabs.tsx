'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/chat', label: 'Chat' },
    { href: '/exam', label: 'Exam Prep' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="flex gap-0">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            pathname === tab.href
              ? 'text-indigo-500 font-semibold border-indigo-500'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
