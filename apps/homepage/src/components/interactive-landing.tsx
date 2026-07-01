'use client';

import type { PointerEvent } from 'react';

type NavCopy = {
  how: string;
  experience: string;
  premium: string;
  cta: string;
};

type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  badge: string;
  caseLabel: string;
  caseTitle: string;
  caseMeta: string;
  caseClue: string;
  caseClueTitle: string;
  caseQuestion: string;
  caseProgress: string;
};

type StatCopy = {
  value: string;
  label: string;
};

type StepCopy = {
  number: string;
  title: string;
  description: string;
};

type FeatureCopy = {
  title: string;
  description: string;
};

export type LandingCopy = {
  nav: NavCopy;
  hero: HeroCopy;
  stats: StatCopy[];
  how: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: StepCopy[];
  };
  experience: {
    eyebrow: string;
    title: string;
    subtitle: string;
    boardLabel: string;
    features: FeatureCopy[];
  };
  premium: {
    eyebrow: string;
    title: string;
    subtitle: string;
    benefits: string[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  footer: {
    tagline: string;
  };
};

type InteractiveLandingProps = {
  copy: LandingCopy;
};

export function InteractiveLanding({ copy }: InteractiveLandingProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const shell = event.currentTarget;
    const rect = shell.getBoundingClientRect();
    shell.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    shell.style.setProperty('--cursor-y', `${event.clientY}px`);
  }

  return (
    <div className="landing-shell" onPointerMove={handlePointerMove}>
      <header className="site-header" aria-label="Tellery">
        <a className="brand" href="#top" aria-label="Tellery home">
          <span className="brand-mark">T</span>
          <span>Tellery</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#how">{copy.nav.how}</a>
          <a href="#experience">{copy.nav.experience}</a>
          <a href="#premium">{copy.nav.premium}</a>
        </nav>
        <a className="header-cta" href="#start">
          {copy.nav.cta}
        </a>
      </header>

      <main id="top">
        <section className="hero-section section-frame">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
            <p className="hero-subtitle">{copy.hero.subtitle}</p>
            <div className="hero-actions">
              <a className="primary-button magnetic-button" href="#start">
                {copy.hero.primaryCta}
              </a>
              <a className="secondary-button" href="#how">
                {copy.hero.secondaryCta}
              </a>
            </div>
            <p className="hero-badge">{copy.hero.badge}</p>
          </div>

          <div className="hero-stage" aria-label={copy.hero.caseTitle}>
            <div className="stage-orbit orbit-one" />
            <div className="stage-orbit orbit-two" />
            <article className="case-file-card glass-card">
              <div className="case-file-topline">
                <span>{copy.hero.caseLabel}</span>
                <span className="live-dot" />
              </div>
              <h2>{copy.hero.caseTitle}</h2>
              <p>{copy.hero.caseMeta}</p>
              <div className="case-progress" aria-hidden="true">
                <span />
              </div>
              <small>{copy.hero.caseProgress}</small>
            </article>

            <article className="floating-card clue-card">
              <span>{copy.hero.caseClue}</span>
              <strong>{copy.hero.caseClueTitle}</strong>
            </article>

            <article className="floating-card question-card">
              <span className="question-cursor" />
              <p>{copy.hero.caseQuestion}</p>
            </article>

            <div className="suspect-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <section
          className="stats-strip section-frame"
          aria-label="Tellery facts"
        >
          {copy.stats.map((stat) => (
            <div className="stat-item" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="how-section section-frame" id="how">
          <div className="section-heading centered-heading">
            <p className="eyebrow">{copy.how.eyebrow}</p>
            <h2>{copy.how.title}</h2>
            <p>{copy.how.subtitle}</p>
          </div>
          <div className="step-grid">
            {copy.how.steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="experience-section" id="experience">
          <div className="experience-inner section-frame">
            <div className="section-heading">
              <p className="eyebrow">{copy.experience.eyebrow}</p>
              <h2>{copy.experience.title}</h2>
              <p>{copy.experience.subtitle}</p>
            </div>

            <div className="experience-grid">
              <div className="investigation-board glass-card">
                <div className="board-header">
                  <span>{copy.experience.boardLabel}</span>
                  <strong>68%</strong>
                </div>
                <div className="board-map">
                  <span className="node node-large" />
                  <span className="node node-gold" />
                  <span className="node node-rose" />
                  <span className="node node-small" />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="feature-list">
                {copy.experience.features.map((feature, index) => (
                  <article className="feature-card" key={feature.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="premium-section section-frame" id="premium">
          <div className="premium-card">
            <div>
              <p className="eyebrow">{copy.premium.eyebrow}</p>
              <h2>{copy.premium.title}</h2>
              <p>{copy.premium.subtitle}</p>
            </div>
            <ul>
              {copy.premium.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="final-cta section-frame" id="start">
          <p className="eyebrow">{copy.finalCta.eyebrow}</p>
          <h2>{copy.finalCta.title}</h2>
          <p>{copy.finalCta.subtitle}</p>
          <a className="primary-button magnetic-button" href="#top">
            {copy.finalCta.cta}
          </a>
        </section>
      </main>

      <footer className="site-footer section-frame">
        <span>Tellery</span>
        <p>{copy.footer.tagline}</p>
      </footer>
    </div>
  );
}
