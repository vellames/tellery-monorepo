/**
 * Input: full history mock JSON.
 *
 * Only the player-facing fields are declared here. Spoiler-bearing fields
 * (secrets, clue descriptions, endings summaries/epilogues, privateKnowledge)
 * are intentionally absent so the extractor cannot leak them into a marketing
 * creative — see the spoiler-free rule in .zcode/skills/create-history/SKILL.md.
 */
export interface HistoryFile {
  slug?: string;
  title?: string;
  subtitle?: string;
  teaser?: string;
  opening?: {
    shortText?: string;
    fullText?: string;
    callToAction?: string;
  };
  locations?: LocationEntry[];
  objects?: ObjectEntry[];
  characters?: CharacterEntry[];
  endings?: EndingEntry[];
}

export interface LocationEntry {
  id?: string;
  name?: string;
  shortDescription?: string;
  initialDescription?: string;
}

export interface ObjectEntry {
  id?: string;
  name?: string;
  shortDescription?: string;
  initialDescription?: string;
}

export interface CharacterEntry {
  id?: string;
  name?: string;
  role?: string;
  shortDescription?: string;
  openingLine?: string;
}

export interface EndingEntry {
  id?: string;
  title?: string;
  type?: string;
}

/**
 * Input: image-map JSON (mocks/<slug>-images-map.json).
 * Mirrors apps/image-generator/src/types.ts HistorySpecFile.
 */
export interface ImageSpec {
  prompt: string;
  aspectRatio?: string;
}

export interface ImageMapFile {
  master?: ImageSpec;
  history?: Record<string, ImageSpec>;
  location?: Record<string, ImageSpec>;
  object?: Record<string, ImageSpec>;
  characters?: Record<string, ImageSpec>;
  endings?: Record<string, ImageSpec>;
}

/**
 * Spoiler-free context assembled for the LLM.
 */
export interface SpoilerFreeContext {
  title: string;
  subtitle: string | null;
  teaser: string | null;
  opening: {
    shortText: string | null;
    fullText: string | null;
    callToAction: string | null;
  };
  artDirection: string | null;
  locations: Array<{
    name: string;
    shortDescription: string | null;
    initialDescription: string | null;
    imagePrompt: string | null;
  }>;
  objects: Array<{
    name: string;
    shortDescription: string | null;
    initialDescription: string | null;
    imagePrompt: string | null;
  }>;
  characters: Array<{
    name: string;
    role: string | null;
    shortDescription: string | null;
    openingLine: string | null;
    imagePrompt: string | null;
  }>;
  endings: Array<{ title: string; type: string | null }>;
}

/**
 * Output: structured video prompt produced by the LLM.
 * Persisted to <output>/<slug>-video-prompt.json for the iterate-by-hand loop.
 *
 * Structured as an ordered list of shots covering the full clip duration
 * (default 15s). Each shot has an explicit timecode, a visual description
 * (fed to Seedance), and an optional narration line (for voiceover in
 * post-production — Seedance's native audio is ambient/SFX, not narration).
 * `socialCaption` is a ready-to-post caption for TikTok/Instagram.
 */
export interface VideoPrompt {
  shots: VideoShot[];
  socialCaption: SocialCaption;
  styleNote?: string;
}

/**
 * Ready-to-post caption for TikTok / Instagram Reels.
 * `caption` is the body text (with hook, hashtags, and CTA);
 * `hashtags` is the bare list (without #) for programmatic use.
 */
export interface SocialCaption {
  caption: string;
  hashtags: string[];
}

export interface VideoShot {
  /** Time span inside the clip, e.g. "0-3s". Must sum to the clip duration. */
  timecode: string;
  /** Self-contained visual prompt for this shot (camera, subject, lighting, motion). */
  visual: string;
  /** Optional voiceover line for this shot (post-production TTS/VO). */
  narration?: string;
}

/**
 * A local image from the image-generator output that has been uploaded to S3
 * and presigned for use as a Seedance reference.
 */
export interface ReferenceImage {
  category: string;
  key: string;
  localPath: string;
  s3Key: string;
  url: string;
}

/**
 * WaveSpeed Seedance generation options.
 */
export interface GenerateOptions {
  prompt: string;
  aspectRatio: string;
  duration: number;
  resolution: string;
  generateAudio: boolean;
  referenceImages?: string[];
}

export interface GenerateResult {
  outputs: string[];
  inferenceTime: number | null;
}

/**
 * The exact payload that would be POSTed to WaveSpeed. Used both by the real
 * generation and by --dry-run (which stops before sending).
 */
export interface SeedancePayload {
  model: string;
  prompt: string;
  aspect_ratio: string;
  duration: number;
  resolution: string;
  generate_audio: boolean;
  reference_images?: string[];
}

export type RunStatus = 'generated' | 'dry_run' | 'failed';

export interface RunResult {
  status: RunStatus;
  videoPath: string | null;
  remoteUrl: string | null;
  inferenceTime: number | null;
  error: string | null;
  referenceImages: ReferenceImage[];
}
