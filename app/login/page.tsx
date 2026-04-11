'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { brand } from '@/lib/brand';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (signupPassword !== signupConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: 'Display name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });

    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // @ts-ignore — pre-existing project-wide type mismatch between Database and supabase-js generics
      await supabase.from('reviewer_profiles').upsert(
        {
          user_id: userId,
          email: signupEmail,
          display_name: displayName.trim(),
        },
        { onConflict: 'user_id' },
      );
    }

    setLoading(false);
    setSignupDone(true);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setSignupDone(false);
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
          <p className="text-sm text-cream-muted/60">
            {mode === 'login' ? 'Admin access only' : 'Request an account'}
          </p>
        </div>

        {mode === 'login' ? (
          <>
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs text-cream-muted/40 hover:text-gold transition-colors underline-offset-2 hover:underline"
              >
                Create account
              </button>
            </div>
          </>
        ) : signupDone ? (
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-6 text-center space-y-3">
            <div className="text-3xl">✓</div>
            <p className="text-sm font-medium text-cream">Account created — you can now log in.</p>
            <p className="text-xs text-cream-muted/50">
              Check your email to confirm your address, then sign in below.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => switchMode('login')}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Display name</Label>
                <Input
                  id="su-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-confirm">Confirm password</Label>
                <Input
                  id="su-confirm"
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="text-base"
                />
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? 'Creating account…' : 'Request account'}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-cream-muted/40 hover:text-gold transition-colors underline-offset-2 hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-cream-muted/30">
          &copy; {new Date().getFullYear()} {brand.parent}
        </p>
      </div>
    </div>
  );
}
