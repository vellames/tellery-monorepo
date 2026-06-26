import { BookOpen, Compass, Menu, UserRound } from 'lucide-react';

export function BottomNav() {
  return (
    <>
      <nav className="border-border bg-card/90 shadow-card fixed inset-x-4 bottom-4 z-20 mx-auto grid max-w-6xl grid-cols-3 rounded-[28px] border px-3 py-3 backdrop-blur">
        <button
          className="text-primary flex items-center justify-center gap-2 rounded-2xl px-3 py-3 font-bold"
          type="button"
        >
          <BookOpen className="fill-primary/10 size-6" />
          <span className="hidden sm:inline">Histórias</span>
        </button>
        <button
          className="text-muted-foreground flex items-center justify-center gap-2 rounded-2xl px-3 py-3 font-semibold"
          type="button"
        >
          <Compass className="size-6" />
          <span className="hidden sm:inline">Minha jornada</span>
        </button>
        <button
          className="text-muted-foreground flex items-center justify-center gap-2 rounded-2xl px-3 py-3 font-semibold"
          type="button"
        >
          <UserRound className="size-6" />
          <span className="hidden sm:inline">Perfil</span>
        </button>
      </nav>

      <button
        className="border-border bg-card text-primary shadow-card fixed right-5 bottom-5 z-30 grid size-12 place-items-center rounded-full border sm:hidden"
        type="button"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>
    </>
  );
}
