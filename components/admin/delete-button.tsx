'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function extractError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

interface DeleteButtonProps {
  table: 'pubs' | 'reviews';
  id: string;
  /** Pass the pub slug so the revalidation endpoint can flush the correct public page */
  pubSlug?: string;
  /** If set, redirect here after deletion (e.g. from a dedicated edit page) */
  redirectAfterDelete?: string;
}

export function DeleteButton({ table, id, pubSlug, redirectAfterDelete }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);

    try {
      // Route through the service-role API so RLS doesn't block deletes
      const res = await fetch(`/api/admin/${table}/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok) {
        console.error(`[DeleteButton] DELETE /api/admin/${table}/${id}`, json);
        toast({
          title: 'Delete failed',
          description: json.error ?? `HTTP ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: table === 'pubs' ? 'Pub deleted' : 'Review deleted',
        variant: 'success',
      });

      // Flush ISR cache (fire-and-forget)
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pubSlug }),
      }).catch(() => {});

      if (redirectAfterDelete) {
        router.push(redirectAfterDelete);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(`[DeleteButton] unexpected:`, err);
      toast({
        title: 'Delete failed',
        description: extractError(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="text-xs h-9 px-3"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm delete'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          className="text-xs h-9 px-2"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 h-9 w-9 p-0 flex-shrink-0"
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
