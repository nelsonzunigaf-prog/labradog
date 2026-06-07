'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function CerrarSesion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function onClick() {
    setCargando(true);
    await authClient.signOut();
    router.replace('/login');
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={cargando}>
      {cargando ? 'Saliendo…' : 'Cerrar sesión'}
    </Button>
  );
}
