'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, Star, Share2, LogOut, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pubs', label: 'Pubs', icon: MapPin, exact: false },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, exact: false },
  { href: '/admin/social', label: 'Social', icon: Share2, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-border bg-surface fixed left-0 top-0">
        {/* Sidebar header */}
        <div className="px-4 py-5 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🍺</span>
            <div className="leading-tight">
              <div className="text-[10px] text-cream-muted/40 uppercase tracking-widest">The</div>
              <div className="text-xs font-serif font-bold text-gold leading-none">
                CGI Admin
              </div>
            </div>
          </Link>
        </div>

        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <p className="text-[10px] text-cream-muted/30 uppercase tracking-widest px-3 mb-3">
            Admin
          </p>
          <nav className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-gold/10 text-gold border border-gold/20'
                      : 'text-cream-muted hover:bg-surface-2 hover:text-cream'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-border/50 space-y-0.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-cream-muted/50 hover:bg-surface-2 hover:text-cream transition-colors"
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              View site
            </Link>
          </div>
        </div>

        <div className="p-3 border-t border-border flex-shrink-0">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-cream-muted hover:bg-red-500/10 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface safe-area-inset-bottom">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center py-3 gap-1 text-[11px] font-medium transition-colors min-w-0',
                  active ? 'text-gold' : 'text-cream-muted/70'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="flex-1 flex flex-col items-center py-3 gap-1 text-[11px] font-medium text-cream-muted/50 hover:text-cream-muted transition-colors min-w-0"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
