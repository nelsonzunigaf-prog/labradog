/**
 * Layout del área paseador — verificación REAL de rol (servidor).
 * El proxy ya hizo el filtro optimista por cookie; aquí confirmamos sesión,
 * rol y estado contra la BD vía getActor().
 */
import { redirect } from 'next/navigation';
import { getActor } from '@/lib/actor';

export default async function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();

  if (!actor) {
    redirect('/login');
  }
  if (actor.rol !== 'paseador') {
    redirect('/admin');
  }

  return <>{children}</>;
}
