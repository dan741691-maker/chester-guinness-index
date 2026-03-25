'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PubImage } from '@/types';

interface PhotoGalleryProps {
  images: PubImage[];
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images.length) return null;

  function prev() {
    setLightboxIdx((i) => (i === null ? null : i === 0 ? images.length - 1 : i - 1));
  }

  function next() {
    setLightboxIdx((i) => (i === null ? null : i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setLightboxIdx(idx)}
            className="relative aspect-square rounded-md overflow-hidden bg-surface-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <Image
              src={img.image_url}
              alt={img.caption ?? 'Pub photo'}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-cream-muted hover:text-cream"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div
            className="relative max-w-3xl w-full mx-4 aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIdx].image_url}
              alt={images[lightboxIdx].caption ?? ''}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
            {images[lightboxIdx].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-sm text-cream-muted">
                {images[lightboxIdx].caption}
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-cream-muted hover:text-cream"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 p-2 text-cream-muted hover:text-cream"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-cream-muted/50">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
