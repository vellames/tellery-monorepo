'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/lib/hooks/use-auth';

export function LogoutButton() {
  const logout = useLogout();
  const t = useTranslations('common');

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      {logout.isPending && <Loader2 className="size-4 animate-spin" />}
      {t('logout')}
    </Button>
  );
}
