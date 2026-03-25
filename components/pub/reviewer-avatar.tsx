import Image from 'next/image';
import type { ReviewerSummary } from '@/types';

interface ReviewerAvatarProps {
  reviewer: ReviewerSummary;
  size?: number;
}

/**
 * Small circular avatar for a reviewer, with their accent colour as border.
 * Only renders when avatar_url is present.
 */
export function ReviewerAvatar({ reviewer, size = 28 }: ReviewerAvatarProps) {
  if (!reviewer.avatar_url) return null;

  return (
    <div
      title={reviewer.display_name}
      className="rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/40"
      style={{
        width: size,
        height: size,
        border: `2px solid ${reviewer.accent_color}`,
      }}
    >
      <Image
        src={reviewer.avatar_url}
        alt={reviewer.display_name}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        unoptimized
      />
    </div>
  );
}
