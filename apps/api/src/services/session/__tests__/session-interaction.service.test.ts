import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { StatusCodes } from 'http-status-codes';
import { CharacterAgent } from '../../../engine/character/character-agent.service';
import { IntentDetectionService } from '../../../engine/intent/intent-detection.service';
import { ObjectAgent } from '../../../engine/object/object-agent.service';
import { SessionInteractionService } from '../session-interaction.service';
import { ISessionRepository } from '../../../interfaces';
import type { HistorySessionWithRelations } from '../../../repositories/SessionRepository';

jest.mock('@ai-history/i18n', () => ({
  ...jest.requireActual('@ai-history/i18n'),
  t: jest.fn(
    (_lang: string, key: string, _params?: Record<string, string>, ns?: string) =>
      ns ? `${ns}:${key}` : key
  ),
}));

describe('SessionInteractionService', () => {
  let sessions: DeepMockProxy<ISessionRepository>;
  let intentDetection: DeepMockProxy<IntentDetectionService>;
  let objectAgent: DeepMockProxy<ObjectAgent>;
  let characterAgent: DeepMockProxy<CharacterAgent>;
  let service: SessionInteractionService;

  const ownerId = 'user-owner';
  const intruderId = 'user-intruder';
  const sessionId = 'session-1';
  const language = 'pt-BR' as SupportedLanguage;

  const intent = {
    id: 'intent-1',
    description: 'accuse',
    examples: ['you did it'],
    keywords: ['accuse'],
  };

  const buildSession = (
    overrides: Partial<HistorySessionWithRelations> = {}
  ): HistorySessionWithRelations =>
    ({
      id: sessionId,
      userId: ownerId,
      intents: [intent],
      clues: [],
      characterStates: [],
      objectStates: [],
      locationStates: [],
      conclusionFields: [],
      endingSnapshots: [],
      conclusion: null,
      ending: null,
      ...overrides,
    }) as unknown as HistorySessionWithRelations;

  beforeEach(() => {
    sessions = mockDeep<ISessionRepository>();
    intentDetection = mockDeep<IntentDetectionService>();
    objectAgent = mockDeep<ObjectAgent>();
    characterAgent = mockDeep<CharacterAgent>();
    objectAgent.run.mockResolvedValue([]);
    characterAgent.run.mockResolvedValue({
      reply: 'reply',
      discoveredClues: [],
      updatedConversationSummary: 'resumo',
      updatedSecretStates: [],
    });
    service = new SessionInteractionService(
      sessions,
      intentDetection,
      objectAgent,
      characterAgent
    );
  });

  afterEach(() => {
    mockReset(sessions);
    mockReset(intentDetection);
    mockReset(objectAgent);
    mockReset(characterAgent);
  });

  const input = { stateId: 'state-1', interaction: 'hello' };

  describe('session resolution', () => {
    it('throws 404 when the session does not exist', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        service.interact(sessionId, ownerId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSession',
      });
    });

    it('throws 403 when the session belongs to another user', async () => {
      sessions.findById.mockResolvedValue(buildSession({ userId: ownerId }));

      await expect(
        service.interact(sessionId, intruderId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.FORBIDDEN,
        messageKey: 'session:errors.sessionNotOwned',
      });
    });

    it('throws 404 when the state does not exist in the session', async () => {
      sessions.findById.mockResolvedValue(buildSession());

      await expect(
        service.interact(sessionId, ownerId, input, language)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        messageKey: 'session:errors.unknownSessionState',
      });
    });
  });

  describe('intent detection', () => {
    const detected = [
      { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
    ];

    it('detects intents for a character state', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          characterStates: [
            {
              id: input.stateId,
              name: 'Rafa',
              role: 'garçom',
              shortDescription: 'nervoso',
              personality: 'ansioso',
              speakingStyle: 'direto',
              publicKnowledge: [],
              privateKnowledge: [],
              openingLine: 'oi',
              conversationBoundaries: [],
              conversationSummary: null,
              clueRevealRules: [],
              secrets: [],
              revealedClues: [],
              messages: [],
            },
          ] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(result.stateType).toBe('character');
      expect(result.detectedIntents).toEqual(detected);
      expect(objectAgent.run).not.toHaveBeenCalled();
      expect(characterAgent.run).toHaveBeenCalled();
    });

    it('skips intent detection for a location state', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [
            { id: input.stateId, visited: true, ambientClues: [] },
          ] as never,
        })
      );

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(result.stateType).toBe('location');
      expect(intentDetection.detect).not.toHaveBeenCalled();
      expect(result.detectedIntents).toEqual([]);
    });
  });

  describe('location visit', () => {
    it('reveals ambient clues on first visit and marks the location visited', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [
            {
              id: input.stateId,
              visited: false,
              ambientClues: [
                {
                  id: 'clue-1',
                  title: 'Cheiro cítrico',
                  description: 'perfume',
                  discovered: false,
                },
                {
                  id: 'clue-2',
                  title: 'Bilhete',
                  description: 'papel',
                  discovered: false,
                },
              ],
            },
          ] as never,
        })
      );

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(sessions.recordLocationVisit).toHaveBeenCalledWith({
        locationStateId: input.stateId,
        revealedAmbientClueIds: ['clue-1', 'clue-2'],
        discoveredClueIds: ['clue-1', 'clue-2'],
      });
      expect(result.discoveredClues.map((c) => c.id)).toEqual([
        'clue-1',
        'clue-2',
      ]);
    });

    it('does nothing when the location was already visited', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [
            {
              id: input.stateId,
              visited: true,
              ambientClues: [
                {
                  id: 'clue-1',
                  title: 'x',
                  description: 'y',
                  discovered: false,
                },
              ],
            },
          ] as never,
        })
      );

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(sessions.recordLocationVisit).not.toHaveBeenCalled();
      expect(result.discoveredClues).toEqual([]);
    });

    it('only marks undiscovered ambient clues as discovered', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          locationStates: [
            {
              id: input.stateId,
              visited: false,
              ambientClues: [
                {
                  id: 'clue-1',
                  title: 'a',
                  description: 'a',
                  discovered: true,
                },
                {
                  id: 'clue-2',
                  title: 'b',
                  description: 'b',
                  discovered: false,
                },
              ],
            },
          ] as never,
        })
      );

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(sessions.recordLocationVisit).toHaveBeenCalledWith({
        locationStateId: input.stateId,
        revealedAmbientClueIds: ['clue-1', 'clue-2'],
        discoveredClueIds: ['clue-2'],
      });
      expect(result.discoveredClues.map((c) => c.id)).toEqual(['clue-2']);
    });
  });

  describe('object inspection', () => {
    const detected = [
      { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
    ];

    const objectState = {
      id: input.stateId,
      name: 'Bilhete',
      shortDescription: 'um bilhete',
      initialDescription: 'papel dobrado',
      clueRevealRules: [
        {
          clueId: 'clue-1',
          revealText: 'revela a tinta',
          clue: { title: 'Tinta azul', description: 'tinta azulCaneta' },
          triggerIntents: [{ id: 'intent-1' }],
          requiredClues: [],
        },
      ],
    };

    const sessionClues = [
      {
        id: 'clue-1',
        title: 'Tinta azul',
        description: 'tinta azul',
        discovered: false,
      },
    ];

    it('runs the object agent, persists and returns enriched discovered clues', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: sessionClues as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([
        { clueId: 'clue-1', reasoning: 'a tinta estava visível' },
      ]);

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(objectAgent.run).toHaveBeenCalledWith(
        expect.objectContaining({
          object: expect.objectContaining({ id: input.stateId }),
          detectedIntents: detected,
          discoveredClueIds: [],
        })
      );
      expect(sessions.recordObjectInspection).toHaveBeenCalledWith({
        objectStateId: input.stateId,
        discoveredClueIds: ['clue-1'],
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'object', content: 'revela a tinta' },
        ],
      });
      expect(result.discoveredClues).toEqual([
        {
          id: 'clue-1',
          title: 'Tinta azul',
          description: 'tinta azul',
          reasoning: 'a tinta estava visível',
        },
      ]);
    });

    it('marks the object inspected even when no clue is discovered', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: sessionClues as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([]);

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(sessions.recordObjectInspection).toHaveBeenCalledWith({
        objectStateId: input.stateId,
        discoveredClueIds: [],
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'system', content: 'session:interact.noClueFound' },
        ],
      });
      expect(result.discoveredClues).toEqual([]);
    });

    it('passes already-discovered clue ids to the object agent', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          objectStates: [objectState] as never,
          clues: [
            { id: 'clue-prev', title: 'x', description: 'y', discovered: true },
          ] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);
      objectAgent.run.mockResolvedValue([]);

      await service.interact(sessionId, ownerId, input, language);

      expect(objectAgent.run).toHaveBeenCalledWith(
        expect.objectContaining({ discoveredClueIds: ['clue-prev'] })
      );
    });
  });

  describe('character interaction', () => {
    const detected = [
      { intentId: 'intent-1', confidence: 0.9, reasoning: 'clear' },
    ];

    const characterState = {
      id: input.stateId,
      name: 'Rafa',
      role: 'garçom',
      shortDescription: 'nervoso',
      personality: 'ansioso',
      speakingStyle: 'direto',
      publicKnowledge: [],
      privateKnowledge: [],
      openingLine: 'oi',
      conversationBoundaries: [],
      conversationSummary: null,
      clueRevealRules: [],
      secrets: [],
      revealedClues: [],
      messages: [],
    };

    it('runs the character agent, persists and returns the reply', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({ characterStates: [characterState] as never })
      );
      intentDetection.detect.mockResolvedValue(detected);
      characterAgent.run.mockResolvedValue({
        reply: 'Não vi nada não.',
        discoveredClues: [{ clueId: 'clue-1', reasoning: 'mencionou' }],
        updatedConversationSummary: 'novo resumo',
        updatedSecretStates: [
          {
            secretId: 'secret-1',
            currentStageLevel: 1,
            revealedStageIds: ['stage-1'],
            revealedClueIds: [],
          },
        ],
      });

      const result = await service.interact(
        sessionId,
        ownerId,
        input,
        language
      );

      expect(sessions.recordCharacterInteraction).toHaveBeenCalledWith({
        characterStateId: input.stateId,
        conversationSummary: 'novo resumo',
        discoveredClueIds: ['clue-1'],
        updatedSecretStates: [
          {
            secretId: 'secret-1',
            currentStageLevel: 1,
            revealedStageIds: ['stage-1'],
            revealedClueIds: [],
          },
        ],
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'character', content: 'Não vi nada não.' },
        ],
      });
      expect(result.reply).toBe('Não vi nada não.');
    });

    it('passes recent conversation messages to the character agent', async () => {
      sessions.findById.mockResolvedValue(
        buildSession({
          characterStates: [
            {
              ...characterState,
              messages: [
                { role: 'user', content: 'msg-1' },
                { role: 'character', content: 'msg-2' },
              ],
            },
          ] as never,
        })
      );
      intentDetection.detect.mockResolvedValue(detected);

      await service.interact(sessionId, ownerId, input, language);

      expect(characterAgent.run).toHaveBeenCalledWith(
        expect.objectContaining({
          recentConversation: [
            { role: 'user', content: 'msg-1' },
            { role: 'character', content: 'msg-2' },
          ],
        })
      );
    });
  });
});
