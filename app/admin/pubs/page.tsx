import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllPubs } from '@/services/pubs';
import { PubsListClient } from '@/components/admin/pubs-list-client';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Manage Pubs' };
export const revalidate = 0;

export default async function AdminPubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const roleRes = user
    ? await supabase.from('reviewer_profiles').select('role').eq('user_id', user.id).single()
    : null;
  const role = roleRes?.data?.role ?? 'reviewer';
  const currentUserId = user?.id ?? null;

  const pubs = await getAllPubs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">Pubs</h1>
          <p className="text-sm text-cream-muted/60 mt-0.5">{pubs.length} pubs registered</p>
        </div>
        <Button size="sm" className="gap-2" asChild>
          <Link href="/admin/pubs/new">
            <Plus className="h-4 w-4" />
            Add Pub
          </Link>
        </Button>
      </div>

      <PubsListClient pubs={pubs} role={role} currentUserId={currentUserId} />
    </div>
  );
}
