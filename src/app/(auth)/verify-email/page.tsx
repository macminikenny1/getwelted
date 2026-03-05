'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || resending || cooldown > 0) return;

    setResending(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Verification email sent! Check your inbox.', type: 'success' });
      setCooldown(COOLDOWN_SECONDS);
    }

    setResending(false);
  }, [email, resending, cooldown]);

  return (
    <div className="w-full max-w-sm text-center">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-welted-success/20 flex items-center justify-center">
          <Mail size={28} className="text-welted-success" />
        </div>
        <h1 className="text-welted-text font-bold text-xl mb-2">Check your email</h1>
        <p className="text-welted-text-muted text-sm leading-relaxed">
          We&apos;ve sent a verification link to{' '}
          {email ? (
            <span className="text-welted-text font-medium">{email}</span>
          ) : (
            <span className="text-welted-text font-medium">your email</span>
          )}
          . Click the link to verify your account and start using Welted.
        </p>
      </div>

      {/* Status messages */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-welted-success/10 border border-welted-success/30 text-welted-success'
              : 'bg-welted-danger/10 border border-welted-danger/30 text-welted-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Resend button */}
      {email && (
        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="w-full bg-welted-accent hover:bg-welted-accent-dim text-welted-bg font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
          {resending
            ? 'Sending...'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend Verification Email'}
        </button>
      )}

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

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
