import fs from 'fs';
import path from 'path';
import { buildReferenceKey, S3ReferenceUploader } from './s3-client';
import { ReferenceImage } from './types';

/**
 * Seedance accepts up to 9 reference images. We reserve slots for the cover
 * and the brand logo, leaving room for character portraits.
 */
const MAX_REFERENCE_IMAGES = 9;
const RESERVED_SLOTS = 2; // cover + logo
const MAX_CHARACTERS = MAX_REFERENCE_IMAGES - RESERVED_SLOTS;
const COVER_CATEGORY = 'history';
const COVER_KEY = 'cover';
const CHARACTERS_CATEGORY = 'characters';
const MANIFEST_FILENAME = 'manifest.json';

/**
 * The Tellery brand logo, shipped in this app's assets/ directory.
 * Always sent as the last reference image so Seedance can reproduce it
 * (or a stylized take on it) in the final CTA card.
 */
const LOGO_CATEGORY = 'brand';
const LOGO_KEY = 'tellery-logo';
const LOGO_FILENAME = 'tellery-logo.png';
const LOGO_LOCAL_PATH = path.resolve(__dirname, '..', 'assets', LOGO_FILENAME);

interface ImageGeneratorManifestEntry {
  category: string;
  key: string;
  outputPath: string;
  status: string;
}

/**
 * An entry is usable when the image file exists on disk. The image-generator
 * marks entries as 'generated' (newly created) or 'skipped' (already existed)
 * — both mean the file is available. Only 'failed' entries are unusable.
 */
function isUsable(entry: ImageGeneratorManifestEntry): boolean {
  return entry.status === 'generated' || entry.status === 'skipped';
}

interface ImageGeneratorManifest {
  results?: ImageGeneratorManifestEntry[];
}

interface DiscoveredReference {
  category: string;
  key: string;
  localPath: string;
}

/**
 * Discover cover + character portraits from the image-generator manifest.
 *
 * The manifest lives at <imagesDir>/<slug>/manifest.json and its outputPath
 * values are relative to apps/image-generator/ — so we resolve them against
 * imagesDir's parent (the image-generator root).
 */
export function discoverReferenceImages(
  slug: string,
  imagesDir: string
): DiscoveredReference[] {
  const manifestPath = path.join(imagesDir, slug, MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Image-generator manifest not found: ${manifestPath}. ` +
        'Run the image-generator for this history first, or pass --no-reference-images.'
    );
  }

  const manifest = readManifest(manifestPath);
  const entries = manifest.results ?? [];

  // image-generator writes outputPath relative to its own root (e.g.
  // "output/<slug>/characters/aurora.jpg"). imagesDir is the output dir itself,
  // so we strip the leading "output/" segment and resolve against imagesDir.
  const resolveLocal = (outputPath: string): string => {
    const normalized = outputPath.replace(/^output\//, '');
    return path.join(imagesDir, normalized);
  };

  const selected: DiscoveredReference[] = [];

  const coverEntry = entries.find(
    (entry) =>
      entry.category === COVER_CATEGORY &&
      entry.key === COVER_KEY &&
      isUsable(entry)
  );
  if (coverEntry) {
    selected.push({
      category: coverEntry.category,
      key: coverEntry.key,
      localPath: resolveLocal(coverEntry.outputPath),
    });
  }

  const characterEntries = entries.filter(
    (entry) =>
      entry.category === CHARACTERS_CATEGORY &&
      isUsable(entry) &&
      // avoid duplicating an entry already picked as cover (defensive)
      !selected.some(
        (s) => s.category === entry.category && s.key === entry.key
      )
  );

  if (characterEntries.length > MAX_CHARACTERS) {
    console.warn(
      `[creative-video-generator] found ${characterEntries.length} character portraits, ` +
        `but Seedance allows at most ${MAX_CHARACTERS} (cover + logo + ${MAX_CHARACTERS} = ${MAX_REFERENCE_IMAGES}). ` +
        `Using the first ${MAX_CHARACTERS}.`
    );
  }

  for (const entry of characterEntries.slice(0, MAX_CHARACTERS)) {
    selected.push({
      category: entry.category,
      key: entry.key,
      localPath: resolveLocal(entry.outputPath),
    });
  }

  // Always append the brand logo as the last reference image.
  if (!fs.existsSync(LOGO_LOCAL_PATH)) {
    throw new Error(
      `Brand logo not found at ${LOGO_LOCAL_PATH}. Add it to apps/creative-video-generator/assets/${LOGO_FILENAME}, ` +
        'or pass --no-reference-images.'
    );
  }
  selected.push({
    category: LOGO_CATEGORY,
    key: LOGO_KEY,
    localPath: LOGO_LOCAL_PATH,
  });

  if (selected.length === 0) {
    throw new Error(
      `No usable reference images (cover + characters) found in manifest: ${manifestPath}. ` +
        'Generate images first, or pass --no-reference-images.'
    );
  }

  if (!coverEntry) {
    console.warn(
      '[creative-video-generator] cover image not found in manifest — using character portraits only.'
    );
  }

  return selected;
}

function readManifest(manifestPath: string): ImageGeneratorManifest {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Image-generator manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(
      `Image-generator manifest must be an object: ${manifestPath}`
    );
  }

  return parsed as ImageGeneratorManifest;
}

/**
 * Discover, upload and presign the reference images. Returns the full
 * ReferenceImage[] (with presigned GET URLs) for the Seedance payload.
 */
export async function prepareReferenceImages(
  slug: string,
  imagesDir: string,
  uploader: S3ReferenceUploader
): Promise<ReferenceImage[]> {
  const discovered = discoverReferenceImages(slug, imagesDir);

  console.log(
    `[creative-video-generator] uploading ${discovered.length} reference image(s) to S3…`
  );

  const uploads = discovered.map((item) => ({
    localPath: item.localPath,
    s3Key: buildReferenceKey(slug, item.category, item.key),
  }));

  const uploaded = await uploader.uploadAndSign(uploads);

  const references: ReferenceImage[] = discovered.map((item, index) => ({
    category: item.category,
    key: item.key,
    localPath: item.localPath,
    s3Key: uploaded[index].s3Key,
    url: uploaded[index].url,
  }));

  for (const ref of references) {
    console.log(
      `    → uploaded ${ref.category}/${ref.key}.jpg (${truncateUrl(ref.url)})`
    );
  }

  return references;
}

function truncateUrl(url: string): string {
  return url.length > 64 ? `${url.slice(0, 61)}...` : url;
}
