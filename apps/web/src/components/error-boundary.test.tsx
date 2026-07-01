import { describe, expect, it, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

type FallbackFn = (error: Error, reset: () => void) => ReactNode;

function Thrower({ message }: { message: string }): never {
  throw new Error(message);
}

function Flaky({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('one-off');
  return <p>recovered</p>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <p>content</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders the fallback and exposes the error and reset when a child throws', () => {
    const fallback: Mock<FallbackFn> = vi.fn(() => <p>fallback</p>);

    render(
      <ErrorBoundary fallback={fallback}>
        <Thrower message="kaboom" />
      </ErrorBoundary>
    );

    expect(screen.getByText('fallback')).toBeInTheDocument();
    expect(fallback).toHaveBeenCalled();
    const [error, reset] = fallback.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('kaboom');
    expect(typeof reset).toBe('function');
  });

  it('logs the error to the console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={() => <p>fallback</p>}>
        <Thrower message="kaboom" />
      </ErrorBoundary>
    );

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('recovers and re-renders children when reset is called', () => {
    const resetRef: { current?: () => void } = {};

    const tree = (shouldThrow: boolean) => (
      <ErrorBoundary
        fallback={(_error, reset) => {
          resetRef.current = reset;
          return <p>fallback</p>;
        }}
      >
        <Flaky shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    const { rerender } = render(tree(true));
    expect(screen.getByText('fallback')).toBeInTheDocument();

    rerender(tree(false));
    act(() => {
      resetRef.current!();
    });

    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});
