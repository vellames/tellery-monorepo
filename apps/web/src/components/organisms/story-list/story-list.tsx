import { ChevronRight, Clock, Lock, MapPin } from 'lucide-react';

interface Story {
  title: string;
  category: string;
  duration: string;
  gradient: string;
}

const stories: Story[] = [
  {
    title: 'O Último Quarto',
    category: 'Mistério',
    duration: '15 min',
    gradient: 'from-stone-900 via-stone-700 to-zinc-500',
  },
  {
    title: 'A Carta Sem Remetente',
    category: 'Suspense',
    duration: '10 min',
    gradient: 'from-neutral-800 via-stone-600 to-amber-200',
  },
  {
    title: 'O Jantar dos Segredos',
    category: 'Drama investigativo',
    duration: '20 min',
    gradient: 'from-zinc-900 via-stone-700 to-orange-300',
  },
];

export function StoryList() {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-heading text-primary text-3xl font-semibold sm:text-4xl">
          Próximas histórias
        </h2>
        <button
          className="text-muted-foreground inline-flex items-center gap-2 font-semibold"
          type="button"
        >
          Ver todas
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((story) => (
          <article
            className={`relative min-h-72 overflow-hidden rounded-2xl bg-gradient-to-br ${story.gradient} shadow-card p-6`}
            key={story.title}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="relative z-10 flex h-full min-h-60 flex-col justify-between">
              <span className="border-gold/40 inline-flex w-fit items-center gap-2 rounded-lg border bg-black/30 px-3 py-2 text-xs font-bold text-[#f4d78f] uppercase">
                <Lock className="size-4" /> Premium
              </span>
              <div>
                <h3 className="font-heading text-card text-3xl leading-tight font-semibold">
                  {story.title}
                </h3>
                <div className="text-card/80 mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-4" /> {story.category}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" /> {story.duration}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
