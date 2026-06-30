import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { ILlmCallRecorder } from '../../../interfaces';
import { OpenRouterAudioTranscriptionService } from '../openrouter-audio-transcription.service';

const okResponse = (body: unknown) => ({
  ok: true,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

describe('OpenRouterAudioTranscriptionService', () => {
  let recorder: DeepMockProxy<ILlmCallRecorder>;
  let service: OpenRouterAudioTranscriptionService;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    recorder = mockDeep<ILlmCallRecorder>();
    recorder.record.mockResolvedValue(undefined);
    originalFetch = globalThis.fetch;
    service = new OpenRouterAudioTranscriptionService(recorder);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockReset(recorder);
  });

  const audioInput = {
    buffer: Buffer.from('audio-bytes'),
    contentType: 'audio/webm',
    filename: 'clip.webm',
  };

  it('returns the transcribed text', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse({ text: 'olá mundo', usage: { seconds: 1, cost: 0.0001 } })
      );

    const result = await service.transcribe({
      ...audioInput,
      sessionId: 'session-1',
    });

    expect(result.text).toBe('olá mundo');
  });

  it('records usage (cost + seconds) fire-and-forget when a sessionId is provided', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse({ text: 'x', usage: { seconds: 6, cost: 0.0006 } })
      );

    await service.transcribe({ ...audioInput, sessionId: 'session-1' });

    await Promise.resolve();
    await Promise.resolve();

    expect(recorder.record).toHaveBeenCalledWith({
      sessionId: 'session-1',
      purpose: 'audio',
      model: 'openai/whisper-1',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0.0006,
      latencyMs: expect.any(Number),
      audioSeconds: 6,
    });
  });

  it('falls back to the local price table when usage.cost is absent', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(okResponse({ text: 'x', usage: { seconds: 6 } }));

    await service.transcribe({ ...audioInput, sessionId: 'session-1' });

    await Promise.resolve();
    await Promise.resolve();

    // 6s @ $0.006/min = 0.1 min * 0.006 = 0.0006
    expect(recorder.record).toHaveBeenCalledWith(
      expect.objectContaining({
        costUsd: expect.closeTo(0.0006, 9),
        audioSeconds: 6,
      })
    );
  });

  it('still resolves when the recorder rejects (truly fire-and-forget)', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse({ text: 'x', usage: { seconds: 1, cost: 0.0001 } })
      );
    recorder.record.mockRejectedValue(new Error('db down'));

    await expect(
      service.transcribe({ ...audioInput, sessionId: 'session-1' })
    ).resolves.toMatchObject({ text: 'x' });
  });

  it('does not record when no sessionId is provided', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse({ text: 'x', usage: { seconds: 1, cost: 0.0001 } })
      );

    await service.transcribe(audioInput);

    await Promise.resolve();
    expect(recorder.record).not.toHaveBeenCalled();
  });
});
