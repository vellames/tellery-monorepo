import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LocationObjectList } from '@/components/organisms/session-hub/components/location-object-list';
import { renderWithProviders } from '@/test-utils';
import type { SessionObject } from '@/lib/types/session';

const objects: SessionObject[] = [
  {
    id: 'obj-1',
    name: 'Guardanapo',
    shortDescription: 'Um guardanapo amassado.',
    imageUrl: null,
    initialDescription: 'Está sobre a mesa.',
    locationId: 'loc-1',
    inspected: false,
    inspectedAt: null,
    cluesTotal: 1,
    discoveredClues: [],
    messages: [],
  },
];

describe('LocationObjectList', () => {
  it('renders objects with name', () => {
    renderWithProviders(
      <LocationObjectList
        objects={objects}
        assistedMode={false}
        onSelectObject={vi.fn()}
      />
    );

    expect(screen.getByText('Guardanapo')).toBeInTheDocument();
  });

  it('calls onSelectObject when an object is clicked', async () => {
    const user = userEvent.setup();
    const onSelectObject = vi.fn();
    renderWithProviders(
      <LocationObjectList
        objects={objects}
        assistedMode={false}
        onSelectObject={onSelectObject}
      />
    );

    await user.click(screen.getByText('Guardanapo'));

    expect(onSelectObject).toHaveBeenCalledWith(objects[0]);
  });

  it('shows the empty message when there are no objects', () => {
    renderWithProviders(
      <LocationObjectList
        objects={[]}
        assistedMode={false}
        onSelectObject={vi.fn()}
      />
    );

    expect(
      screen.getByText('Não há mais nada para inspecionar aqui.')
    ).toBeInTheDocument();
  });
});
