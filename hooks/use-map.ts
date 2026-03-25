'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { CHESTER_CENTER, DEFAULT_ZOOM, DARK_MAP_STYLES } from '@/lib/constants';
import { getRatingTier, scoreColor, formatScore } from '@/lib/utils';
import type { Pub, PubWithLatestImage } from '@/types';

interface UseMapOptions {
  pubs: PubWithLatestImage[];
  onPubSelect?: (pub: PubWithLatestImage) => void;
  selectedPubId?: string | null;
}

export function useMap({ pubs, onPubSelect, selectedPubId }: UseMapOptions) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise map once
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      version: 'weekly',
      libraries: ['marker'],
    });

    loader
      .load()
      .then(() => {
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: CHESTER_CENTER,
          zoom: DEFAULT_ZOOM,
          styles: DARK_MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Google Maps failed to load:', err);
        setError('Failed to load map');
      });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
    };
  }, []);

  // Render markers whenever map is ready or pubs change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    pubs.forEach((pub) => {
      const color = scoreColor(pub.current_score);
      const svg = buildMarkerSvg(pub.current_score, color);

      const marker = new google.maps.Marker({
        position: { lat: pub.lat, lng: pub.lng },
        map: mapInstanceRef.current!,
        title: pub.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(48, 56),
          anchor: new google.maps.Point(24, 56),
        },
        optimized: false,
      });

      marker.addListener('click', () => {
        onPubSelect?.(pub);
      });

      markersRef.current.set(pub.id, marker);
    });
  }, [isLoaded, pubs, onPubSelect]);

  // Pan to pub when selection changes (handles list-click case)
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !selectedPubId) return;
    const pub = pubs.find((p) => p.id === selectedPubId);
    if (!pub) return;
    mapInstanceRef.current.panTo({ lat: pub.lat, lng: pub.lng });
    mapInstanceRef.current.setZoom(16);
  }, [isLoaded, selectedPubId, pubs]);

  const panToPub = useCallback((pub: PubWithLatestImage) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: pub.lat, lng: pub.lng });
    mapInstanceRef.current.setZoom(16);
  }, []);

  const resetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(CHESTER_CENTER);
    mapInstanceRef.current.setZoom(DEFAULT_ZOOM);
  }, []);

  return { mapRef, isLoaded, error, panToPub, resetView };
}

function buildMarkerSvg(score: number, color: string): string {
  const displayScore = score > 0 ? formatScore(score) : '?';
  // Longer strings (e.g. "36.7" = 4 chars) need a smaller font to fit in the pin
  const fontSize = displayScore.length >= 4 ? '9' : displayScore.length >= 3 ? '11' : '12';
  return `
    <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <path
        d="M24 2 C12.954 2 4 10.954 4 22 C4 33 24 54 24 54 C24 54 44 33 44 22 C44 10.954 35.046 2 24 2Z"
        fill="#0a0a0a"
        stroke="${color}"
        stroke-width="2.5"
        filter="url(#shadow)"
      />
      <circle cx="24" cy="22" r="12" fill="${color}" opacity="0.15"/>
      <text
        x="24"
        y="27"
        text-anchor="middle"
        font-family="Georgia, serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="${color}"
      >${displayScore}</text>
    </svg>
  `.trim();
}
