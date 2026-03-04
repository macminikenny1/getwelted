'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side handler for Supabase auth codes (magic links, password recovery).
 * Detects ?code= in the URL and exchanges it for a session on the client,
 * where the PKCE code_verifier is available.
 */
export default function AuthCodeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    // Validate redirect target to prevent open redirect attacks
    const rawNext = searchParams.get('next') || '/';
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/';

    const exchangeCode = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace('/login?error=auth_callback_failed');
      } else {
        router.replace(next);
        router.refresh();
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  return null;
}
