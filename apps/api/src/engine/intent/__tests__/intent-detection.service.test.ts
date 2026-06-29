import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { IStructuredChatModel } from '../../llm/structured-chat-model.interface';
import {
  IntentDetectionService,
  IntentDetectionTarget,
  IntentTranslationFn,
} from '../intent-detection.service';

describe('IntentDetectionService', () => {
  let llm: DeepMockProxy<IStructuredChatModel>;
  let translate: jest.Mock;
  let service: IntentDetectionService;

  const language = 'en' as SupportedLanguage;
  const threshold = 0.5;

  const intents: IntentDetectionTarget[] = [
    {
      id: 'accuse',
      description: 'User accuses someone',
      examples: ['you did it', 'it was you'],
      keywords: ['accuse', 'culprit'],
    },
    {
      id: 'ask_about',
      description: 'User asks about something',
      examples: ['tell me about', 'what do you know'],
      keywords: ['ask', 'question'],
    },
    {
      id: 'off_topic',
      description: 'Message is off topic',
      examples: ['nice weather'],
      keywords: ['weather', 'random'],
    },
  ];

  beforeEach(() => {
    llm = mockDeep<IStructuredChatModel>();
    translate = jest.fn(
      ((lang: string, key: string) => key) as unknown as IntentTranslationFn
    );
    service = new IntentDetectionService(llm, threshold, translate);
  });

  afterEach(() => {
    mockReset(llm);
  });

  const baseInput = { message: 'I think you did it!', intents, language };

  // ── Keyword matching ──────────────────────────────────────────────────

  it('detects intents by keyword match', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    const result = await service.detect({
      ...baseInput,
      message: 'I want to accuse you!',
    });

    expect(result).toContainEqual({
      intentId: 'accuse',
      confidence: 1,
      reasoning: 'Matched by keyword.',
    });
  });

  it('normalizes accented text for keyword matching', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    const result = await service.detect({
      message: 'Me fala sobre o bilhete anônimo',
      intents: [
        {
          id: 'perguntar_bilhete',
          description: 'Perguntar sobre o bilhete',
          examples: ['O que diz o bilhete?'],
          keywords: ['bilhete', 'recado'],
        },
        {
          id: 'off_topic',
          description: 'Fora do escopo',
          examples: ['bom dia'],
          keywords: [],
        },
      ],
      language: 'pt-BR' as SupportedLanguage,
    });

    expect(result).toContainEqual({
      intentId: 'perguntar_bilhete',
      confidence: 1,
      reasoning: 'Matched by keyword.',
    });
  });

  it('matches multiple intents when multiple keywords are present', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    const result = await service.detect({
      ...baseInput,
      message: 'I want to ask a question and accuse you',
    });

    const intentIds = result.map((r) => r.intentId);
    expect(intentIds).toContain('ask_about');
    expect(intentIds).toContain('accuse');
  });

  it('does not keyword-match the off_topic intent even when its keyword appears', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    const result = await service.detect({
      ...baseInput,
      message: 'The weather is nice today',
    });

    // off_topic has keyword 'weather' but should NOT be keyword-matched
    // (off_topic is always excluded from keyword matching)
    const keywordMatches = result.filter(
      (r) => r.reasoning === 'Matched by keyword.'
    );
    expect(keywordMatches).toEqual([]);
  });

  // ── LLM fallback ──────────────────────────────────────────────────────

  it('calls LLM for intents that did not match keywords', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'clear accusation' },
    ]);

    const result = await service.detect(baseInput);

    expect(result).toContainEqual({
      intentId: 'accuse',
      confidence: 0.9,
      reasoning: 'clear accusation',
    });
    expect(llm.invokeStructured).toHaveBeenCalled();
  });

  it('combines keyword matches with LLM matches', async () => {
    const combinedIntents: IntentDetectionTarget[] = [
      {
        id: 'about_note',
        description: 'Ask about the note',
        examples: ['What does the note say?'],
        keywords: ['note', 'letter'],
      },
      {
        id: 'accuse',
        description: 'Accuse someone',
        examples: ['you did it'],
        keywords: ['accuse'],
      },
      {
        id: 'off_topic',
        description: 'Off topic',
        examples: ['nice weather'],
        keywords: [],
      },
    ];

    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.8, reasoning: 'indirect accusation' },
    ]);

    const result = await service.detect({
      message: 'Tell me about this note, I think you wrote it',
      intents: combinedIntents,
      language,
    });

    // 'note' keyword matched deterministically
    expect(result).toContainEqual({
      intentId: 'about_note',
      confidence: 1,
      reasoning: 'Matched by keyword.',
    });
    // 'accuse' was NOT keyword-matched (no keyword in message) but LLM detected it
    expect(result).toContainEqual({
      intentId: 'accuse',
      confidence: 0.8,
      reasoning: 'indirect accusation',
    });
    // LLM only saw intents without keyword match
    expect(llm.invokeStructured).toHaveBeenCalledTimes(1);
  });

  it('filters out LLM intents below threshold', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.3, reasoning: 'too low' },
    ]);

    const result = await service.detect(baseInput);

    expect(result).toEqual([
      {
        intentId: 'off_topic',
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ]);
  });

  it('filters out LLM intents with unknown ids', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'unknown', confidence: 0.99, reasoning: 'invalid' },
    ]);

    const result = await service.detect(baseInput);

    expect(result).toEqual([
      {
        intentId: 'off_topic',
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ]);
  });

  // ── Completeness ─────────────────────────────────────────────────────

  it('scores every intent even when the LLM omits some', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'clear' },
    ]);

    const result = await service.detect(baseInput);

    // Only the above-threshold intent is returned; the omitted intents were
    // filled with 0 internally and filtered out, but no error was thrown.
    expect(result.map((r) => r.intentId)).toEqual(['accuse']);
    // The LLM is always invoked — no intent is skipped.
    expect(llm.invokeStructured).toHaveBeenCalledTimes(1);
  });

  it('always calls the LLM even when keywords match', async () => {
    llm.invokeStructured.mockResolvedValue([]);

    await service.detect({
      ...baseInput,
      message: 'I want to accuse you!',
    });

    expect(llm.invokeStructured).toHaveBeenCalledTimes(1);
  });

  // ── Fallback ──────────────────────────────────────────────────────────

  it('falls back to first intent when off_topic is unavailable and nothing matches', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.1, reasoning: 'too low' },
    ]);

    const result = await service.detect({
      ...baseInput,
      intents: intents.filter((i) => i.id !== 'off_topic'),
    });

    expect(result).toEqual([
      {
        intentId: 'accuse',
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ]);
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it('throws when no intents are provided', async () => {
    await expect(service.detect({ ...baseInput, intents: [] })).rejects.toThrow(
      'at least one intent'
    );

    expect(llm.invokeStructured).not.toHaveBeenCalled();
  });

  it('clamps a NaN threshold to the default 0.5', async () => {
    const nanService = new IntentDetectionService(llm, Number.NaN, translate);
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.6, reasoning: 'ok' },
    ]);

    await nanService.detect(baseInput);

    expect(translate).toHaveBeenCalledWith(
      language,
      'intentDetectorUserPrompt',
      expect.objectContaining({ threshold: '0.5' })
    );
  });

  it('builds the prompt with translated messages', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'ok' },
    ]);

    await service.detect(baseInput);

    expect(translate).toHaveBeenCalledWith(
      language,
      'intentDetectorSystemPrompt'
    );
    expect(llm.invokeStructured).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]),
      expect.anything()
    );
  });
});
