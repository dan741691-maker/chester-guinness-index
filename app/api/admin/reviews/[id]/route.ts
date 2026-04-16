import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const SCORE_FIELDS = [
  'pub_ambience',
  'staff',
  'glass_pour',
  'la_pinte',
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

    console.log('[PATCH /api/admin/reviews/[id]] id:', id, 'fields:', Object.keys(body));

    const admin = await createAdminClient();
    // Supabase generic types resolve `.update()` param as `never` (pre-existing project issue).
    // @ts-ignore
    const { data, error } = await admin.from('reviews').update(body).eq('id', id).select().single();

    if (error) {
      console.error('[PATCH /api/admin/reviews/[id]] db error:', {
        id,
        fields: Object.keys(body),
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
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

    // Fetch pub_id and is_official before deleting so we can recalculate after
    // @ts-ignore — pre-existing project-wide Supabase type mismatch
    const { data: review, error: fetchError } = await admin
      .from('reviews')
      .select('pub_id, is_official')
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const { error } = await admin.from('reviews').delete().eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/reviews/[id]]', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }

    // Recalculate pub score from remaining reviews (guards against broken DB trigger)
    const reviewData = review as { pub_id: string; is_official: boolean };
    if (reviewData.is_official) {
      // @ts-ignore — pre-existing project-wide Supabase type mismatch
      const { data: latest } = await admin
        .from('reviews')
        .select('total_score')
        .eq('pub_id', reviewData.pub_id)
        .eq('is_official', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const latestData = latest as { total_score: number } | null;
      if (latestData) {
        const score = latestData.total_score;
        const tier =
          score >= 46 ? 'Legendary' :
          score >= 41 ? 'Elite' :
          score >= 36 ? 'Strong' :
          score >= 31 ? 'Decent' :
          score >= 21 ? 'Weak' : 'Avoid';
        const pubUpdate = admin.from('pubs').update(
          // @ts-ignore — pre-existing project-wide Supabase type mismatch
          { current_score: score, current_rating_tier: tier }
        ).eq('id', reviewData.pub_id);
        await pubUpdate;
      } else {
        // No official reviews remain — reset
        const pubReset = admin.from('pubs').update(
          // @ts-ignore — pre-existing project-wide Supabase type mismatch
          { current_score: 0, current_rating_tier: null }
        ).eq('id', reviewData.pub_id);
        await pubReset;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/reviews/[id]] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
