'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/LoginForm';
import { useEffect } from 'react';

export default function Home() {
  const { role, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role) router.push('/chat');
  }, [role, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  async function handleLogin(password: string) {
    await login(password);
    router.push('/chat');
  }

  return <LoginForm onLogin={handleLogin} />;
}
