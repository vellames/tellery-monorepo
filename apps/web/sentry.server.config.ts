// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ??
  'https://370fedd6fd2ac7717585e0d27a0c84fa@o1243734.ingest.us.sentry.io/4511677440983040';
const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: getSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    DEFAULT_TRACES_SAMPLE_RATE
  ),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

function getSampleRate(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;

  return parsed;
}
