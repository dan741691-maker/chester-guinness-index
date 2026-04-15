'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RoleState {
  role: string | null;
  userId: string | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useRole(): RoleState {
  const [state, setState] = useState<RoleState>({
    role: null,
    userId: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState({ role: null, userId: null, loading: false, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from('reviewer_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      const role = data?.role ?? 'reviewer';
      if (!cancelled) {
        setState({ role, userId: user.id, loading: false, isAdmin: role === 'admin' });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
