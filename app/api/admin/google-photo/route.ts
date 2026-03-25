import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref');
  if (!ref) return NextResponse.json({ error: 'ref is required' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    // Google Places Photo API follows redirects to the actual image
    const photoUrl = `${PLACES_BASE}/photo?maxwidth=1200&photoreference=${encodeURIComponent(ref)}&key=${apiKey}`;
    const res = await fetch(photoUrl, { redirect: 'follow' });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo from Google' }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/google-photo]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
