import { buildSessionStateResponse } from '../session-state.mapper';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';

const buildSession = (
  overrides: Partial<HistorySessionWithRelations> = {}
): HistorySessionWithRelations =>
  ({
    id: 'session-1',
    userId: 'user-1',
    historyId: 'history-1',
    status: 'active',
    startedAt: new Date('2026-01-01'),
    completedAt: null,
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    opening: 'opening',
    objective: 'objective',
    genre: 'mystery',
    coverImageUrl: null,
    thumbnailUrl: null,
    clues: [],
    intents: [],
    characterStates: [],
    objectStates: [],
    locationStates: [],
    ...overrides,
  }) as unknown as HistorySessionWithRelations;

describe('buildSessionStateResponse', () => {
  it('maps the session root and history snapshot', () => {
    const result = buildSessionStateResponse(buildSession());

    expect(result.id).toBe('session-1');
    expect(result.status).toBe('active');
    expect(result.history).toEqual({
      id: 'history-1',
      title: 'O Bilhete na Mesa 7',
      subtitle: null,
      teaser: 'teaser',
      opening: 'opening',
      objective: 'objective',
      genre: 'mystery',
      coverImageUrl: null,
      thumbnailUrl: null,
    });
  });

  it('includes only discovered clues', () => {
    const session = buildSession({
      clues: [
        {
          id: 'clue-1',
          title: 'Tinta azul',
          description: 'desc',
          importance: 'relevant',
          discovered: true,
          discoveredAt: new Date('2026-01-02'),
        },
        {
          id: 'clue-2',
          title: 'Segredo',
          description: 'nao deve aparecer',
          importance: 'crucial',
          discovered: false,
          discoveredAt: null,
        },
      ] as never,
    });

    const result = buildSessionStateResponse(session);

    expect(result.clues).toHaveLength(1);
    expect(result.clues[0].id).toBe('clue-1');
  });

  it('maps characters without leaking GM-only data', () => {
    const session = buildSession({
      characterStates: [
        {
          id: 'char-1',
          name: 'Rafa',
          role: 'garçom',
          shortDescription: 'nervoso',
          imageUrl: null,
          conversationSummary: 'resumo',
          personality: 'GM-ONLY',
          privateKnowledge: ['GM-ONLY'],
          clueRevealRules: [
            {
              clueId: 'clue-a',
              clue: {
                id: 'clue-a',
                title: 'A',
                description: 'a',
                importance: 'low',
                discovered: true,
                discoveredAt: null,
              },
              triggerIntents: [{ id: 'intent-gm' }],
            },
            {
              clueId: 'clue-b',
              clue: {
                id: 'clue-b',
                title: 'B',
                description: 'b',
                importance: 'low',
                discovered: false,
                discoveredAt: null,
              },
              triggerIntents: [{ id: 'intent-gm' }],
            },
          ],
          secrets: [
            {
              truth: 'GM-SECRET',
              revealStages: [
                {
                  level: 1,
                  behavior: 'GM-ONLY',
                  revealsClues: [
                    {
                      id: 'clue-c',
                      title: 'C',
                      description: 'c',
                      importance: 'low',
                      discovered: false,
                      discoveredAt: null,
                    },
                    {
                      id: 'clue-d',
                      title: 'D',
                      description: 'd',
                      importance: 'low',
                      discovered: true,
                      discoveredAt: null,
                    },
                  ],
                },
              ],
            },
          ],
          messages: [
            { role: 'user', content: 'oi', createdAt: new Date('2026-01-01') },
            {
              role: 'character',
              content: 'olá',
              createdAt: new Date('2026-01-01'),
            },
          ],
        },
      ] as never,
    });

    const result = buildSessionStateResponse(session);
    const character = result.characters[0];

    expect(character).toEqual({
      id: 'char-1',
      name: 'Rafa',
      role: 'garçom',
      shortDescription: 'nervoso',
      imageUrl: null,
      conversationSummary: 'resumo',
      cluesTotal: 4,
      discoveredClues: [
        {
          id: 'clue-a',
          title: 'A',
          description: 'a',
          importance: 'low',
          discoveredAt: null,
        },
        {
          id: 'clue-d',
          title: 'D',
          description: 'd',
          importance: 'low',
          discoveredAt: null,
        },
      ],
      messages: [
        { role: 'user', content: 'oi', createdAt: new Date('2026-01-01') },
        {
          role: 'character',
          content: 'olá',
          createdAt: new Date('2026-01-01'),
        },
      ],
    });
    expect(JSON.stringify(character)).not.toContain('GM-ONLY');
    expect(JSON.stringify(character)).not.toContain('GM-SECRET');
    expect(JSON.stringify(character)).not.toContain('intent-gm');
  });

  it('maps objects without leaking reveal rules', () => {
    const session = buildSession({
      objectStates: [
        {
          id: 'obj-1',
          name: 'Bilhete',
          shortDescription: 'papel',
          imageUrl: null,
          initialDescription: 'dobrado',
          inspected: true,
          inspectedAt: new Date('2026-01-02'),
          clueRevealRules: [
            {
              clueId: 'clue-a',
              clue: {
                id: 'clue-a',
                title: 'A',
                description: 'a',
                importance: 'low',
                discovered: true,
                discoveredAt: null,
              },
              revealText: 'GM-ONLY-TEXT',
            },
          ],
          messages: [],
        },
      ] as never,
    });

    const result = buildSessionStateResponse(session);
    const object = result.objects[0];

    expect(object).toEqual({
      id: 'obj-1',
      name: 'Bilhete',
      shortDescription: 'papel',
      imageUrl: null,
      initialDescription: 'dobrado',
      inspected: true,
      inspectedAt: new Date('2026-01-02'),
      cluesTotal: 1,
      discoveredClues: [
        {
          id: 'clue-a',
          title: 'A',
          description: 'a',
          importance: 'low',
          discoveredAt: null,
        },
      ],
      messages: [],
    });
    expect(JSON.stringify(object)).not.toContain('GM-ONLY-TEXT');
  });

  it('maps locations with their visited state', () => {
    const session = buildSession({
      locationStates: [
        {
          id: 'loc-1',
          name: 'Mesa 7',
          shortDescription: 'mesa',
          imageUrl: null,
          initialDescription: 'perto da janela',
          visited: true,
          visitedAt: new Date('2026-01-02'),
          ambientClues: [
            {
              id: 'clue-a',
              title: 'A',
              description: 'a',
              importance: 'low',
              discovered: true,
              discoveredAt: null,
            },
            {
              id: 'clue-b',
              title: 'B',
              description: 'b',
              importance: 'low',
              discovered: false,
              discoveredAt: null,
            },
          ],
        },
      ] as never,
    });

    const result = buildSessionStateResponse(session);

    expect(result.locations[0]).toEqual({
      id: 'loc-1',
      name: 'Mesa 7',
      shortDescription: 'mesa',
      imageUrl: null,
      initialDescription: 'perto da janela',
      visited: true,
      visitedAt: new Date('2026-01-02'),
      cluesTotal: 2,
      discoveredClues: [
        {
          id: 'clue-a',
          title: 'A',
          description: 'a',
          importance: 'low',
          discoveredAt: null,
        },
      ],
    });
  });
});
