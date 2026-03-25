import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/layout/admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <AdminNav />
      <div className="md:pl-56 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</div>
      </div>
    </div>
  );
}
