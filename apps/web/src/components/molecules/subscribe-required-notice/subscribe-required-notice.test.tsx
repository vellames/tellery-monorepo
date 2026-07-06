import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { SubscribeRequiredNotice } from '@/components/molecules/subscribe-required-notice/subscribe-required-notice';
import { renderWithProviders } from '@/test-utils';

describe('SubscribeRequiredNotice', () => {
  it('renders a disabled start button', () => {
    renderWithProviders(<SubscribeRequiredNotice />);

    expect(
      screen.getByRole('button', { name: /iniciar história/i })
    ).toBeDisabled();
  });

  it('renders the premium required message', () => {
    renderWithProviders(<SubscribeRequiredNotice />);

    expect(
      screen.getByText(/esta é uma história premium/i)
    ).toBeInTheDocument();
  });

  it('does not render a subscribe link', () => {
    renderWithProviders(<SubscribeRequiredNotice />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
