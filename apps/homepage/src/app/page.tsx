import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main
      style={{
        display: 'grid',
        minHeight: '100vh',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(48px, 12vw, 128px)',
          lineHeight: 1,
          letterSpacing: '-0.08em',
        }}
      >
        {t('title')}
      </h1>
    </main>
  );
}
