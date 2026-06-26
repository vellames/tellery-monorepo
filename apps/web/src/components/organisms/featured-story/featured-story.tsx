import { ChevronRight, Clock, Search, Star } from 'lucide-react';

export function FeaturedStory() {
  return (
    <section className="shadow-card relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#37050d] via-[#160a08] to-[#6e3d15] p-7 sm:rounded-[36px] sm:p-12 lg:min-h-[520px]">
      <div className="absolute inset-y-0 right-0 hidden w-3/5 bg-[radial-gradient(circle_at_65%_30%,rgba(245,196,112,0.34),transparent_20%),radial-gradient(circle_at_82%_50%,rgba(255,249,239,0.18),transparent_16%),linear-gradient(135deg,transparent,rgba(196,154,74,0.22))] lg:block" />
      <div className="absolute right-10 bottom-8 hidden h-40 w-80 rounded-[50%] bg-black/30 blur-sm lg:block" />

      <div className="relative z-10 max-w-xl">
        <div className="border-gold/30 bg-primary/35 text-gold mb-7 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold tracking-wide uppercase sm:text-sm">
          <Star className="fill-gold size-4" />
          Comece por aqui
        </div>
        <h1 className="font-heading text-card text-5xl leading-[0.95] font-semibold sm:text-7xl">
          O Bilhete na Mesa 7
        </h1>
        <div className="text-card/80 mt-7 flex flex-wrap items-center gap-3 text-sm font-medium sm:text-base">
          <span className="inline-flex items-center gap-2">
            <Search className="size-5" /> Mistério
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-2">
            <Clock className="size-5" /> 10 min
          </span>
          <span className="text-card/40">|</span>
          <span className="text-gold font-bold">Grátis</span>
        </div>
        <p className="text-card/90 mt-7 max-w-md text-lg leading-8">
          Um bilhete anônimo aparece no fechamento de um café. Três pessoas
          ainda estavam lá. Uma delas sabe mais do que diz.
        </p>
        <button
          className="shadow-button mt-8 inline-flex w-full items-center justify-center gap-8 rounded-2xl bg-gradient-to-r from-[#f4d78f] to-[#f9e8b7] px-8 py-4 text-lg font-bold text-[#4a111b] transition hover:scale-[1.01] sm:w-auto sm:min-w-80"
          type="button"
        >
          Começar história
          <ChevronRight className="size-6" />
        </button>
      </div>
    </section>
  );
}
