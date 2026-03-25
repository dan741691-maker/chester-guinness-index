import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PubForm } from '@/components/admin/pub-form';
import { brand } from '@/lib/brand';

export const metadata: Metadata = { title: 'Add New Pub' };

export default function NewPubPage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pubs"
          className="flex items-center gap-1.5 text-sm text-cream-muted/60 hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pubs
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-cream">Add New Pub</h1>
        <p className="text-sm text-cream-muted/60 mt-1">
          Register a new pub on {brand.siteName}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <PubForm successRedirectUrl="/admin/pubs" />
      </div>
    </div>
  );
}
