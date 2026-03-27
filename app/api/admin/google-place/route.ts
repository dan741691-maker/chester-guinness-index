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

// ── Shared helper: fetch full place details by placeId ──────────────────────
async function fetchPlaceDetails(placeId: string, apiKey: string) {
  const fields = 'name,formatted_address,geometry,address_components,url,photos';
  const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();

  if (data.status !== 'OK') {
    return {
      error: `Google Places API returned: ${data.status}`,
      hint: data.error_message as string | undefined,
    };
  }

  const r = data.result;
  const components: AddressComponent[] = r.address_components ?? [];
  const get = (type: string) =>
    components.find((c: AddressComponent) => c.types.includes(type))?.long_name ?? '';

  const streetNumber = get('street_number');
  const route = get('route');
  const postcode = get('postal_code');
  // Prefer sublocality/neighbourhood (e.g. Hoole, Temple Bar) over city
  const sublocality =
    get('sublocality_level_1') || get('sublocality') || get('neighborhood') || '';
  const city =
    get('locality') || get('postal_town') || get('administrative_area_level_2') || '';
  const region = get('administrative_area_level_1');
  const country = get('country');
  const street = [streetNumber, route].filter(Boolean).join(' ');
  const localAddress = street && city ? `${street}, ${city}` : street || '';
  const photoRef: string | null = r.photos?.[0]?.photo_reference ?? null;

  return {
    placeId,
    name: (r.name ?? '') as string,
    formattedAddress: localAddress || (r.formatted_address as string),
    fullFormattedAddress: r.formatted_address as string,
    lat: (r.geometry?.location?.lat ?? null) as number | null,
    lng: (r.geometry?.location?.lng ?? null) as number | null,
    postcode: postcode || null,
    sublocality: sublocality || null,
    city: city || null,
    region: region || null,
    country: country || null,
    googleUrl: (r.url ?? null) as string | null,
    addressComponents: components,
    photoRef,
  };
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
    // ── Search by name ──────────────────────────────────────────────────────
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

    // ── Place details by placeId ────────────────────────────────────────────
    if (type === 'details') {
      const placeId = searchParams.get('placeId');
      if (!placeId) return NextResponse.json({ error: 'placeId is required' }, { status: 400 });

      const details = await fetchPlaceDetails(placeId, apiKey);
      if ('error' in details) {
        console.error('[google-place details]', details.error);
        return NextResponse.json(
          { error: details.error, hint: details.hint ?? 'Ensure the Places API is enabled in Google Cloud Console.' },
          { status: 502 },
        );
      }
      return NextResponse.json(details);
    }

    // ── Resolve a URL (shortened or full) server-side ───────────────────────
    // Handles share.google/... goo.gl/... maps.app.goo.gl/... and full Maps URLs.
    // Follows HTTP redirects, then extracts place name or coords from the final URL,
    // and returns full place details when possible.
    if (type === 'resolve-url') {
      const rawUrl = searchParams.get('url');
      if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 });

      // Follow redirects server-side (5 s timeout)
      let finalUrl = rawUrl;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const resolved = await fetch(rawUrl, {
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Chester-Guinness-Index/1.0)' },
        });
        clearTimeout(timer);
        // Drain/cancel body — we only need the final URL
        resolved.body?.cancel();
        finalUrl = resolved.url;
      } catch {
        // If resolution fails, fall through with the original URL — full Maps URLs
        // still parse correctly from client patterns even without redirect following.
        finalUrl = rawUrl;
      }

      // Extract place name from /place/Name path segment
      const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/);
      const placeName = placeMatch
        ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        : null;

      // Extract coords from @lat,lng or ?q=lat,lng
      const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      const qCoordMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      const lat = coordMatch
        ? parseFloat(coordMatch[1])
        : qCoordMatch
          ? parseFloat(qCoordMatch[1])
          : null;
      const lng = coordMatch
        ? parseFloat(coordMatch[2])
        : qCoordMatch
          ? parseFloat(qCoordMatch[2])
          : null;

      // Try extracting place name from ?q=Name+of+Place (non-coordinate query)
      let qNameMatch: string | null = null;
      if (!placeMatch) {
        const qParam = finalUrl.match(/[?&]q=([^&]+)/)?.[1];
        if (qParam) {
          const decoded = decodeURIComponent(qParam.replace(/\+/g, ' '));
          // Only treat as a name if it doesn't look like a bare coordinate pair
          if (!/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(decoded)) {
            qNameMatch = decoded;
          }
        }
      }

      const nameToSearch = placeName || qNameMatch;

      if (nameToSearch) {
        // Search Google Places for the extracted name and return full details
        const searchUrl = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(nameToSearch)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
        const searchData = await searchRes.json();

        if (searchData.status === 'OK' && searchData.results?.length) {
          const placeId = (searchData.results[0] as GooglePlaceResult).place_id;
          const details = await fetchPlaceDetails(placeId, apiKey);
          if ('error' in details) {
            return NextResponse.json(
              { error: details.error, hint: details.hint },
              { status: 502 },
            );
          }
          return NextResponse.json(details);
        }
        // Name search returned nothing — fall through to coords if available
      }

      // Coords-only fallback
      if (lat !== null && lng !== null) {
        return NextResponse.json({ lat, lng });
      }

      // Nothing worked
      return NextResponse.json(
        {
          error: 'Could not extract location from this link.',
          hint: 'Try copying the full URL from Google Maps, or use the pub name search instead.',
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: 'type must be "search", "details", or "resolve-url"' }, { status: 400 });
  } catch (err) {
    console.error('[GET /api/admin/google-place] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
