'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Share2, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SocialPost } from '@/types';

interface SocialPostCardProps {
  post: SocialPost & { pub: { name: string; slug: string } };
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function markPosted() {
    const res = await fetch(`/api/admin/social-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_posted: true }),
    });
    if (res.ok) {
      toast({ title: 'Marked as posted', variant: 'success' });
      router.refresh();
    } else {
      const json = await res.json();
      toast({ title: 'Failed to mark posted', description: json.error, variant: 'destructive' });
    }
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/admin/social-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast({ title: 'Error saving', description: json.error, variant: 'destructive' });
    } else {
      setEditing(false);
      toast({ title: 'Post updated', variant: 'success' });
      router.refresh();
    }
    setSaving(false);
  }

  async function deletePost() {
    if (!confirm('Delete this social post?')) return;
    const res = await fetch(`/api/admin/social-posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      toast({ title: 'Failed to delete', description: json.error, variant: 'destructive' });
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 transition-colors',
        post.is_posted ? 'border-border/40 opacity-60' : 'border-border bg-surface'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-cream font-serif">{post.pub.name}</p>
          <p className="text-xs text-cream-muted/50">{formatDate(post.created_at)}</p>
        </div>
        {post.is_posted && (
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-sm px-2 py-0.5">
            Posted
          </span>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="text-xs font-mono"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setContent(post.content); setEditing(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <pre className="text-xs text-cream-muted whitespace-pre-wrap font-sans leading-relaxed bg-surface-2 border border-border rounded-md p-3">
          {content}
        </pre>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>

          {!post.is_posted && (
            <Button size="sm" variant="secondary" onClick={markPosted} className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Mark posted
            </Button>
          )}

          <Button size="sm" variant="destructive" onClick={deletePost} className="gap-1.5 ml-auto">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
