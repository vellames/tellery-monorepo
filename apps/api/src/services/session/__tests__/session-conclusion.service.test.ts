import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { StatusCodes } from 'http-status-codes';
import { SessionConclusionService } from '../session-conclusion.service';
import { ISessionRepository } from '../../../interfaces';
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
    title: 'Test',
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
    conclusionFields: [],
    endingSnapshots: [],
    conclusion: null,
    ending: null,
    ...overrides,
  }) as unknown as HistorySessionWithRelations;

describe('SessionConclusionService', () => {
  let sessions: DeepMockProxy<ISessionRepository>;
  let service: SessionConclusionService;

  const ownerId = 'user-1';
  const sessionId = 'session-1';

  const conclusionFields = [
    {
      id: 'field-1',
      fieldDefinitionId: 'field-def-1',
      label: 'Who did it?',
      type: 'character' as const,
      options: [
        { id: 'opt-1', optionDefinitionId: 'opt-def-1', label: 'Alice' },
        { id: 'opt-2', optionDefinitionId: 'opt-def-2', label: 'Bob' },
      ],
      answers: [],
    },
    {
      id: 'field-2',
      fieldDefinitionId: 'field-def-2',
      label: 'Why?',
      type: 'choice' as const,
      options: [
        { id: 'opt-3', optionDefinitionId: 'opt-def-3', label: 'Revenge' },
        { id: 'opt-4', optionDefinitionId: 'opt-def-4', label: 'Money' },
      ],
      answers: [],
    },
  ];

  const endingSnapshots = [
    {
      id: 'ending-1',
      endingDefinitionId: 'ending-def-1',
      sessionId,
      title: 'Full Truth',
      type: 'full_truth' as const,
      imageUrl: null,
      summary: 'You solved it completely.',
      epilogue: 'The end.',
      conclusionMatches: {
        'field-def-1': 'opt-def-1',
        'field-def-2': 'opt-def-3',
      },
      requiredClues: [{ id: 'clue-1' }, { id: 'clue-2' }],
    },
    {
      id: 'ending-2',
      endingDefinitionId: 'ending-def-2',
      sessionId,
      title: 'Partial Truth',
      type: 'partial_truth' as const,
      imageUrl: null,
      summary: 'You got part of it.',
      epilogue: 'Not quite.',
      conclusionMatches: { 'field-def-1': 'opt-def-1' },
      requiredClues: [{ id: 'clue-1' }],
    },
    {
      id: 'ending-3',
      endingDefinitionId: 'ending-def-3',
      sessionId,
      title: 'Wrong Accusation',
      type: 'wrong_accusation' as const,
      imageUrl: null,
      summary: 'You got it wrong.',
      epilogue: 'Better luck next time.',
      conclusionMatches: {},
      requiredClues: [],
    },
  ];

  const clues = [
    { id: 'clue-1', importance: 'required', discovered: true },
    { id: 'clue-2', importance: 'required', discovered: true },
  ];

  beforeEach(() => {
    sessions = mockDeep<ISessionRepository>();
    service = new SessionConclusionService(sessions);
  });

  afterEach(() => mockReset(sessions));

  it('resolves full_truth ending when all answers match and all required clues discovered', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: clues as never,
        conclusionFields: conclusionFields as never,
        endingSnapshots: endingSnapshots as never,
      })
    );

    const result = await service.submit(sessionId, ownerId, {
      answers: [
        { fieldId: 'field-1', optionId: 'opt-1' },
        { fieldId: 'field-2', optionId: 'opt-3' },
      ],
    });

    expect(result.ending.type).toBe('full_truth');
    expect(result.ending.title).toBe('Full Truth');
    expect(result.score.correctAnswers).toBe(2);
    expect(result.score.totalAnswers).toBe(2);
    expect(result.score.discoveredClues).toBe(2);
    expect(result.score.totalClues).toBe(2);
    expect(result.score.requiredCluesDiscovered).toBe(2);
    expect(result.score.totalRequiredClues).toBe(2);
    expect(sessions.submitConclusion).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        endingSnapshotId: 'ending-1',
      })
    );
  });

  it('resolves partial_truth ending when only some answers match', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: clues as never,
        conclusionFields: conclusionFields as never,
        endingSnapshots: endingSnapshots as never,
      })
    );

    const result = await service.submit(sessionId, ownerId, {
      answers: [
        { fieldId: 'field-1', optionId: 'opt-1' },
        { fieldId: 'field-2', optionId: 'opt-4' },
      ],
    });

    expect(result.ending.type).toBe('partial_truth');
    expect(result.score.correctAnswers).toBe(1);
  });

  it('resolves wrong_accusation when no answers match any ending', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: clues as never,
        conclusionFields: conclusionFields as never,
        endingSnapshots: endingSnapshots as never,
      })
    );

    const result = await service.submit(sessionId, ownerId, {
      answers: [
        { fieldId: 'field-1', optionId: 'opt-2' },
        { fieldId: 'field-2', optionId: 'opt-4' },
      ],
    });

    expect(result.ending.type).toBe('wrong_accusation');
    expect(result.score.correctAnswers).toBe(0);
  });

  it('throws 404 when session does not exist', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'field-1', optionId: 'opt-1' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.NOT_FOUND,
      messageKey: 'session:errors.unknownSession',
    });
  });

  it('throws 403 when session belongs to another user', async () => {
    sessions.findById.mockResolvedValue(buildSession({ userId: 'other' }));

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'field-1', optionId: 'opt-1' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.FORBIDDEN,
      messageKey: 'session:errors.sessionNotOwned',
    });
  });

  it('throws 409 when session is already completed', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({ status: 'completed', completedAt: new Date() })
    );

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'field-1', optionId: 'opt-1' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.CONFLICT,
      messageKey: 'session:errors.sessionAlreadyCompleted',
    });
  });

  it('throws 422 when required clues are not all discovered', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: [
          { id: 'clue-1', importance: 'required', discovered: true },
          { id: 'clue-2', importance: 'required', discovered: false },
        ] as never,
      })
    );

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'field-1', optionId: 'opt-1' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      messageKey: 'session:errors.requiredCluesNotDiscovered',
    });
  });

  it('throws 404 when fieldId does not exist', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: clues as never,
        conclusionFields: conclusionFields as never,
        endingSnapshots: endingSnapshots as never,
      })
    );

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'nonexistent', optionId: 'opt-1' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.NOT_FOUND,
      messageKey: 'session:errors.unknownConclusionField',
    });
  });

  it('throws 404 when optionId does not belong to the field', async () => {
    sessions.findById.mockResolvedValue(
      buildSession({
        clues: clues as never,
        conclusionFields: conclusionFields as never,
        endingSnapshots: endingSnapshots as never,
      })
    );

    await expect(
      service.submit(sessionId, ownerId, {
        answers: [{ fieldId: 'field-1', optionId: 'opt-3' }],
      })
    ).rejects.toMatchObject({
      statusCode: StatusCodes.NOT_FOUND,
      messageKey: 'session:errors.unknownConclusionOption',
    });
  });
});
