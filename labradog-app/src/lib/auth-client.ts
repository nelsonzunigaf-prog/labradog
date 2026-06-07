/**
 * Cliente de Better Auth para componentes de cliente ('use client').
 * Expone signIn, signOut, requestPasswordReset, resetPassword, getSession, etc.
 *
 * Server-side NO usa esto: las Server Components/Actions leen la sesión con
 * `auth.api.getSession` (ver src/lib/actor.ts).
 */
import { createAuthClient } from 'better-auth/react';

// Sin baseURL: el cliente usa el origen actual del navegador (mismo dominio que
// la app), así no dependemos de otra variable de entorno pública.
export const authClient = createAuthClient();

export const { signIn, signOut, requestPasswordReset, resetPassword, useSession } = authClient;
