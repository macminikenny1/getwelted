'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setUsernameStatus('idle'); return; }

    setUsernameStatus('checking');
    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 400);

    return () => clearTimeout(timeout);
  }, [username]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Username is already taken');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user && !data.session) {
      // Email confirmation required — show check-email message
      setEmailSent(true);
      setLoading(false);
    } else {
      // Auto-confirmed (e.g. if email confirmation is disabled in Supabase)
      router.push('/');
      router.refresh();
    }
  };

  // Email verification sent screen
  if (emailSent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-welted-success/20 flex items-center justify-center">
            <Mail size={28} className="text-welted-success" />
          </div>
          <h1 className="text-welted-text font-bold text-xl mb-2">Check your email</h1>
          <p className="text-welted-text-muted text-sm leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="text-welted-text font-medium">{email}</span>.
            Click the link to verify your account and start using Welted.
          </p>
        </div>

        <p className="text-welted-text-muted text-xs mb-6">
          Didn&apos;t receive the email? Check your spam folder.
        </p>

        <Link
          href="/login"
          className="text-welted-text-muted text-sm hover:text-welted-text transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="text-welted-accent font-black tracking-[0.4em] text-3xl mb-2">WELTED</h1>
        <p className="text-welted-text-muted text-sm">Join the community</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        {error && (
          <div className="bg-welted-danger/10 border border-welted-danger/30 rounded-lg px-4 py-3 text-welted-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="boot_lover_42"
            required
            maxLength={20}
            autoComplete="username"
          />
          {usernameStatus === 'available' && (
            <p className="text-welted-success text-xs mt-1">Username available</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="text-welted-danger text-xs mt-1">Username taken</p>
          )}
        </div>

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
          <label className="block text-welted-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-welted-input-bg border border-welted-border rounded-lg px-4 py-3 text-welted-text placeholder:text-welted-text-muted/50 focus:border-welted-accent outline-none transition-colors"
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || usernameStatus === 'taken'}
          className="w-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-6 text-welted-text-muted text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-welted-accent font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
