// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  'https://370fedd6fd2ac7717585e0d27a0c84fa@o1243734.ingest.us.sentry.io/4511677440983040';
const DEFAULT_TRACES_SAMPLE_RATE = 0.1;
const DEFAULT_REPLAY_SESSION_SAMPLE_RATE = 0.5;
const ERROR_REPLAY_SAMPLE_RATE = 1.0;

// Disable Sentry while running locally so dev-only noise never reaches the
// project. An undefined DSN tells the SDK to stay initialized but not to send
// any events.
const IS_LOCAL_DEVELOPMENT = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: IS_LOCAL_DEVELOPMENT ? undefined : SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,

  integrations: [
    // Session Replay. Tellery is a mystery game built on text + images, so we
    // keep media and text *visible* to make replays useful for debugging
    // gameplay/investigation. Inputs (forms, auth, chat) stay masked to avoid
    // leaking PII. Masking can still be tightened per-element via the `mask`
    // selector list if a sensitive surface shows up.
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,

      // Aggressive flush cadence so replays survive hostile environments —
      // especially in-app browsers (Facebook/Instagram) where the webview is
      // suspended or killed before the default 60s flush window. Shorter
      // windows mean more, smaller segments but far less data loss.
      flushMinDelay: 1_000,
      flushMaxDelay: 5_000,

      // Ad/webview sessions are often very short (median ~10s). The default
      // minReplayDuration was dropping those before they were ever sent.
      minReplayDuration: 1_000,
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: getSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    DEFAULT_TRACES_SAMPLE_RATE
  ),
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: getSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
    DEFAULT_REPLAY_SESSION_SAMPLE_RATE
  ),

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: ERROR_REPLAY_SAMPLE_RATE,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

function getSampleRate(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;

  return parsed;
}
