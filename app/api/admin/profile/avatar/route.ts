import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = await createAdminClient();

    const { error } = await admin.storage
      .from('reviewer-avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error('[POST /api/admin/profile/avatar]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = admin.storage.from('reviewer-avatars').getPublicUrl(path);
    // Cache-bust so the new image shows immediately
    return NextResponse.json({ url: `${data.publicUrl}?t=${Date.now()}` });
  } catch (err) {
    console.error('[POST /api/admin/profile/avatar] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
