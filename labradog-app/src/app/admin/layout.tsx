/**
 * Layout del área admin — verificación REAL de rol (servidor).
 * El proxy ya hizo el filtro optimista por cookie; aquí confirmamos sesión,
 * rol y estado contra la BD vía getActor().
 */
import { redirect } from 'next/navigation';
import { NavAdmin } from '@/components/shell/nav-admin';
import { getActor } from '@/lib/actor';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();

  if (!actor) {
    redirect('/login');
  }
  if (actor.rol !== 'admin') {
    redirect('/paseador');
  }

  // App shell del admin (EXPERIENCE.md): header con nav horizontal persistente,
  // contenido max-w-6xl con gutter desktop.
  return (
    <div className="flex flex-1 flex-col">
      <NavAdmin />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</div>
    </div>
  );
}
