/**
 * Endpoint catch-all de Better Auth: monta todas las rutas de auth
 * (/api/auth/sign-in, /sign-out, /request-password-reset, /reset-password, ...).
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

export const { GET, POST } = toNextJsHandler(auth);
