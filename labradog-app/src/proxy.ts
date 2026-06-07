/**
 * Proxy (ex-`middleware.ts`, renombrado en Next.js 16) — protección OPTIMISTA
 * de las áreas por rol.
 *
 * Solo verifica la PRESENCIA de la cookie de sesión (chequeo barato, sin BD):
 * si falta en `/admin/*` o `/paseador/*`, redirige a `/login`. La verificación
 * REAL de rol y estado vive en los layouts de servidor (admin/layout.tsx,
 * paseador/layout.tsx) vía `getActor()`.
 *
 * Por qué optimista: el proxy puede ejecutarse en el borde/CDN y no debe
 * depender de la BD ni de módulos pesados (ver docs de Next 16). `getSessionCookie`
 * de Better Auth lee la cookie respetando su nombre y el prefijo `__Secure-`.
 */
import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const sesion = getSessionCookie(request);

  if (!sesion) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirigir', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/paseador/:path*'],
};
