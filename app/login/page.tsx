'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { brand } from '@/lib/brand';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🍺</div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            {brand.siteName}
          </h1>
          <p className="text-sm text-cream-muted/60">Admin access only</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="text-base"
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-cream-muted/30">
          &copy; {new Date().getFullYear()} {brand.parent}
        </p>
      </div>
    </div>
  );
}
