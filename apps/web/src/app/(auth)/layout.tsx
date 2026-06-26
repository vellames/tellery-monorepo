import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col lg:grid lg:grid-cols-2">
      <div className="relative h-44 shrink-0 lg:hidden">
        <Image
          src="/auth-cover.jpg"
          alt="Tellery"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative hidden bg-[linear-gradient(135deg,var(--primary)_0%,#3a1018_100%)] lg:block">
        <Image
          src="/auth-cover.jpg"
          alt="Tellery"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="bg-background flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo.png"
              alt="Tellery"
              width={140}
              height={56}
              priority
              className="dark:invert"
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
