import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { courses } from '@/../drizzle/schema';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) return NextResponse.json([], { status: 401 });

  const allCourses = await db.select().from(courses);
  return NextResponse.json(allCourses);
}
