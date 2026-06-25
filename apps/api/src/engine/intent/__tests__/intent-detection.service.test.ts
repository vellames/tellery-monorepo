import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { SupportedLanguage } from '@ai-history/i18n';
import { IStructuredChatModel } from '../../llm/structured-chat-model.interface';
import {
  DetectedIntent,
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

  const input = { message: 'I think you did it!', intents, language };

  it('returns intents above the threshold with valid ids', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'clear accusation' },
      { intentId: 'ask_about', confidence: 0.3, reasoning: 'too low' },
    ]);

    const result = await service.detect(input);

    expect(result).toEqual<DetectedIntent[]>([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'clear accusation' },
    ]);
  });

  it('filters out detected intents whose id is not in the provided set', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'ok' },
      { intentId: 'unknown_intent', confidence: 0.99, reasoning: 'invalid' },
    ]);

    const result = await service.detect(input);

    expect(result).toEqual([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'ok' },
    ]);
  });

  it('falls back to off_topic when no intent reaches the threshold', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.1, reasoning: 'too low' },
    ]);

    const result = await service.detect(input);

    expect(result).toEqual([
      {
        intentId: 'off_topic',
        confidence: 0,
        reasoning: 'No intent reached the configured threshold.',
      },
    ]);
  });

  it('falls back to the first intent when off_topic is not available', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'ask_about', confidence: 0.1, reasoning: 'too low' },
    ]);

    const result = await service.detect({
      ...input,
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

  it('throws when no intents are provided', async () => {
    await expect(
      service.detect({ ...input, intents: [] })
    ).rejects.toThrow('at least one intent');

    expect(llm.invokeStructured).not.toHaveBeenCalled();
  });

  it('builds the prompt messages with translated system and user prompts', async () => {
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.9, reasoning: 'ok' },
    ]);

    await service.detect(input);

    expect(llm.invokeStructured).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]),
      expect.anything()
    );

    expect(translate).toHaveBeenCalledWith(language, 'intentDetectorSystemPrompt');
    expect(translate).toHaveBeenCalledWith(
      language,
      'intentDetectorUserPrompt',
      expect.objectContaining({
        message: input.message,
        threshold: '0.5',
      })
    );
  });

  it('clamps a NaN threshold to the default 0.5', async () => {
    const nanService = new IntentDetectionService(llm, Number.NaN, translate);
    llm.invokeStructured.mockResolvedValue([
      { intentId: 'accuse', confidence: 0.6, reasoning: 'ok' },
    ]);

    await nanService.detect(input);

    expect(translate).toHaveBeenCalledWith(
      language,
      'intentDetectorUserPrompt',
      expect.objectContaining({ threshold: '0.5' })
    );
  });
});
