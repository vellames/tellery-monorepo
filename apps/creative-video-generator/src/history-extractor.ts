import fs from 'fs';
import {
  CharacterEntry,
  EndingEntry,
  HistoryFile,
  ImageMapFile,
  LocationEntry,
  ObjectEntry,
  SpoilerFreeContext,
} from './types';

export function readJson<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed as T;
}

/**
 * Build a spoiler-free context for the LLM from the history mock + image map.
 *
 * Only player-facing fields are pulled. Spoiler-bearing fields
 * (secrets, clue descriptions, endings summaries/epilogues, privateKnowledge)
 * are never read — see the spoiler-free rule in create-history/SKILL.md.
 */
export function extractContext(
  history: HistoryFile,
  imageMap: ImageMapFile | null,
  prefixMaster: boolean
): SpoilerFreeContext {
  const locationImage = imageMap?.location ?? {};
  const objectImage = imageMap?.object ?? {};
  const characterImage = imageMap?.characters ?? {};

  const artDirection = prefixMaster ? (imageMap?.master?.prompt ?? null) : null;

  return {
    title: history.title ?? history.slug ?? 'Untitled story',
    subtitle: history.subtitle ?? null,
    teaser: history.teaser ?? null,
    opening: {
      shortText: history.opening?.shortText ?? null,
      fullText: history.opening?.fullText ?? null,
      callToAction: history.opening?.callToAction ?? null,
    },
    artDirection,
    locations: (history.locations ?? []).map((entry) =>
      toLocationContext(entry, locationImage)
    ),
    objects: (history.objects ?? []).map((entry) =>
      toObjectContext(entry, objectImage)
    ),
    characters: (history.characters ?? []).map((entry) =>
      toCharacterContext(entry, characterImage)
    ),
    endings: (history.endings ?? []).map((entry) => toEndingContext(entry)),
  };
}

function toLocationContext(
  entry: LocationEntry,
  imageMap: Record<string, { prompt: string }>
): SpoilerFreeContext['locations'][number] {
  const id = entry.id ?? '';
  return {
    name: entry.name ?? id,
    shortDescription: entry.shortDescription ?? null,
    initialDescription: entry.initialDescription ?? null,
    imagePrompt: lookupImagePrompt(imageMap, id),
  };
}

function toObjectContext(
  entry: ObjectEntry,
  imageMap: Record<string, { prompt: string }>
): SpoilerFreeContext['objects'][number] {
  const id = entry.id ?? '';
  return {
    name: entry.name ?? id,
    shortDescription: entry.shortDescription ?? null,
    initialDescription: entry.initialDescription ?? null,
    imagePrompt: lookupImagePrompt(imageMap, id),
  };
}

function toCharacterContext(
  entry: CharacterEntry,
  imageMap: Record<string, { prompt: string }>
): SpoilerFreeContext['characters'][number] {
  const id = entry.id ?? '';
  return {
    name: entry.name ?? id,
    role: entry.role ?? null,
    shortDescription: entry.shortDescription ?? null,
    openingLine: entry.openingLine ?? null,
    imagePrompt: lookupImagePrompt(imageMap, id),
  };
}

function toEndingContext(
  entry: EndingEntry
): SpoilerFreeContext['endings'][number] {
  return {
    title: entry.title ?? entry.id ?? '',
    type: entry.type ?? null,
  };
}

function lookupImagePrompt(
  imageMap: Record<string, { prompt: string }>,
  id: string
): string | null {
  if (!id) return null;
  return imageMap[id]?.prompt ?? null;
}
