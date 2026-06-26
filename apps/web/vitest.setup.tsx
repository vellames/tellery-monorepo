import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

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
