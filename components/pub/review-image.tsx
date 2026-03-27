'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ReviewImageProps {
  src: string;
}

export function ReviewImage({ src }: ReviewImageProps) {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-cream-muted/40 mb-2">Pint Photo</p>
      <div className="relative rounded-xl overflow-hidden aspect-video bg-surface-2">
        <Image
          src={src}
          alt="Review photo"
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          onError={() => setError(true)}
        />
      </div>
    </div>
  );
}
