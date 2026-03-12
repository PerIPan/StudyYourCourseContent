import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  let role: 'admin' | 'student';
  if (password === process.env.ADMIN_PASSWORD) {
    role = 'admin';
  } else if (password === process.env.CLASS_PASSWORD) {
    role = 'student';
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('cla-auth', role, {
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

  if (!auth || !['student', 'admin'].includes(auth.value)) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  return NextResponse.json({ role: auth.value });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('cla-auth');
  return NextResponse.json({ ok: true });
}
