'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show contextual messages from redirects
  const callbackError = searchParams.get('error');
  const verified = searchParams.get('verified');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="text-welted-accent font-black tracking-[0.4em] text-3xl mb-2">WELTED</h1>
        <p className="text-welted-text-muted text-sm">Heritage boot community</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {callbackError === 'auth_callback_failed' && (
          <div className="bg-welted-danger/10 border border-welted-danger/30 rounded-lg px-4 py-3 text-welted-danger text-sm">
            The email link has expired or is invalid. Please try again.
          </div>
        )}

        {verified === 'true' && (
          <div className="bg-welted-success/10 border border-welted-success/30 rounded-lg px-4 py-3 text-welted-success text-sm">
            Email verified successfully! You can now sign in.
          </div>
        )}

        {error && (
          <div className="bg-welted-danger/10 border border-welted-danger/30 rounded-lg px-4 py-3 text-welted-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="you@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-welted-text-muted text-xs font-semibold uppercase tracking-wider">Password</label>
            <Link href="/forgot-password" className="text-welted-accent text-xs font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="Your password"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-welted-border" />
        <span className="text-welted-text-muted text-xs uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-welted-border" />
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full bg-welted-card border border-welted-border hover:bg-welted-card-hover text-welted-text font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
      </button>

      <p className="text-center mt-6 text-welted-text-muted text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-welted-accent font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
