'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/lib/hooks/use-auth';

export function LogoutButton() {
  const logout = useLogout();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      {logout.isPending && <Loader2 className="animate-spin" />}
      Sair
    </Button>
  );
}
