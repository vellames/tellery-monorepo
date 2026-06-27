import {
  ClueImportance,
  ConclusionFieldType,
  EndingType,
  HistoryStatus,
  SecretDefaultStrategy,
} from '@prisma/client';
import type { HistoryWithDefinitions } from '../HistoryDefinitionRepository';
import {
  buildCharacterStates,
  buildEndingSnapshots,
  buildLocationStates,
  buildObjectStates,
  buildSessionRootCreateData,
  DefinitionIdMap,
} from '../session-snapshot.factory';

const mockHistory = (): HistoryWithDefinitions =>
  ({
    id: 'history-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    slug: 'o-bilhete-na-mesa-7',
    title: 'O Bilhete na Mesa 7',
    subtitle: null,
    teaser: 'teaser',
    genre: 'mystery',
    estimatedDurationMinutes: 10,
    status: 'draft' as HistoryStatus,
    coverImageUrl: null,
    thumbnailUrl: null,
    opening: 'opening',
    objective: 'objective',
    publishedAt: null,
    intentDefinitions: [
      { id: 'intent-1', description: 'ask', examples: ['e'], keywords: ['k'] },
    ],
    clues: [
      {
        id: 'clue-1',
        title: 'T',
        description: 'D',
        importance: 'required' as ClueImportance,
      },
    ],
    characters: [
      {
        id: 'char-1',
        name: 'Elisa',
        role: 'owner',
        shortDescription: 'sd',
        imageUrl: null,
        personality: 'p',
        speakingStyle: 'ss',
        publicKnowledge: [],
        privateKnowledge: [],
        conversationBoundaries: [],
        openingLine: 'hi',
        clueRevealRules: [
          {
            clue: { id: 'clue-1' },
            triggerIntents: [{ id: 'intent-1' }],
            requiredClues: [{ id: 'clue-1' }],
            revealText: 'reveal',
            responseGuidance: 'guidance',
          },
        ],
        secrets: [
          {
            id: 'secret-1',
            summary: 'sum',
            truth: 'truth',
            defaultStrategy: 'deny' as SecretDefaultStrategy,
            revealStages: [
              {
                id: 'stage-1',
                level: 1,
                triggerIntents: [{ id: 'intent-1' }],
                requiredClues: [{ id: 'clue-1' }],
                revealedClues: [{ id: 'clue-1' }],
                behavior: 'b',
                allowedToRevealTruth: false,
                sampleResponses: ['r'],
              },
            ],
          },
        ],
      },
    ],
    locations: [
      {
        id: 'loc-1',
        name: 'Mesa 7',
        shortDescription: 'sd',
        imageUrl: null,
        initialDescription: 'desc',
        ambientClues: [{ id: 'clue-1' }],
        objects: [],
      },
    ],
    objects: [
      {
        id: 'obj-1',
        name: 'Bilhete',
        shortDescription: 'sd',
        imageUrl: null,
        locationId: 'loc-1',
        initialDescription: 'desc',
        clueRevealRules: [
          {
            clue: { id: 'clue-1' },
            triggerIntents: [{ id: 'intent-1' }],
            requiredClues: [{ id: 'clue-1' }],
            revealText: 'reveal',
          },
        ],
      },
    ],
    conclusion: {
      id: 'conclusion-1',
      fields: [
        {
          id: 'field-1',
          label: 'Who?',
          type: 'character' as ConclusionFieldType,
          options: [{ id: 'opt-1', label: 'Elisa' }],
        },
      ],
    },
    endings: [
      {
        id: 'ending-1',
        title: 'Ending',
        type: 'full_truth' as EndingType,
        imageUrl: 'histories/o-bilhete-na-mesa-7/endings/full_truth.png',
        summary: 'sum',
        epilogue: 'epi',
        conclusionMatches: { field: 'opt' },
        requiredClues: [{ id: 'clue-1' }],
      },
    ],
  }) as unknown as HistoryWithDefinitions;

const clueMap: DefinitionIdMap = { 'clue-1': 'session-clue-1' };
const intentMap: DefinitionIdMap = { 'intent-1': 'session-intent-1' };

describe('session-snapshot.factory', () => {
  describe('buildSessionRootCreateData', () => {
    it('maps history scalars and nested clues, intents and conclusion form', () => {
      const data = buildSessionRootCreateData(mockHistory(), 'user-1');

      expect(data.userId).toBe('user-1');
      expect(data.historyId).toBe('history-1');
      expect(data.title).toBe('O Bilhete na Mesa 7');
      expect(data.opening).toBe('opening');

      expect(data.clues).toEqual({
        create: [
          {
            clueDefinitionId: 'clue-1',
            title: 'T',
            description: 'D',
            importance: 'required',
          },
        ],
      });
      expect(data.intents).toEqual({
        create: [
          {
            intentDefinitionId: 'intent-1',
            description: 'ask',
            examples: ['e'],
            keywords: ['k'],
          },
        ],
      });
      expect(data.conclusionFields).toEqual({
        create: [
          {
            fieldDefinitionId: 'field-1',
            label: 'Who?',
            type: 'character',
            options: {
              create: [{ optionDefinitionId: 'opt-1', label: 'Elisa' }],
            },
          },
        ],
      });
    });

    it('produces empty conclusionFields when history has no conclusion', () => {
      const history = mockHistory();
      (history as { conclusion: unknown }).conclusion = null;

      const data = buildSessionRootCreateData(history, 'user-1');

      expect(data.conclusionFields).toEqual({ create: [] });
    });
  });

  describe('buildEndingSnapshots', () => {
    it('maps endings and connects requiredClues via clueMap', () => {
      const [ending] = buildEndingSnapshots(
        mockHistory(),
        'session-1',
        clueMap
      );

      expect(ending.sessionId).toBe('session-1');
      expect(ending.endingDefinitionId).toBe('ending-1');
      expect(ending.imageUrl).toBe(
        'histories/o-bilhete-na-mesa-7/endings/full_truth.png'
      );
      expect(ending.requiredClues).toEqual({
        connect: [{ id: 'session-clue-1' }],
      });
    });
  });

  describe('buildLocationStates', () => {
    it('maps locations and connects ambientClues via clueMap', () => {
      const [location] = buildLocationStates(
        mockHistory(),
        'session-1',
        clueMap
      );

      expect(location.locationDefinitionId).toBe('loc-1');
      expect(location.ambientClues).toEqual({
        connect: [{ id: 'session-clue-1' }],
      });
    });
  });

  describe('buildObjectStates', () => {
    it('maps objects with clueRevealRules wired via maps', () => {
      const locationMap: DefinitionIdMap = { 'loc-1': 'session-loc-1' };
      const [object] = buildObjectStates(
        mockHistory(),
        'session-1',
        clueMap,
        intentMap,
        locationMap
      );

      expect(object.objectDefinitionId).toBe('obj-1');
      expect(object.locationStateId).toBe('session-loc-1');
      expect(object.clueRevealRules).toEqual({
        create: [
          {
            clueId: 'session-clue-1',
            triggerIntents: { connect: [{ id: 'session-intent-1' }] },
            requiredClues: { connect: [{ id: 'session-clue-1' }] },
            revealText: 'reveal',
          },
        ],
      });
    });
  });

  describe('buildCharacterStates', () => {
    it('maps characters with reveal rules and secrets/stages wired via maps', () => {
      const [character] = buildCharacterStates(
        mockHistory(),
        'session-1',
        clueMap,
        intentMap
      );

      expect(character.characterDefinitionId).toBe('char-1');
      expect(character.name).toBe('Elisa');
      expect(character.clueRevealRules).toEqual({
        create: [
          {
            clueId: 'session-clue-1',
            triggerIntents: { connect: [{ id: 'session-intent-1' }] },
            requiredClues: { connect: [{ id: 'session-clue-1' }] },
            revealText: 'reveal',
            responseGuidance: 'guidance',
          },
        ],
      });
      expect(character.secrets).toEqual({
        create: [
          {
            secretDefinitionId: 'secret-1',
            summary: 'sum',
            truth: 'truth',
            defaultStrategy: 'deny',
            revealStages: {
              create: [
                {
                  stageDefinitionId: 'stage-1',
                  level: 1,
                  triggerIntents: { connect: [{ id: 'session-intent-1' }] },
                  requiredClues: { connect: [{ id: 'session-clue-1' }] },
                  revealsClues: { connect: [{ id: 'session-clue-1' }] },
                  behavior: 'b',
                  allowedToRevealTruth: false,
                  sampleResponses: ['r'],
                },
              ],
            },
          },
        ],
      });
    });
  });
});
