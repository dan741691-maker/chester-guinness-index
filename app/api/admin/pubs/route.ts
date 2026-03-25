import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const admin = await createAdminClient();
    const { data, error } = await admin.from('pubs').insert(body).select().single();

    if (error) {
      console.error('[POST /api/admin/pubs]', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[POST /api/admin/pubs] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
