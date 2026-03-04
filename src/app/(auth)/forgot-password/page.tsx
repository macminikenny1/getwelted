'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-welted-success/20 flex items-center justify-center">
            <Mail size={28} className="text-welted-success" />
          </div>
          <h1 className="text-welted-text font-bold text-xl mb-2">Check your email</h1>
          <p className="text-welted-text-muted text-sm leading-relaxed">
            We&apos;ve sent a password reset link to{' '}
            <span className="text-welted-text font-medium">{email}</span>.
            Click the link in the email to set a new password.
          </p>
        </div>

        <p className="text-welted-text-muted text-xs mb-6">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>

        <button
          onClick={() => { setSent(false); setEmail(''); }}
          className="text-welted-accent text-sm font-semibold hover:underline"
        >
          Try a different email
        </button>

        <div className="mt-6">
          <Link href="/login" className="text-welted-text-muted text-sm hover:text-welted-text transition-colors inline-flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <h1 className="text-welted-accent font-black tracking-[0.4em] text-3xl mb-2">WELTED</h1>
        <p className="text-welted-text-muted text-sm">Reset your password</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        {error && (
          <div className="bg-welted-danger/10 border border-welted-danger/30 rounded-lg px-4 py-3 text-welted-danger text-sm">
            {error}
          </div>
        )}

        <p className="text-welted-text-muted text-sm">
          Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
        </p>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center mt-6">
        <Link href="/login" className="text-welted-text-muted text-sm hover:text-welted-text transition-colors inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
