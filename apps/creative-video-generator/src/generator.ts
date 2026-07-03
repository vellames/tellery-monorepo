import fs from 'fs';
import path from 'path';
import { OpenRouterJsonClient } from './llm-client';
import { WavespeedClient } from './wavespeed-client';
import { GeneratorConfig } from './config';
import {
  GenerateOptions,
  ReferenceImage,
  RunResult,
  RunStatus,
  SeedancePayload,
  SocialCaption,
  SpoilerFreeContext,
  VideoPrompt,
  VideoShot,
} from './types';

const OUTPUT_VIDEO_FORMAT = 'mp4';

/**
 * Run the LLM to turn a spoiler-free story context into a single cinematic
 * 15-second video prompt. Persists the prompt so it can be tuned by hand and
 * re-used via --prompt-file.
 */
export async function generateVideoPrompt(
  context: SpoilerFreeContext,
  client: OpenRouterJsonClient,
  slug: string,
  outputDir: string,
  duration: number
): Promise<VideoPrompt> {
  const messages = buildLlmMessages(context, duration);
  const raw = await client.complete(messages);
  const prompt = coerceVideoPrompt(raw);

  fs.mkdirSync(outputDir, { recursive: true });
  const promptPath = path.join(outputDir, `${slug}-video-prompt.json`);
  fs.writeFileSync(promptPath, JSON.stringify(prompt, null, 2), 'utf8');
  console.log(`[creative-video-generator] video prompt saved: ${promptPath}`);

  const captionPath = path.join(outputDir, `${slug}-social-caption.txt`);
  fs.writeFileSync(captionPath, prompt.socialCaption.caption, 'utf8');
  console.log(
    `[creative-video-generator] social caption saved: ${captionPath}`
  );

  return prompt;
}

function buildLlmMessages(
  context: SpoilerFreeContext,
  duration: number
): {
  role: 'system' | 'user';
  content: string;
}[] {
  const system =
    'Você é um roteirista de criativos publicitários verticais para vídeo curto ' +
    '(TikTok e Instagram Reels, 9:16, ~15 segundos). ' +
    'Este é um ANÚNCIO PUBLICITÁRIO (ad creative) para um app de histórias interativas de mistério. ' +
    'O objetivo é gerar curiosidade suficiente para o espectador querer jogar/resolver o mistério. ' +
    'Você escreve um roteiro estruturado em shots (planos) sequenciais que um modelo ' +
    'de vídeo por IA (ByteDance Seedance 2.0) vai renderizar como um único clipe contínuo. ' +
    'Regras:\n' +
    '1. O criativo é um teaser de suspense para uma história interativa de mistério. ' +
    'Deve prender o espectador nos primeiros 2 segundos com um gancho forte.\n' +
    '2. NUNCA revelar o culpado, a solução ou qualquer spoiler. Sugira o ' +
    'mistério, não o resolva. Descreva apenas atmosfera, tensão e palpites.\n' +
    '3. ESCREVA SEMPRE EM PORTUGUÊS DO BRASIL, independente do idioma de qualquer ' +
    'campo de entrada. Todo o roteiro precisa estar em português.\n' +
    '4. Divida os 15 segundos em 4 a 6 shots. Cada shot tem "timecode" (ex.: "0-3s"), ' +
    '"visual" (descrição visual autossuficiente: câmera, sujeito, iluminação, movimento) ' +
    'e "narration" opcional (uma linha curta de locução em off / voiceover).\n' +
    '5. Os timecodes devem cobrir os 15 segundos completos, sem lacunas nem sobreposições, ' +
    'e somar exatamente a duração total.\n' +
    '6. O campo "visual" de cada shot deve ser concreto o suficiente para um modelo de vídeo — ' +
    'nomeie planos, ângulos, objetos em foco, paleta de cores e movimentos de câmera.\n' +
    '7. "narration" é a linha de voiceover daquele shot, para ser gravada em pós-produção (TTS/VO). ' +
    'Não conte com o áudio nativo do modelo para narração — ele gera apenas ambiente/SFX. ' +
    'A narração deve ser curta, impactante, e ajudar a conduzir o mistério sem spoiler.\n' +
    '8. O ÚLTIMO SHOT DEVE SER UM CTA (call-to-action) explícito. Reserve os últimos 2-3 segundos ' +
    'para um convite direto à ação: peça que o espectador resolva o mistério / investigue / jogue agora. ' +
    'O visual do CTA deve sugerir uma tela final de anúncio — pode incluir texto sobreposto estilizado ' +
    '(ex.: "Resolva o mistério", "Investigue agora", "Jogue agora"), fade para a identidade do app, ' +
    'ou um card final elegante alinhado à paleta. A "narration" do CTA é o gancho de conversão (ex.: ' +
    '"Você consegue descobrir quem foi? Resolva o mistério agora."). Não use um CTA genérico — ' +
    'amarre-o ao mistério específico da história.\n' +
    '9. O Tellery É UM WEB APP (rodando no navegador). NÃO existe aplicativo para baixar. ' +
    'NUNCA use as palavras "baixe", "baixar", "download", "app store", "play store", "instale" ou ' +
    'qualquer menção a instalação. Use sempre verbos de acesso web: "jogue", "acesse", "investigue", ' +
    '"descubra", "entre", "comece a jogar". Falar em "app Tellery" é ok, mas nunca em "baixar o app".\n' +
    '10. Use "styleNote" (opcional, string única) para declarar a identidade visual global ' +
    '(paleta, estilo, iluminação) que se aplica a todos os shots, inclusive o CTA.\n' +
    '11. Respeite qualquer "artDirection" fornecida como base para o "styleNote".\n' +
    '12. Inclua "socialCaption": uma legenda pronta para postar no TikTok/Instagram Reels, ' +
    'ajustada ao criativo. Deve ter um gancho curto na primeira linha, contexto do mistério ' +
    '(sem spoiler), um CTA convidando a jogar/resolver (sem mencionar download), e hashtags ' +
    'relevantes (mínimo 5). Mencione o app "Tellery" no corpo da legenda. O objeto "socialCaption" ' +
    'tem dois campos: "caption" (texto completo, já com #hashtags embutidas ao final) e "hashtags" ' +
    '(lista apenas das tags sem a #, para uso programático).\n' +
    '13. Retorne APENAS um objeto JSON: ' +
    '{"styleNote": string, "shots": [{"timecode": string, "visual": string, "narration": string}], ' +
    '"socialCaption": {"caption": string, "hashtags": string[]}}.';

  const appName = 'Tellery';
  const user =
    'Escreva o roteiro do criativo publicitário para a história a seguir. ' +
    `O app se chama "${appName}" — use esse nome no CTA final quando fizer sentido. ` +
    'Apenas contexto sem spoiler.\n\n' +
    `Duração alvo: ${duration}s. Divida em shots com timecodes que somem exatamente ${duration}s, ` +
    'reservando os últimos 2-3s para o CTA final.\n\n' +
    `Título: ${context.title}\n` +
    (context.subtitle ? `Subtítulo: ${context.subtitle}\n` : '') +
    (context.teaser ? `Teaser: ${context.teaser}\n` : '') +
    '\nAbertura:\n' +
    (context.opening.shortText
      ? `- curta: ${context.opening.shortText}\n`
      : '') +
    (context.opening.fullText
      ? `- completa: ${context.opening.fullText}\n`
      : '') +
    (context.opening.callToAction
      ? `- chamada para ação: ${context.opening.callToAction}\n`
      : '') +
    (context.artDirection
      ? `\nDireção de arte (identidade visual global):\n${context.artDirection}\n`
      : '') +
    formatList(
      'Cenários',
      context.locations.map((l) => ({
        name: l.name,
        short: l.shortDescription,
        initial: l.initialDescription,
        image: l.imagePrompt,
      }))
    ) +
    formatList(
      'Objetos',
      context.objects.map((o) => ({
        name: o.name,
        short: o.shortDescription,
        initial: o.initialDescription,
        image: o.imagePrompt,
      }))
    ) +
    formatList(
      'Personagens',
      context.characters.map((c) => ({
        name: c.name,
        short: c.shortDescription,
        role: c.role,
        line: c.openingLine,
        image: c.imagePrompt,
      }))
    ) +
    (context.endings.length > 0
      ? '\nFinais (apenas títulos, sem spoilers):\n' +
        context.endings
          .map((e) => `- ${e.title}${e.type ? ` (${e.type})` : ''}`)
          .join('\n') +
        '\n'
      : '') +
    '\nRetorne o objeto JSON agora.';

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function formatList(
  title: string,
  items: Array<Record<string, string | null>>
): string {
  if (items.length === 0) return '';
  const body = items
    .map((item, index) => {
      const lines = Object.entries(item)
        .filter(([, value]) => value !== null && value !== '')
        .map(([key, value]) => `    - ${key}: ${value}`)
        .join('\n');
      return `  ${index + 1}. ${item.name ?? '?'}\n${lines}`;
    })
    .join('\n');
  return `\n${title}:\n${body}\n`;
}

function coerceVideoPrompt(raw: unknown): VideoPrompt {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(
      `LLM did not return an object: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }

  const obj = raw as {
    shots?: unknown;
    styleNote?: unknown;
    socialCaption?: unknown;
  };
  if (!Array.isArray(obj.shots) || obj.shots.length === 0) {
    throw new Error(
      `LLM response is missing a non-empty "shots" array: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }

  const shots: VideoShot[] = [];
  for (const [index, item] of obj.shots.entries()) {
    if (typeof item !== 'object' || item === null) {
      throw new Error(
        `LLM shot #${index + 1} is not an object: ${JSON.stringify(item).slice(0, 100)}`
      );
    }
    const shot = item as {
      timecode?: unknown;
      visual?: unknown;
      narration?: unknown;
    };
    if (
      typeof shot.timecode !== 'string' ||
      shot.timecode.trim().length === 0
    ) {
      throw new Error(
        `LLM shot #${index + 1} is missing "timecode": ${JSON.stringify(shot).slice(0, 100)}`
      );
    }
    if (typeof shot.visual !== 'string' || shot.visual.trim().length === 0) {
      throw new Error(
        `LLM shot #${index + 1} is missing "visual": ${JSON.stringify(shot).slice(0, 100)}`
      );
    }
    const narration =
      typeof shot.narration === 'string' && shot.narration.trim().length > 0
        ? shot.narration.trim()
        : undefined;
    shots.push({
      timecode: shot.timecode.trim(),
      visual: shot.visual.trim(),
      ...(narration ? { narration } : {}),
    });
  }

  const styleNote =
    typeof obj.styleNote === 'string' && obj.styleNote.trim().length > 0
      ? obj.styleNote.trim()
      : undefined;

  const socialCaption = coerceSocialCaption(obj.socialCaption);

  return {
    shots,
    socialCaption,
    ...(styleNote ? { styleNote } : {}),
  };
}

function coerceSocialCaption(raw: unknown): SocialCaption {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(
      `LLM response is missing a "socialCaption" object: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }

  const obj = raw as { caption?: unknown; hashtags?: unknown };
  if (typeof obj.caption !== 'string' || obj.caption.trim().length === 0) {
    throw new Error(
      `LLM "socialCaption.caption" is missing or empty: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }

  if (!Array.isArray(obj.hashtags) || obj.hashtags.length === 0) {
    throw new Error(
      `LLM "socialCaption.hashtags" is missing or empty: ${JSON.stringify(raw).slice(0, 200)}`
    );
  }

  const hashtags = obj.hashtags
    .filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0
    )
    .map((item) => item.trim());

  if (hashtags.length === 0) {
    throw new Error('LLM "socialCaption.hashtags" contains no valid tags.');
  }

  return { caption: obj.caption.trim(), hashtags };
}

/**
 * Serialize the shot list into a single text prompt for the Seedance
 * text-to-video endpoint (which takes one string). The shots are laid out
 * as a labeled sequence with timecodes so the model renders them in order
 * as a single continuous clip.
 */
function shotsToSeedancePrompt(prompt: VideoPrompt): string {
  const header = prompt.styleNote ? `${prompt.styleNote}\n\n` : '';
  const body = prompt.shots
    .map((shot) => {
      const narration = shot.narration
        ? ` Narração VO: "${shot.narration}".`
        : '';
      return `[${shot.timecode}] ${shot.visual}${narration}`;
    })
    .join('\n');
  return `${header}${body}`;
}

/**
 * Build the exact Seedance payload (shared by normal and --dry-run modes).
 * Includes reference image URLs when provided.
 */
export function buildSeedancePayload(
  prompt: VideoPrompt,
  config: GeneratorConfig,
  referenceImages: ReferenceImage[]
): { payload: SeedancePayload; generateOptions: GenerateOptions } {
  const referenceUrls = referenceImages.map((ref) => ref.url);
  const generateOptions: GenerateOptions = {
    prompt: shotsToSeedancePrompt(prompt),
    aspectRatio: config.aspectRatio,
    duration: config.duration,
    resolution: config.resolution,
    generateAudio: config.generateAudio,
    ...(referenceUrls.length > 0 ? { referenceImages: referenceUrls } : {}),
  };
  const client = new WavespeedClient(config.apiKey, config.model);
  return { payload: client.buildRequestBody(generateOptions), generateOptions };
}

/**
 * --dry-run: print + persist the payload, write manifest, do NOT call WaveSpeed.
 */
export function runDryRun(
  payload: SeedancePayload,
  slug: string,
  outputDir: string,
  referenceImages: ReferenceImage[],
  socialCaption: SocialCaption
): RunResult {
  fs.mkdirSync(outputDir, { recursive: true });
  const payloadPath = path.join(outputDir, `${slug}-seedance-payload.json`);
  fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('');
  console.log('[creative-video-generator] === SEEDANCE PAYLOAD (dry-run) ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('[creative-video-generator] ===========================');
  console.log(`[creative-video-generator] payload saved: ${payloadPath}`);
  console.log('');
  console.log('[creative-video-generator] === SOCIAL CAPTION (dry-run) ===');
  console.log(socialCaption.caption);
  console.log('');
  console.log(
    `[creative-video-generator] hashtags: ${socialCaption.hashtags.map((t) => `#${t}`).join(' ')}`
  );
  console.log('[creative-video-generator] ===============================');
  console.log(
    '[creative-video-generator] dry-run complete — WaveSpeed was NOT called.'
  );

  return {
    status: 'dry_run',
    videoPath: null,
    remoteUrl: null,
    inferenceTime: null,
    error: null,
    referenceImages,
  };
}

/**
 * Normal mode: call WaveSpeed, download the .mp4, return the result.
 */
export async function generateVideo(
  options: GenerateOptions,
  client: WavespeedClient,
  config: GeneratorConfig,
  slug: string,
  referenceImages: ReferenceImage[]
): Promise<RunResult> {
  const outputPath = path.join(
    config.outputDir,
    `${slug}.${OUTPUT_VIDEO_FORMAT}`
  );

  if (!config.force && fs.existsSync(outputPath)) {
    console.log(
      `[creative-video-generator] skipped (already exists): ${outputPath}`
    );
    return {
      status: 'generated',
      videoPath: outputPath,
      remoteUrl: null,
      inferenceTime: null,
      error: null,
      referenceImages,
    };
  }

  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    console.log(
      `[creative-video-generator] submitting to WaveSpeed Seedance ` +
        `(${config.aspectRatio}, ${config.duration}s, ${config.resolution})…`
    );
    const result = await client.generate(options);
    const remoteUrl = result.outputs[0];
    await download(remoteUrl, outputPath);
    console.log(
      `[creative-video-generator] saved ${outputPath}${formatInference(result)}`
    );
    return {
      status: 'generated',
      videoPath: outputPath,
      remoteUrl,
      inferenceTime: result.inferenceTime,
      error: null,
      referenceImages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[creative-video-generator] FAILED: ${message}`);
    return {
      status: 'failed',
      videoPath: null,
      remoteUrl: null,
      inferenceTime: null,
      error: message,
      referenceImages,
    };
  }
}

async function download(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download video (${response.status}) from ${url}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`    → ${(buffer.length / 1024 / 1024).toFixed(1)}MB downloaded`);
}

function formatInference(result: { inferenceTime: number | null }): string {
  return result.inferenceTime !== null ? ` (${result.inferenceTime}ms)` : '';
}

export function writeManifest(
  result: RunResult,
  payload: SeedancePayload,
  outputDir: string
): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const manifestPath = path.join(outputDir, 'manifest.json');
  const filePayload = {
    generatedAt: new Date().toISOString(),
    summary: { status: result.status },
    payload,
    result,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(filePayload, null, 2), 'utf8');
  console.log(`[creative-video-generator] manifest:  ${manifestPath}`);
}

export function summarizeByStatus(
  result: RunResult
): Record<RunStatus, number> {
  const zero: Record<RunStatus, number> = {
    generated: 0,
    dry_run: 0,
    failed: 0,
  };
  zero[result.status] += 1;
  return zero;
}
