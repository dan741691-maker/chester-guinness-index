'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PubHeroImageProps {
  src: string | null;
  fallbackSrc?: string | null;
  alt: string;
}

export function PubHeroImage({ src, fallbackSrc, alt }: PubHeroImageProps) {
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  const activeSrc = !src || primaryError
    ? (!fallbackError ? (fallbackSrc ?? null) : null)
    : src;

  if (!activeSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">
        🍺
      </div>
    );
  }

  return (
    <Image
      src={activeSrc}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
      onError={() => {
        if (activeSrc === src) setPrimaryError(true);
        else setFallbackError(true);
      }}
    />
  );
}
