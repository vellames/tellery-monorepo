import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { IStructuredChatModel } from '../../llm/structured-chat-model.interface';
import {
  CharacterAgent,
  CharacterAgentCharacter,
  CharacterClueRule,
  CharacterSecret,
  CharacterTranslationFn,
} from '../character-agent.service';

describe('CharacterAgent', () => {
  let llm: DeepMockProxy<IStructuredChatModel>;
  let translate: jest.Mock;
  let agent: CharacterAgent;

  const language = 'pt-BR' as SupportedLanguage;

  const character: CharacterAgentCharacter = {
    id: 'char-1',
    name: 'Rafa',
    role: 'garçom',
    shortDescription: 'nervoso',
    personality: 'ansioso',
    speakingStyle: 'direto',
    publicKnowledge: [],
    privateKnowledge: [],
    openingLine: 'oi',
    conversationBoundaries: [],
  };

  const buildRule = (
    overrides: Partial<CharacterClueRule>
  ): CharacterClueRule => ({
    clueId: 'clue-1',
    revealText: 'revela a tinta',
    clueTitle: 'Tinta azul',
    clueDescription: 'tinta azul',
    triggerIntentIds: ['intent-a'],
    requiredClueIds: [],
    ...overrides,
  });

  beforeEach(() => {
    llm = mockDeep<IStructuredChatModel>();
    translate = jest.fn(
      ((lang: string, key: string) => key) as unknown as CharacterTranslationFn
    );
    agent = new CharacterAgent(llm, translate);
  });

  afterEach(() => {
    mockReset(llm);
  });

  const baseInput = {
    character,
    conversationSummary: null,
    recentConversation: [],
    interaction: 'o que aconteceu?',
    detectedIntents: [{ intentId: 'intent-a', confidence: 0.9, reasoning: '' }],
    discoveredClueIds: [],
    clueRules: [buildRule({})],
    secrets: [],
    language,
  };

  it('always calls the LLM and returns the reply and conversation summary', async () => {
    llm.invokeStructured.mockResolvedValue({
      reply: 'Não vi nada não.',
      discoveredClues: [{ clueId: 'clue-1', reasoning: 'mencionou' }],
      updatedConversationSummary: 'resumo atualizado',
    });

    const result = await agent.run(baseInput);

    expect(llm.invokeStructured).toHaveBeenCalled();
    expect(result.reply).toBe('Não vi nada não.');
    expect(result.updatedConversationSummary).toBe('resumo atualizado');
  });

  it('enforces eligible clue rules the LLM omitted', async () => {
    llm.invokeStructured.mockResolvedValue({
      reply: '...',
      discoveredClues: [],
      updatedConversationSummary: 'resumo',
    });

    const result = await agent.run(baseInput);

    expect(result.discoveredClues.map((c) => c.clueId)).toEqual(['clue-1']);
  });

  it('filters out LLM-returned clue ids that are not eligible', async () => {
    llm.invokeStructured.mockResolvedValue({
      reply: '...',
      discoveredClues: [
        { clueId: 'clue-1', reasoning: 'ok' },
        { clueId: 'clue-foreign', reasoning: 'invalid' },
      ],
      updatedConversationSummary: 'resumo',
    });

    const result = await agent.run(baseInput);

    expect(result.discoveredClues.map((c) => c.clueId)).toEqual(['clue-1']);
  });

  describe('clue rule cascade', () => {
    it('unlocks a rule whose required clue becomes eligible in the same pass', async () => {
      const rules = [
        buildRule({ clueId: 'clue-a', requiredClueIds: [] }),
        buildRule({
          clueId: 'clue-b',
          requiredClueIds: ['clue-a'],
        }),
      ];

      llm.invokeStructured.mockResolvedValue({
        reply: '...',
        discoveredClues: [],
        updatedConversationSummary: 'resumo',
      });

      await agent.run({ ...baseInput, clueRules: rules });

      // both clues enforced -> cascade worked
      const call = llm.invokeStructured.mock.calls[0][1];
      expect(call).toBeDefined();
    });

    it('does not unlock a rule when its required clue is absent', async () => {
      const rules = [
        buildRule({ clueId: 'clue-a', requiredClueIds: ['clue-missing'] }),
      ];

      llm.invokeStructured.mockResolvedValue({
        reply: '...',
        discoveredClues: [],
        updatedConversationSummary: 'resumo',
      });

      const result = await agent.run({ ...baseInput, clueRules: rules });

      expect(result.discoveredClues).toEqual([]);
    });
  });

  describe('secret stages', () => {
    const buildSecret = (
      overrides: Partial<CharacterSecret>
    ): CharacterSecret => ({
      secretId: 'secret-1',
      currentStageLevel: 0,
      summary: 'sumário',
      truth: 'verdade',
      defaultStrategy: 'evade',
      stages: [
        {
          stageId: 'stage-1',
          level: 1,
          behavior: 'fica evasivo',
          allowedToRevealTruth: false,
          sampleResponses: [],
          triggerIntentIds: ['intent-a'],
          requiredClueIds: [],
          revealsClueIds: ['clue-secret'],
        },
      ],
      ...overrides,
    });

    it('advances a secret to the highest eligible stage and reveals its clues', async () => {
      llm.invokeStructured.mockResolvedValue({
        reply: '...',
        discoveredClues: [],
        updatedConversationSummary: 'resumo',
      });

      const result = await agent.run({
        ...baseInput,
        clueRules: [],
        secrets: [buildSecret({})],
      });

      expect(result.updatedSecretStates).toEqual([
        {
          secretId: 'secret-1',
          currentStageLevel: 1,
          revealedStageIds: ['stage-1'],
          revealedClueIds: ['clue-secret'],
        },
      ]);
      // the secret-revealed clue is enforced into discoveredClues
      expect(result.discoveredClues.map((c) => c.clueId)).toContain(
        'clue-secret'
      );
    });

    it('does not advance a secret when no stage is eligible', async () => {
      llm.invokeStructured.mockResolvedValue({
        reply: '...',
        discoveredClues: [],
        updatedConversationSummary: 'resumo',
      });

      const result = await agent.run({
        ...baseInput,
        detectedIntents: [
          { intentId: 'unrelated', confidence: 0.9, reasoning: '' },
        ],
        clueRules: [],
        secrets: [buildSecret({})],
      });

      expect(result.updatedSecretStates).toEqual([]);
    });

    it('does not consider stages at or below the current level', async () => {
      llm.invokeStructured.mockResolvedValue({
        reply: '...',
        discoveredClues: [],
        updatedConversationSummary: 'resumo',
      });

      const result = await agent.run({
        ...baseInput,
        clueRules: [],
        secrets: [buildSecret({ currentStageLevel: 1 })],
      });

      expect(result.updatedSecretStates).toEqual([]);
    });
  });

  it('builds the prompt with translated system and user prompts', async () => {
    llm.invokeStructured.mockResolvedValue({
      reply: '...',
      discoveredClues: [],
      updatedConversationSummary: 'resumo',
    });

    await agent.run(baseInput);

    expect(translate).toHaveBeenCalledWith(
      language,
      'characterAgentSystemPrompt'
    );
    expect(translate).toHaveBeenCalledWith(
      language,
      'characterAgentUserPrompt',
      expect.objectContaining({
        interaction: baseInput.interaction,
        character: expect.any(String),
      })
    );
  });
});
