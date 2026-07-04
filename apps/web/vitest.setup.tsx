import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

// jsdom does not implement Element.prototype.scrollIntoView
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: unknown }> & Record<string, unknown>) => (
    <a href={typeof href === 'string' ? href : ''} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureRequestError: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
  flush: vi.fn(),
  init: vi.fn(),
  logger: { info: vi.fn() },
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  setContext: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  startSpan: vi.fn((_options, callback) => callback()),
  withSentryConfig: vi.fn((config) => config),
}));
