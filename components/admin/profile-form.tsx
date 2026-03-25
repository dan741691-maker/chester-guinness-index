'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { ReviewerProfile } from '@/types';

interface ProfileFormProps {
  profile: ReviewerProfile;
}

export function ProfileForm({ profile: initial }: ProfileFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initial.display_name);
  const [accentColor, setAccentColor] = useState(initial.accent_color);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await fetch('/api/admin/profile/avatar', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Avatar upload failed');
        finalAvatarUrl = json.url as string;
        setAvatarUrl(finalAvatarUrl);
        setAvatarPreview(null);
        setAvatarFile(null);
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || initial.display_name,
          accent_color: accentColor,
          avatar_url: finalAvatarUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');

      toast({ title: 'Profile saved', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Avatar */}
      <div className="space-y-2">
        <Label>Avatar</Label>
        <div className="flex items-center gap-4">
          {/* Preview circle */}
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-2"
            style={{ border: `3px solid ${accentColor}` }}
          >
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt="Avatar preview"
                width={64}
                height={64}
                className="object-cover w-full h-full"
                unoptimized={!!avatarPreview}
              />
            ) : (
              <span className="text-2xl opacity-30">👤</span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {displayAvatar ? 'Change photo' : 'Upload photo'}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-cream-muted/40">
          JPG or PNG. Shown as a small circle on public reviews.
        </p>
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="h-11"
        />
      </div>

      {/* Accent colour */}
      <div className="space-y-1.5">
        <Label htmlFor="accent_color">Accent colour</Label>
        <div className="flex items-center gap-3">
          <input
            id="accent_color"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5"
          />
          <Input
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#C9A84C"
            className="h-11 font-mono w-32"
            maxLength={7}
          />
          <span className="text-xs text-cream-muted/40">
            Used as border on your avatar + review cards
          </span>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label>Email</Label>
        <p className="text-sm text-cream-muted/50 font-mono">{initial.email}</p>
      </div>

      <Button type="submit" size="lg" disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  );
}
