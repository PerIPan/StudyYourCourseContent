import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (auth?.value !== 'admin') {
    return new Response('Admin access required', { status: 403 });
  }

  const result = await sql`
    SELECT d.*, c.name as course_name, c.slug as course_slug
    FROM documents d
    JOIN courses c ON d.course_id = c.id
    ORDER BY c.name, d.lecture_number, d.filename
  `;

  return NextResponse.json(result.rows);
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (auth?.value !== 'admin') {
    return new Response('Admin access required', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await sql`DELETE FROM documents WHERE id = ${id}`;

  return NextResponse.json({ deleted: id });
}
