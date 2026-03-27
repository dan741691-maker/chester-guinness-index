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

    // Fall back to octet-stream if the browser did not supply a MIME type
    // (common for HEIC / HEIF files on some iOS versions)
    const contentType = file.type || 'application/octet-stream';

    console.log('[POST /api/admin/upload] path:', path, 'contentType:', contentType, 'size:', buffer.length);

    const { error } = await admin.storage
      .from('pub-images')
      .upload(path, buffer, { contentType, upsert: true });

    if (error) {
      console.error('[POST /api/admin/upload] storage error:', {
        message: error.message,
        name: error.name,
        status: (error as { status?: number }).status,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = admin.storage.from('pub-images').getPublicUrl(path);
    console.log('[POST /api/admin/upload] success, url:', data.publicUrl);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[POST /api/admin/upload] unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
