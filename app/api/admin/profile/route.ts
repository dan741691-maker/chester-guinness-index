import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateReviewerProfile,
  updateReviewerProfile,
} from '@/services/reviewer-profiles';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await getOrCreateReviewerProfile(user.id, user.email!);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[GET /api/admin/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const allowed = ['display_name', 'avatar_url', 'accent_color'] as const;
    const input = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(([k]) =>
        (allowed as readonly string[]).includes(k),
      ),
    ) as { display_name?: string; avatar_url?: string | null; accent_color?: string };

    const profile = await updateReviewerProfile(user.id, input);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[PATCH /api/admin/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
