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

  // If there's an auth code in the URL, let it pass through to the client-side handler
  // (AuthCodeHandler component exchanges the code in the browser where PKCE code_verifier lives)
  const hasAuthCode = request.nextUrl.searchParams.has('code');
  if (hasAuthCode) {
    return supabaseResponse;
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

  // Server-side admin route protection — verify moderator status from database
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_moderator')
      .eq('id', user.id)
      .single();

    if (!profile?.is_moderator) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
