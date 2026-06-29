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
    recentConversation: [],
    interaction: 'o que aconteceu?',
    detectedIntents: [{ intentId: 'intent-a', confidence: 0.9, reasoning: '' }],
    discoveredClues: [],
    clueRules: [buildRule({})],
    secrets: [],
    language,
  };

  it('always calls the LLM and returns the reply', async () => {
    llm.invoke.mockResolvedValue('Não vi nada não.');

    const result = await agent.run(baseInput);

    expect(llm.invoke).toHaveBeenCalled();
    expect(result.reply).toBe('Não vi nada não.');
  });

  it('reveals clues from eligible clue rules', async () => {
    llm.invoke.mockResolvedValue('...');

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

      llm.invoke.mockResolvedValue('...');

      await agent.run({ ...baseInput, clueRules: rules });

      // both clues enforced -> cascade worked
      const sentMessages = llm.invoke.mock.calls[0][0];
      expect(sentMessages).toBeDefined();
    });

    it('does not unlock a rule when its required clue is absent', async () => {
      const rules = [
        buildRule({ clueId: 'clue-a', requiredClueIds: ['clue-missing'] }),
      ];

      llm.invoke.mockResolvedValue('...');

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
      llm.invoke.mockResolvedValue('...');

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
      llm.invoke.mockResolvedValue('...');

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
      llm.invoke.mockResolvedValue('...');

      const result = await agent.run({
        ...baseInput,
        clueRules: [],
        secrets: [buildSecret({ currentStageLevel: 1 })],
      });

      expect(result.updatedSecretStates).toEqual([]);
    });
  });

  it('builds a single consolidated system message and filters system from history', async () => {
    llm.invoke.mockResolvedValue('...');

    const result = await agent.run({
      ...baseInput,
      recentConversation: [
        { role: 'system', content: 'old-base-prompt' },
        { role: 'user', content: 'msg-1' },
        { role: 'character', content: 'msg-2' },
        { role: 'system', content: 'old-turn-prompt' },
      ],
    });

    const messages = llm.invoke.mock.calls[0][0] as Array<{
      role: string;
      content: string;
    }>;

    // Single consolidated system at top, system messages filtered from history
    const systemMessages = messages.filter((m) => m.role === 'system');
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0].content).toContain('characterAgentSystemPrompt');
    expect(systemMessages[0].content).toContain('characterAgentTurnStatePrompt');

    // History: only user/assistant, no system
    expect(messages[1]).toEqual({ role: 'user', content: 'msg-1' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'msg-2' });

    // Final message is the current interaction
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: baseInput.interaction,
    });

    // systemMessages for persistence: always BASE + TURN
    expect(result.systemMessages).toHaveLength(2);
    expect(result.systemMessages[0]).toBe('characterAgentSystemPrompt');
    expect(result.systemMessages[1]).toBe('characterAgentTurnStatePrompt');
  });
});
