import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { IStructuredChatModel } from '../../llm/structured-chat-model.interface';
import {
  ObjectAgent,
  ObjectAgentRule,
  ObjectTranslationFn,
} from '../object-agent.service';

describe('ObjectAgent', () => {
  let llm: DeepMockProxy<IStructuredChatModel>;
  let translate: jest.Mock;
  let agent: ObjectAgent;

  const language = 'pt-BR' as SupportedLanguage;
  const object = {
    id: 'object-1',
    name: 'Bilhete',
    shortDescription: 'Um bilhete na mesa',
    initialDescription: 'Um papel dobrado',
  };

  const buildRule = (
    overrides: Partial<ObjectAgentRule>
  ): ObjectAgentRule => ({
    clueId: 'clue-1',
    revealText: 'O bilhete revela a tinta',
    clueTitle: 'Tinta azul',
    clueDescription: 'A tinta é azul',
    triggerIntentIds: ['intent-ink'],
    requiredClueIds: [],
    ...overrides,
  });

  beforeEach(() => {
    llm = mockDeep<IStructuredChatModel>();
    translate = jest.fn(
      ((lang: string, key: string) => key) as unknown as ObjectTranslationFn
    );
    agent = new ObjectAgent(llm, translate);
  });

  afterEach(() => {
    mockReset(llm);
  });

  const baseInput = {
    object,
    rules: [buildRule({})],
    detectedIntents: [{ intentId: 'intent-ink', confidence: 0.9, reasoning: 'ok' }],
    discoveredClueIds: [],
    language,
  };

  it('returns [] and skips the LLM when no rule is eligible', async () => {
    const result = await agent.run({
      ...baseInput,
      detectedIntents: [{ intentId: 'unrelated', confidence: 0.9, reasoning: '' }],
    });

    expect(result).toEqual([]);
    expect(llm.invokeStructured).not.toHaveBeenCalled();
  });

  it('returns discovered clues from the LLM filtered to eligible clue ids', async () => {
    llm.invokeStructured.mockResolvedValue([
      { clueId: 'clue-1', reasoning: 'a tinta visível' },
    ]);

    const result = await agent.run(baseInput);

    expect(result).toEqual([
      { clueId: 'clue-1', reasoning: 'a tinta visível' },
    ]);
  });

  it('enforces eligible clues the LLM omitted with a default reasoning', async () => {
    const rules = [
      buildRule({ clueId: 'clue-1' }),
      buildRule({ clueId: 'clue-2', revealText: 'Dobra suspeita' }),
    ];

    llm.invokeStructured.mockResolvedValue([
      { clueId: 'clue-1', reasoning: 'revelada pelo modelo' },
    ]);

    const result = await agent.run({ ...baseInput, rules });

    const clueIds = result.map((r) => r.clueId);
    expect(clueIds).toEqual(expect.arrayContaining(['clue-1', 'clue-2']));
    const enforced = result.find((r) => r.clueId === 'clue-2');
    expect(enforced?.reasoning).toMatch(/eligible/);
  });

  it('filters out LLM-returned clue ids not in the eligible set', async () => {
    llm.invokeStructured.mockResolvedValue([
      { clueId: 'clue-1', reasoning: 'válida' },
      { clueId: 'clue-foreign', reasoning: 'fora do conjunto' },
    ]);

    const result = await agent.run(baseInput);

    expect(result.map((r) => r.clueId)).toEqual(['clue-1']);
  });

  describe('eligibility', () => {
    it('is eligible when a trigger intent was detected and clue is undiscovered', async () => {
      llm.invokeStructured.mockResolvedValue([]);
      await agent.run(baseInput);

      expect(llm.invokeStructured).toHaveBeenCalled();
    });

    it('is not eligible when the clue was already discovered', async () => {
      const result = await agent.run({
        ...baseInput,
        discoveredClueIds: ['clue-1'],
      });

      expect(result).toEqual([]);
      expect(llm.invokeStructured).not.toHaveBeenCalled();
    });

    it('is not eligible when a required clue is missing', async () => {
      const result = await agent.run({
        ...baseInput,
        rules: [
          buildRule({
            clueId: 'clue-1',
            requiredClueIds: ['clue-prereq'],
          }),
        ],
        discoveredClueIds: [],
      });

      expect(result).toEqual([]);
      expect(llm.invokeStructured).not.toHaveBeenCalled();
    });

    it('is eligible when all required clues are discovered', async () => {
      llm.invokeStructured.mockResolvedValue([]);
      await agent.run({
        ...baseInput,
        rules: [
          buildRule({
            clueId: 'clue-1',
            requiredClueIds: ['clue-prereq'],
          }),
        ],
        discoveredClueIds: ['clue-prereq'],
      });

      expect(llm.invokeStructured).toHaveBeenCalled();
    });
  });

  it('builds the prompt with translated system and user prompts', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    await agent.run(baseInput);

    expect(translate).toHaveBeenCalledWith(language, 'objectAgentSystemPrompt');
    expect(translate).toHaveBeenCalledWith(
      language,
      'objectAgentUserPrompt',
      expect.objectContaining({
        object: expect.any(String),
        detectedIntents: expect.any(String),
        discoveredClueIds: expect.any(String),
        eligibleRules: expect.any(String),
      })
    );
  });
});
