'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import { Suspense } from 'react';

/**
 * Auth callback handler — runs in the browser where PKCE code_verifier
 * cookie is accessible. Handles:
 * - Email verification after signup
 * - Password reset link
 * - OAuth provider redirects (Google, Apple, etc.)
 */
function CallbackHandler() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') || '/';
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/';

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth callback exchange failed:', error.message);
          setError(error.message);
        } else {
          // Hard navigation so the browser sends fresh auth cookies to the server.
          // router.replace() does a soft navigation where middleware may not
          // see the newly set session cookies yet.
          window.location.href = next;
        }
      });
    } else {
      // No code — redirect to login
      window.location.href = '/login';
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-welted-bg flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-welted-danger text-sm mb-4">Authentication failed: {error}</p>
          <a href="/login" className="text-welted-accent hover:underline text-sm">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-welted-bg flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-welted-text-muted text-sm mt-4">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-welted-bg flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
