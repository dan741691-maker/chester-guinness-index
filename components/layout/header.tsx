import Link from 'next/link';
import { MapPin, Trophy, Settings } from 'lucide-react';
import { brand } from '@/lib/brand';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-black/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl">🍺</span>
          <div className="leading-tight">
            <div className="text-xs text-cream-muted uppercase tracking-widest font-sans">The</div>
            <div className="text-sm font-serif font-bold text-gold leading-none">
              Chester Guinness Index
            </div>
            <div className="text-[10px] text-cream-muted/40 leading-none mt-0.5 tracking-wide">
              by {brand.parent}
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4 md:gap-6">
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-sm text-cream-muted hover:text-cream transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            Map
          </Link>
          <Link
            href="/leaderboard"
            className="hidden md:flex items-center gap-1.5 text-sm text-cream-muted hover:text-cream transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs text-cream-muted/50 hover:text-cream-muted border border-border rounded-md px-2.5 py-1.5 hover:border-gold/30 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
