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

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const raw = await request.json();
    const body = sanitiseScores(raw);
    const admin = await createAdminClient();
    const { data, error } = await admin.from('reviews').insert(body).select().single();

    if (error) {
      console.error('[POST /api/admin/reviews]', error);
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint, code: error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[POST /api/admin/reviews] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
