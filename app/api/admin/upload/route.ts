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
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: 'file and path are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = await createAdminClient();

    const { error } = await admin.storage
      .from('pub-images')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error('[POST /api/admin/upload]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = admin.storage.from('pub-images').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[POST /api/admin/upload] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
