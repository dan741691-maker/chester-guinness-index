import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const admin = await createAdminClient();
    // Supabase generic types resolve `.update()` param as `never` in this project.
    // Same pre-existing issue exists in services/pubs.ts. @ts-ignore is the correct
    // suppressor since `never` rejects even `any`.
    // @ts-ignore
    const { data, error } = await admin.from('pubs').update(body).eq('id', id).select().single();

    if (error) {
      console.error('[PATCH /api/admin/pubs/[id]]', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PATCH /api/admin/pubs/[id]] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const admin = await createAdminClient();
    const { error } = await admin.from('pubs').delete().eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/pubs/[id]]', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/pubs/[id]] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
