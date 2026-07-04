'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { PointerEvent } from 'react';

/**
 * Forwards the current URL's query params to an outbound web-app URL so that
 * attribution/marketing params (e.g. utm_*) are preserved across the jump from
 * the homepage to the app.
 */
function withForwardedParams(base: string, params: URLSearchParams): string {
  const query = params.toString();
  if (query.length === 0) return base;
  return `${base}?${query}`;
}

type NavCopy = {
  how: string;
  experience: string;
  premium: string;
  createAccount: string;
  signIn: string;
};

type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
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
    copyright: string;
    privacy: string;
    terms: string;
  };
};

type InteractiveLandingProps = {
  copy: LandingCopy;
};

const REGISTER_URL = 'https://app.tellery.ai/register';
const SIGN_IN_URL = 'https://app.tellery.ai';
const PRIVACY_URL = 'https://app.tellery.ai/privacy';
const TERMS_URL = 'https://app.tellery.ai/terms';

export function InteractiveLanding({ copy }: InteractiveLandingProps) {
  const searchParams = useSearchParams();
  const registerUrl = useMemo(
    () =>
      withForwardedParams(
        REGISTER_URL,
        new URLSearchParams(searchParams ?? '')
      ),
    [searchParams]
  );
  const signInUrl = useMemo(
    () =>
      withForwardedParams(SIGN_IN_URL, new URLSearchParams(searchParams ?? '')),
    [searchParams]
  );
  const privacyUrl = useMemo(
    () =>
      withForwardedParams(PRIVACY_URL, new URLSearchParams(searchParams ?? '')),
    [searchParams]
  );
  const termsUrl = useMemo(
    () =>
      withForwardedParams(TERMS_URL, new URLSearchParams(searchParams ?? '')),
    [searchParams]
  );

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
          <Image
            className="brand-logo"
            src="/logo.png"
            alt="Tellery"
            width={178}
            height={72}
            priority
          />
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#how">{copy.nav.how}</a>
          <a href="#experience">{copy.nav.experience}</a>
          <a href="#premium">{copy.nav.premium}</a>
        </nav>
        <div className="header-actions">
          <a className="header-sign-in" href={signInUrl}>
            {copy.nav.signIn}
          </a>
          <a className="header-cta" href={registerUrl}>
            {copy.nav.createAccount}
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero-section section-frame">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
            <p className="hero-subtitle">{copy.hero.subtitle}</p>
            <div className="hero-actions">
              <a className="primary-button magnetic-button" href={registerUrl}>
                {copy.hero.primaryCta}
              </a>
              <a className="secondary-button" href="#how">
                {copy.hero.secondaryCta}
              </a>
            </div>
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
          <a className="primary-button magnetic-button" href={registerUrl}>
            {copy.finalCta.cta}
          </a>
        </section>
      </main>

      <footer className="site-footer section-frame">
        <div>
          <span>Tellery</span>
          <p>{copy.footer.tagline}</p>
        </div>
        <div className="footer-meta">
          <p>
            © {new Date().getFullYear()} Tellery. {copy.footer.copyright}
          </p>
          <nav aria-label="Legal links">
            <a href={privacyUrl} target="_blank" rel="noreferrer">
              {copy.footer.privacy}
            </a>
            <a href={termsUrl} target="_blank" rel="noreferrer">
              {copy.footer.terms}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
