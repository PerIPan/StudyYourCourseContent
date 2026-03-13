import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signCookie, verifyCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { password } = body;

  let role: 'admin' | 'student';
  if (password === process.env.ADMIN_PASSWORD) {
    role = 'admin';
  } else if (password === process.env.CLASS_PASSWORD) {
    role = 'student';
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('cla-auth', signCookie(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return NextResponse.json({ role });
}

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');

  if (!auth) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const role = verifyCookie(auth.value);
  if (!role || !['student', 'admin'].includes(role)) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  return NextResponse.json({ role });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('cla-auth');
  return NextResponse.json({ ok: true });
}
