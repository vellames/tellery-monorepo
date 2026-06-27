import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { config } from '@/lib/config';

export default async function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect(config.routes.login);

  return (
    <main className="min-h-svh bg-gradient-to-b from-[#2a0a10] via-[#1b070b] to-[#120406] text-[#fff9ef]">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}
