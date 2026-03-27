'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PubHeroImageProps {
  src: string | null;
  alt: string;
}

export function PubHeroImage({ src, alt }: PubHeroImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">
        🍺
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
      onError={() => setError(true)}
    />
  );
}
