export default function AdLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="text-foreground min-h-svh bg-[radial-gradient(circle_at_top_left,#fff9ef_0,#f7f1e7_38%,#f1e5d4_100%)] pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
