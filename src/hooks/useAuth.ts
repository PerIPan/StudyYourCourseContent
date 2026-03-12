'use client';

import { useState, useEffect } from 'react';

type Role = 'student' | 'admin' | null;

export function useAuth() {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.ok ? res.json() : { role: null })
      .then(data => setRole(data.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(password: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) throw new Error('Invalid password');

    const data = await res.json();
    setRole(data.role);
    return data.role as Role;
  }

  return { role, loading, login };
}
