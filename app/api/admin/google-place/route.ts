import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: { location?: { lat: number; lng: number } };
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    if (type === 'search') {
      const q = searchParams.get('q');
      if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

      const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      const data = await res.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('[google-place search]', data.status, data.error_message);
        return NextResponse.json(
          {
            error: `Google Places API returned: ${data.status}`,
            hint: data.error_message ?? 'Ensure the Places API is enabled in Google Cloud Console.',
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        results: (data.results ?? []).slice(0, 6).map((r: GooglePlaceResult) => ({
          placeId: r.place_id,
          name: r.name,
          formattedAddress: r.formatted_address,
          lat: r.geometry?.location?.lat,
          lng: r.geometry?.location?.lng,
        })),
      });
    }

    if (type === 'details') {
      const placeId = searchParams.get('placeId');
      if (!placeId) return NextResponse.json({ error: 'placeId is required' }, { status: 400 });

      const fields = 'name,formatted_address,geometry,address_components,url,photos';
      const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      const data = await res.json();

      if (data.status !== 'OK') {
        console.error('[google-place details]', data.status, data.error_message);
        return NextResponse.json(
          {
            error: `Google Places API returned: ${data.status}`,
            hint: data.error_message ?? 'Ensure the Places API is enabled in Google Cloud Console.',
          },
          { status: 502 },
        );
      }

      const r = data.result;
      const components: AddressComponent[] = r.address_components ?? [];
      const get = (type: string) =>
        components.find((c: AddressComponent) => c.types.includes(type))?.long_name ?? '';

      const streetNumber = get('street_number');
      const route = get('route');
      const postcode = get('postal_code');
      const street = [streetNumber, route].filter(Boolean).join(' ');
      // Build a clean local address — fallback to Google's full address if street unknown
      const localAddress = street ? `${street}, Chester` : '';

      // Extract first photo reference if available
      const photoRef = r.photos?.[0]?.photo_reference ?? null;

      return NextResponse.json({
        placeId,
        name: r.name ?? '',
        formattedAddress: localAddress || r.formatted_address,
        fullFormattedAddress: r.formatted_address,
        lat: r.geometry?.location?.lat ?? null,
        lng: r.geometry?.location?.lng ?? null,
        postcode: postcode || null,
        googleUrl: r.url ?? null,
        addressComponents: components,
        photoRef,
      });
    }

    return NextResponse.json({ error: 'type must be "search" or "details"' }, { status: 400 });
  } catch (err) {
    console.error('[GET /api/admin/google-place] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
