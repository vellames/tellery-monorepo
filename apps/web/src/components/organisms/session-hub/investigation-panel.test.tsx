import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  InvestigationPanel,
  type InvestigationTarget,
} from '@/components/organisms/session-hub/investigation-panel';
import { renderWithProviders } from '@/test-utils';
import type {
  InteractResult,
  SessionCharacter,
  SessionLocation,
  SessionObject,
} from '@/lib/types/session';

const character: SessionCharacter = {
  id: 'char-1',
  name: 'Elisa',
  role: 'Dona do café',
  shortDescription: 'Cuidadosa com o ambiente.',
  imageUrl: null,
  conversationSummary: null,
  cluesTotal: 2,
  discoveredClues: [],
  messages: [],
};

const target: InvestigationTarget = {
  kind: 'character',
  data: character,
};

afterEach(() => vi.restoreAllMocks());

function mockFetchResponse(body: unknown, ok = true) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('InvestigationPanel', () => {
  it('sends an interaction and shows the character reply', async () => {
    const user = userEvent.setup();
    const onInteracted = vi.fn();
    const result: InteractResult = {
      id: 'char-1',
      stateType: 'character',
      reply: 'Eu vi uma sombra.',
      discoveredClues: [],
    };
    mockFetchResponse(result);

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={target}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={onInteracted}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Pergunte algo a Elisa…');
    await user.type(input, 'O que você viu?');
    await user.click(screen.getByLabelText('Enviar'));

    await waitFor(() => {
      expect(screen.getByText('Eu vi uma sombra.')).toBeInTheDocument();
    });

    expect(onInteracted).toHaveBeenCalled();
  });

  it('shows the clue discovery overlay when clues are found', async () => {
    const user = userEvent.setup();
    const onInteracted = vi.fn();
    const result: InteractResult = {
      id: 'char-1',
      stateType: 'character',
      reply: null,
      discoveredClues: [
        {
          id: 'clue-1',
          title: 'Tinta azul',
          description: 'Uma mancha de tinta azul.',
          reasoning: 'Relevant to the case.',
        },
      ],
    };
    mockFetchResponse(result);

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={target}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={onInteracted}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Pergunte algo a Elisa…');
    await user.type(input, 'Mostre suas mãos');
    await user.click(screen.getByLabelText('Enviar'));

    await waitFor(() => {
      expect(screen.getByText('Evidência descoberta')).toBeInTheDocument();
      expect(screen.getByText('Tinta azul')).toBeInTheDocument();
    });

    // onInteracted should NOT be called until "continue" is clicked
    expect(onInteracted).not.toHaveBeenCalled();

    await user.click(screen.getByText('Continuar'));

    expect(onInteracted).toHaveBeenCalled();
  });

  it('shows a no-clue feedback when no clues are discovered', async () => {
    const user = userEvent.setup();
    const result: InteractResult = {
      id: 'char-1',
      stateType: 'character',
      reply: 'Não sei de nada.',
      discoveredClues: [],
    };
    mockFetchResponse(result);

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={target}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Pergunte algo a Elisa…');
    await user.type(input, 'O que você viu?');
    await user.click(screen.getByLabelText('Enviar'));

    await waitFor(() => {
      expect(screen.getByText('Não sei de nada.')).toBeInTheDocument();
    });
  });

  it('shows an error when the request fails', async () => {
    const user = userEvent.setup();
    mockFetchResponse({ error: 'fail' }, false);

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={target}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Pergunte algo a Elisa…');
    await user.type(input, 'oi');
    await user.click(screen.getByLabelText('Enviar'));

    await waitFor(() => {
      expect(
        screen.getByText('Algo deu errado. Tente novamente.')
      ).toBeInTheDocument();
    });
  });

  it('returns null when target is null', () => {
    const { container } = renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={null}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('auto-inspects an unvisited location on open', async () => {
    const onInteracted = vi.fn();
    const location: SessionLocation = {
      id: 'loc-1',
      name: 'Mesa 7',
      shortDescription: 'Onde o bilhete foi encontrado.',
      imageUrl: null,
      initialDescription: 'perto da janela',
      visited: false,
      visitedAt: null,
      cluesTotal: 1,
      discoveredClues: [],
    };
    const result: InteractResult = {
      id: 'loc-1',
      stateType: 'location',
      reply: null,
      discoveredClues: [
        {
          id: 'clue-1',
          title: 'Bilhete rasgado',
          description: 'Um bilhete rasgado sob a mesa.',
          reasoning: 'Ambient clue.',
        },
      ],
    };
    mockFetchResponse(result);

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={{ kind: 'location', data: location }}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={onInteracted}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Bilhete rasgado')).toBeInTheDocument();
    });
  });

  it('does not auto-inspect an already visited location', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const location: SessionLocation = {
      id: 'loc-1',
      name: 'Mesa 7',
      shortDescription: 'Onde o bilhete foi encontrado.',
      imageUrl: null,
      initialDescription: 'perto da janela',
      visited: true,
      visitedAt: '2026-01-01T00:00:00.000Z',
      cluesTotal: 1,
      discoveredClues: [],
    };

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={{ kind: 'location', data: location }}
        objects={[]}
        easyMode={false}
        onSelectObject={vi.fn()}
        onInteracted={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows objects belonging to a location and calls onSelectObject on click', async () => {
    const user = userEvent.setup();
    const onSelectObject = vi.fn();
    const location: SessionLocation = {
      id: 'loc-1',
      name: 'Mesa 7',
      shortDescription: 'Onde o bilhete foi encontrado.',
      imageUrl: null,
      initialDescription: 'perto da janela',
      visited: true,
      visitedAt: '2026-01-01T00:00:00.000Z',
      cluesTotal: 0,
      discoveredClues: [],
    };
    const objectInLocation: SessionObject = {
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
    };

    renderWithProviders(
      <InvestigationPanel
        sessionId="s1"
        target={{ kind: 'location', data: location }}
        objects={[objectInLocation]}
        easyMode={false}
        onSelectObject={onSelectObject}
        onInteracted={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Objetos para inspecionar')).toBeInTheDocument();
    expect(screen.getByText('Guardanapo')).toBeInTheDocument();

    await user.click(screen.getByText('Guardanapo'));

    expect(onSelectObject).toHaveBeenCalledWith(objectInLocation);
  });
});
