import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));

    // Revalidate all public paths
    revalidatePath('/', 'layout');
    revalidatePath('/leaderboard');

    if (body.slug) {
      revalidatePath(`/pub/${body.slug}`);
    }

    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
