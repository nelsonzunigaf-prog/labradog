/**
 * Layout del área paseador — verificación REAL de rol (servidor).
 * El proxy ya hizo el filtro optimista por cookie; aquí confirmamos sesión,
 * rol y estado contra la BD vía getActor().
 */
import { redirect } from 'next/navigation';
import { BottomNavPaseador } from '@/components/shell/bottom-nav-paseador';
import { getActor } from '@/lib/actor';

export default async function PaseadorLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();

  if (!actor) {
    redirect('/login');
  }
  if (actor.rol !== 'paseador') {
    redirect('/admin');
  }

  // App shell del paseador (EXPERIENCE.md): contenido centrado max-w-md en ≥md,
  // padding inferior para la bottom-nav fija.
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-20">
      {children}
      <BottomNavPaseador />
    </div>
  );
}
