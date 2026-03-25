import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const SCORE_FIELDS = [
  'pub_look_cleanliness',
  'staff',
  'glass_pour',
  'taste_quality',
  'price_score',
] as const;

function sanitiseScores(body: Record<string, unknown>): Record<string, unknown> {
  const out = { ...body };
  for (const field of SCORE_FIELDS) {
    if (field in out) {
      const v = parseFloat(String(out[field]));
      out[field] = Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
    }
  }
  return out;
}

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
    const raw = await request.json();
    const body = sanitiseScores(raw);
    const admin = await createAdminClient();
    // Supabase generic types resolve `.update()` param as `never` (pre-existing project issue).
    // @ts-ignore
    const { data, error } = await admin.from('reviews').update(body).eq('id', id).select().single();

    if (error) {
      console.error('[PATCH /api/admin/reviews/[id]]', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[PATCH /api/admin/reviews/[id]] unexpected:', err);
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
    const { error } = await admin.from('reviews').delete().eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/reviews/[id]]', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/reviews/[id]] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
