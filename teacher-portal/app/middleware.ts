import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next();
  
  // Get the session from the cookie
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is not signed in and the current path is not /login, redirect to /login
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is signed in and the current path is /login, redirect to /teacher/dashboard
  if (session && req.nextUrl.pathname === '/login') {
    const dashboardUrl = new URL('/teacher/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
