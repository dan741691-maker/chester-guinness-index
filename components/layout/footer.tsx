import Link from 'next/link';
import { brand } from '@/lib/brand';

export function Footer() {
  return (
    <footer className="border-t border-border bg-black py-6 px-4">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream-muted/40">
        <div className="flex items-baseline gap-2">
          <span className="font-serif">{brand.siteName}</span>
          <span className="text-cream-muted/25">·</span>
          <span className="text-cream-muted/30">by {brand.parent}</span>
        </div>
        <span>Independent Guinness reviews across Chester pubs</span>
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} {brand.parent}</span>
          <Link
            href="/login"
            className="text-cream-muted/30 hover:text-cream-muted/60 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
