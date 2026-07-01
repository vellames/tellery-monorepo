'use client';

import { Loader2, LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/lib/hooks/use-auth';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types/auth';

export interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const logout = useLogout();
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('profile');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'bg-secondary text-secondary-foreground shadow-soft grid size-12 cursor-pointer place-items-center overflow-hidden rounded-full text-sm font-semibold transition hover:opacity-80 focus-visible:ring-ring/50 focus-visible:ring-3 sm:size-14'
        )}
      >
        {user.name.charAt(0).toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {user.name}
            <span className="text-muted-foreground block truncate text-xs font-normal">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(config.routes.profile)}>
            <UserRound />
            {tProfile('title')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogOut />
            )}
            {tCommon('logout')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
