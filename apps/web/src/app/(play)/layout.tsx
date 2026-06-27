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
    <main className="relative min-h-svh overflow-hidden bg-gradient-to-b from-[#2a0a10] via-[#1b070b] to-[#120406] text-[#fff9ef]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,249,239,0.6)_1px,transparent_0)] [background-size:32px_32px] opacity-[0.07]"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}
