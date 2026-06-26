import { BookOpen, MessageCircle, Search, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const stepIcons = {
  enterStory: BookOpen,
  talkToCharacters: MessageCircle,
  findTheEnd: Search,
} satisfies Record<string, LucideIcon>;

const stepKeys = Object.keys(stepIcons) as (keyof typeof stepIcons)[];

export function HowItWorks() {
  const t = useTranslations('home.howItWorks');

  return (
    <section>
      <div className="mb-7 flex items-center justify-center gap-5 text-center">
        <span className="bg-gold/50 hidden h-px w-24 sm:block" />
        <Sparkles className="fill-gold text-gold size-5" />
        <h2 className="font-heading text-primary text-4xl font-semibold">
          {t('title')}
        </h2>
        <Sparkles className="fill-gold text-gold size-5" />
        <span className="bg-gold/50 hidden h-px w-24 sm:block" />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {stepKeys.map((key, index) => {
          const Icon = stepIcons[key];

          return (
            <article
              className="border-border bg-card/60 shadow-soft rounded-[28px] border p-8 text-center"
              key={key}
            >
              <div className="bg-secondary/70 relative mx-auto mb-6 grid size-28 place-items-center rounded-full">
                <Icon className="text-primary size-14" strokeWidth={1.7} />
                <span className="bg-primary text-primary-foreground shadow-soft absolute right-1 bottom-2 grid size-8 place-items-center rounded-full text-sm font-bold">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-heading text-primary text-2xl font-semibold">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-muted-foreground mx-auto mt-3 max-w-60 leading-7">
                {t(`steps.${key}.description`)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
