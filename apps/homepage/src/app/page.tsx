import { getTranslations } from 'next-intl/server';
import {
  InteractiveLanding,
  type LandingCopy,
} from '@/components/interactive-landing';

const howStepKeys = ['enter', 'investigate', 'solve'] as const;
const experienceFeatureKeys = ['characters', 'scenes', 'endings'] as const;
const premiumBenefitKeys = [
  'credits',
  'premiumStories',
  'differentEndings',
  'cancel',
] as const;

export default async function HomePage() {
  const t = await getTranslations('home');
  const copy: LandingCopy = {
    nav: {
      how: t('nav.how'),
      experience: t('nav.experience'),
      premium: t('nav.premium'),
      cta: t('nav.cta'),
    },
    hero: {
      eyebrow: t('hero.eyebrow'),
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      primaryCta: t('hero.primaryCta'),
      secondaryCta: t('hero.secondaryCta'),
      badge: t('hero.badge'),
      caseLabel: t('hero.caseLabel'),
      caseTitle: t('hero.caseTitle'),
      caseMeta: t('hero.caseMeta'),
      caseClue: t('hero.caseClue'),
      caseClueTitle: t('hero.caseClueTitle'),
      caseQuestion: t('hero.caseQuestion'),
      caseProgress: t('hero.caseProgress'),
    },
    stats: [
      { value: '12+', label: t('stats.stories') },
      { value: '∞', label: t('stats.paths') },
      { value: '1', label: t('stats.ending') },
    ],
    how: {
      eyebrow: t('how.eyebrow'),
      title: t('how.title'),
      subtitle: t('how.subtitle'),
      steps: howStepKeys.map((key, index) => ({
        number: String(index + 1).padStart(2, '0'),
        title: t(`how.${key}.title`),
        description: t(`how.${key}.description`),
      })),
    },
    experience: {
      eyebrow: t('experience.eyebrow'),
      title: t('experience.title'),
      subtitle: t('experience.subtitle'),
      boardLabel: t('experience.boardLabel'),
      features: experienceFeatureKeys.map((key) => ({
        title: t(`experience.${key}.title`),
        description: t(`experience.${key}.description`),
      })),
    },
    premium: {
      eyebrow: t('premium.eyebrow'),
      title: t('premium.title'),
      subtitle: t('premium.subtitle'),
      benefits: premiumBenefitKeys.map((key) => t(`premium.${key}`)),
    },
    finalCta: {
      eyebrow: t('finalCta.eyebrow'),
      title: t('finalCta.title'),
      subtitle: t('finalCta.subtitle'),
      cta: t('finalCta.cta'),
    },
    footer: {
      tagline: t('footer.tagline'),
    },
  };

  return <InteractiveLanding copy={copy} />;
}
