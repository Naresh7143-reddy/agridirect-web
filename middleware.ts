import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_ROUTES: Record<string, string> = {
  '/buyer': 'BUYER',
  '/farmer': 'FARMER',
  '/delivery': 'DELIVERY',
  '/admin': 'ADMIN',
};

const ROLE_HOME: Record<string, string> = {
  BUYER: '/buyer',
  FARMER: '/farmer',
  DELIVERY: '/delivery',
  ADMIN: '/admin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const prefix = Object.keys(ROLE_ROUTES).find((p) => pathname.startsWith(p));
  if (!prefix) return NextResponse.next();

  const requiredRole = ROLE_ROUTES[prefix];
  const token = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value?.toUpperCase();

  const refreshToken = request.cookies.get('refresh_token')?.value;
  // If no session at all, go to login
  if (!userRole || (!token && !refreshToken)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }
  // If access token expired but refresh token exists, let the page load —
  // the client-side axios interceptor will refresh and retry automatically
  if (!token && refreshToken) return NextResponse.next();

  if (userRole !== requiredRole) {
    const home = ROLE_HOME[userRole] ?? '/login';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = home;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/buyer/:path*', '/farmer/:path*', '/delivery/:path*', '/admin/:path*'],
};
