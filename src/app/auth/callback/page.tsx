'use client';

import { useEffect, useState } from 'react';
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
  const [debugInfo, setDebugInfo] = useState<string>('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') || '/';
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/';

    setDebugInfo(`code=${code ? 'present' : 'missing'}, next=${next}`);

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          // Show error on page for debugging instead of redirecting
          setDebugInfo(`Exchange failed: ${error.message}`);
          console.error('Auth callback exchange failed:', error.message);
          // Don't redirect — show error for debugging
        } else {
          setDebugInfo('Success! Redirecting...');
          router.replace(next);
          router.refresh();
        }
      });
    } else {
      setDebugInfo('No code parameter in URL');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-welted-bg flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-welted-text-muted text-sm mt-4">Signing you in...</p>
        <p className="text-welted-text-muted text-xs mt-2 font-mono">{debugInfo}</p>
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
