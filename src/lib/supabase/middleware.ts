import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Handle auth code exchange — Supabase may redirect here with a `code` param
  // on any URL (not just /auth/callback) depending on the redirect_to config
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the intended page (or /reset-password for recovery, / for verification)
      const redirectPath = next || '/';
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = redirectPath;
      redirectUrl.searchParams.delete('code');
      redirectUrl.searchParams.delete('next');
      const redirect = NextResponse.redirect(redirectUrl);
      // Copy auth cookies to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      });
      return redirect;
    } else {
      // Code exchange failed — redirect to login with error
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.delete('code');
      loginUrl.searchParams.delete('next');
      loginUrl.searchParams.set('error', 'auth_callback_failed');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Refresh session — important for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except public routes)
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/brands', '/bst'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isPublicProfile = request.nextUrl.pathname.startsWith('/user/');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
  const isPublicBSTDetail = /^\/bst\/[^/]+$/.test(request.nextUrl.pathname) && !request.nextUrl.pathname.endsWith('/edit');

  if (!user && !isPublicRoute && !isPublicProfile && !isAuthCallback && !isPublicBSTDetail) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
