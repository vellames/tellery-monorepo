import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/organisms';
import { getSessionUser } from '@/lib/auth/session';
import { config } from '@/lib/config';

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect(config.routes.login);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <LogoutButton />
    </main>
  );
}
