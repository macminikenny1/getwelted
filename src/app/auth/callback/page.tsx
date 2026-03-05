'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') || '/';
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/';

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth callback exchange failed:', error.message);
          router.replace('/login?error=auth_callback_failed');
        } else {
          router.replace(next);
          router.refresh();
        }
      });
    } else {
      // No code — redirect to login
      router.replace('/login?error=auth_callback_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-welted-bg flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-welted-text-muted text-sm mt-4">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
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
