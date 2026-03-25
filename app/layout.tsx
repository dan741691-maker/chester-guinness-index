import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: {
    default: brand.siteName,
    template: `%s | ${brand.siteName}`,
  },
  description: brand.tagline,
  keywords: ['Chester', 'Guinness', 'pub review', 'Chester pubs', 'pint review'],
  openGraph: {
    title: brand.siteName,
    description: brand.tagline,
    type: 'website',
    locale: 'en_GB',
    siteName: `${brand.siteName} · by ${brand.parent}`,
  },
};

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#080808] text-cream antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
