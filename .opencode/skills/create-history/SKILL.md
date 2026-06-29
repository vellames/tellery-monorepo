---
name: create-history
description: End-to-end flow to author, audit, image-map, seed, and validate an interactive mystery history for the ai-history repo. Use when the user asks to create a new history/story/mock, generate an image map or image prompts, seed a history into the database, run the validator, or check a history JSON for consistency. Front-load triggers: "create history", "new story", "novo mock", "gerar imagens", "image map", "seedar", "validar história", "audit clues".
---

# Create & Validate a History

This skill walks the complete pipeline for an interactive mystery history in
the `ai-history` monorepo: author the JSON → audit consistency → create the
image-map → generate images → seed → validate with the LLM investigator.

Use the existing mocks (`mocks/o-bilhete-na-mesa-7.json`,
`mocks/o-relogio-parado.json`) as structural templates — copy their shape,
do not invent new top-level keys.

## Phase 1 — Author the history JSON

**File:** `mocks/<slug>.json` (slug = lowercase-hyphenated, e.g. `o-relogio-parado`)

Required top-level sections (see existing mocks for full shapes):

- `slug`, `title`, `subtitle`, `teaser`, `genre`, `language`, `estimatedDurationMinutes`
- `status` (`published`), `isFeatured`, `isFree` (booleans)
- `coverImageUrl`, `thumbnailUrl` — S3 keys, format `histories/<slug>/history/<file>.png`
- `opening` (`shortText`, `fullText`, `callToAction`)
- `objective` (`mainQuestion`, `description`)
- `intentDefinitions[]` — `id`, `description`, `examples[]`, `keywords[]`
- `characters[]` — each with `clueRevealRules[]`, `secrets[]` (with `revealStages[]`)
- `locations[]` — each with `ambientClueIds[]`, `objectIds[]`
- `objects[]` — each with `clueRevealRules[]`
- `clues[]` — `id`, `title`, `description`, `importance` (`required` | `supporting` | `red_herring`)
- `conclusion.fields[]` — `type` (`character` | `choice`), `options[]`
- `endings[]` — `type` (`full_truth` | `partial_truth` | `wrong_accusation`), `condition`
- `rules` — `minCluesBeforeConclusion`, `suggestConclusionAfterClues`, `maxRecommendedInteractions`

### Spoiler-free descriptions (CRITICAL)

Player-facing description fields must describe **what the player sees** (appearance, atmosphere), NEVER **what it means** (conclusions, clues, secrets). Clues belong exclusively in `clueRevealRules` and secret `revealStages`. If a description reveals what an investigation should uncover, the mystery is broken.

**Fields that the player sees and must be spoiler-free:**

| Field | Rule |
| --- | --- |
| `teaser`, `subtitle` | Set the mood; do NOT reveal the twist, the culprit's nature, or structural hints |
| `opening.shortText`, `opening.fullText` | Describe the scene and the crime; list characters by their facade only ("um empresário"), never by their secret ("um empresário que não sabe explicar o que faz") |
| `opening.callToAction` | Tell the player what to investigate; do NOT hint at what they'll discover |
| `objective.description` | State the goal; remove parenthetical hints about the mystery's nature |
| `characters[].shortDescription` | Describe the visible facade only. Do NOT hint the facade is fake, reveal guilt, or describe secrets |
| `characters[].openingLine` | Can show personality; must NOT state secrets or clues outright |
| `objects[].shortDescription` | Describe what the object IS, not what it PROVES |
| `objects[].initialDescription` | Describe visual appearance ONLY. No interpretations ("a rachadura indica força"), no conclusions ("sem sinal de uso indevido"), no pre-revealing what examination would find |
| `locations[].shortDescription` | Brief factual description of the place |
| `locations[].initialDescription` | Atmosphere and decor; do NOT highlight specific evidence in the scene description |

**Examples of what to fix:**

| Bad (spoils clue) | Good (spoiler-free) |
| --- | --- |
| "jornalista que nunca publicou um artigo" | "que se apresenta como jornalista" |
| "o painel está torto, com marcas de dedos recentes" | "um painel de manutenção na parede" |
| "a tinta ainda está úmida" | (remove — this is a clueRevealRule discovery) |
| "talvez descubra que ninguém é quem diz ser" | (remove — structural hint) |
| "ferramentas sem sinal de uso indevido" | "ferramentas de precisão na bancada" |
| "cinco identidades falsas" | "cinco passageiros no mesmo vagão" |

**Fields that are safe to include detail** (not player-facing or only shown post-resolution):
- `personality`, `speakingStyle` — used by the LLM character model, not shown directly
- `publicKnowledge`, `privateKnowledge` — internal context for the character model
- `conversationBoundaries` — internal guardrails
- `clueRevealRules`, `secrets`, `revealStages` — the actual clue mechanics
- `endings[].summary`, `endings[].epilogue` — shown only AFTER the player finishes

### Image key conventions (S3 paths)

All `imageUrl` fields use relative S3 keys (NOT URLs). Match the section name
exactly as the existing mocks do — note the mixed singular/plural:

| Section in JSON field | S3 path segment                                   |
| --------------------- | ------------------------------------------------- |
| cover / thumbnail     | `histories/<slug>/history/<file>.jpg`             |
| location `imageUrl`   | `histories/<slug>/location/<file>.jpg` (singular) |
| object `imageUrl`     | `histories/<slug>/object/<file>.jpg` (singular)   |
| character `imageUrl`  | `histories/<slug>/characters/<file>.jpg` (plural) |
| ending `imageUrl`     | `histories/<slug>/endings/<file>.jpg` (plural)    |

### Clue reveal mechanics

Two distinct mechanisms reveal clues — do not confuse them:

1. **`clueRevealRules`** (on characters, locations, objects): the **`clueId` at the top of the rule** is the clue that rule reveals. `requiresClueIds` gates it behind prior clues. `triggerIntents` lists which intents unlock it. **Objects should NOT use `requiresClueIds`** — object clues should always be discoverable on first inspection (no prerequisites), to avoid frustrating dead-end inspections. Characters and secret stages may use `requiresClueIds` freely.
2. **Secret `revealStages`** (on character secrets): stages use **`revealsClueIds`** (an array) to reveal clues. `requiresClueIds` gates the stage. Stages have `level` (0+), `behavior`, `allowedToRevealTruth`, `sampleResponses`.

The `defaultStrategy` (`deny` | `avoid` | `deflect` | `cover_story` | `justify`)
covers the implicit level-0 behavior. Explicit `revealStages` may start at
level 0 (explicit deny, like Clara in the bilhete mock) or level 1 (if the
default strategy already covers denial, like Rafa/Davi/Bia). Either is valid.

### Secret stage chain (best practice)

Build the guilty character's confession as a progressive chain. Example
pattern (from `o-relogio-parado` Bia, 5 stages):

- **L0** (implicit via `deny`): deny everything
- **L1**: admit proximity to the scene / knowledge of access (`requiresClueIds`: scene evidence)
- **L2**: admit motive pressure (`requiresClueIds`: L1 clue + motive hint)
- **L3**: partial confession (`requiresClueIds`: L2 clue + physical evidence)
- **L4**: full confession + whereabouts (`allowedToRevealTruth: true`)

Each stage should `requiresClueIds` at least one clue from the previous stage
or an external clue — never leave a post-L0 stage with empty `requiresClueIds`.

### Narrative arc (começo → meio → fim)

Structure clues in dependency layers:

- **Começo (entry, no prerequisites):** scene-setting clues from the owner/NPC and ambient objects. Establishes what happened and rules out obvious alternatives.
- **Meio (1 level deep):** clues that depend on entry clues — opens suspect lines, motive hints, red herrings.
- **Fim (deep chain):** the confession chain. Each clue requires the previous. The last clues unlock the `full_truth` ending.

### Red herrings

Every honest red herring needs an alibi or exculpatory clue reachable early.
The validator's LLM will check and discard it — if there's no alibi, the
investigator may mis-accuse. Mark the red-herring clue with `importance: "red_herring"`.

## Phase 2 — Audit consistency

Run the audit script bundled with this skill. It checks:

- All referenced `clueId` / `requiresClueIds` / `revealsClueIds` exist in `clues[]`
- All `triggerIntents` exist in `intentDefinitions[]`
- No orphan clues (declared but never revealed by any character/object/secret)
- All clues reachable from zero prerequisites (no circular or broken chains)
- All ending `requiresClueIds` are reachable
- Secret stages form a progressive chain (post-L0 stages have `requiresClueIds`)

**Run:**

```sh
node .opencode/skills/create-history/audit.js mocks/<slug>.json
```

Expected output: `OK — nenhuma inconsistência.` and `<all>/<all> pistas alcançáveis`.
Fix every reported issue before proceeding.

## Phase 3 — Create the image-map

**File:** `mocks/<slug>-images-map.json`

Structure (mirror `mocks/o-bilhete-na-mesa-7-images-map.json`):

```json
{
  "master": { "prompt": "global art direction for THIS story's setting..." },
  "history": { "cover": { "aspectRatio": "16:9", "prompt": "..." }, "thumbnail": { "aspectRatio": "1:1", "prompt": "..." } },
  "location": { "<id>": { "aspectRatio": "16:9", "prompt": "..." } },
  "object": { "<id>": { "aspectRatio": "1:1"|"4:3", "prompt": "..." } },
  "characters": { "<id>": { "aspectRatio": "4:5", "prompt": "..." } },
  "endings": { "<id>": { "aspectRatio": "16:9", "prompt": "..." } }
}
```

### Aspect ratios

| Section               | Ratio | Notes                                             |
| --------------------- | ----- | ------------------------------------------------- |
| history/cover         | 16:9  | hero card, leave negative space for title overlay |
| history/thumbnail     | 1:1   | close-up focal object, readable at small size     |
| location              | 16:9  | establishing shot                                 |
| object (central clue) | 4:3   | needs space for legible detail                    |
| object (secondary)    | 1:1   |                                                   |
| characters            | 4:5   | portrait                                          |
| endings               | 16:9  | cinematic                                         |

### Art direction rules

- **Give each story its own palette** (don't reuse another story's colors). Example: bilhete = burgundy/amber; relógio = moss-green/aged-brass/mahogany.
- **Master prompt** defines setting identity, palette (with hex codes), lighting, style, recurring motifs, and negatives to avoid.
- Prompts are in English. No text overlays/logos/watermarks. Handwritten phrases on in-world paper are OK if they appear as natural handwriting.
- Every prompt should reference the visual clues that matter for that asset.
- `coverImageUrl` / `thumbnailUrl` / `imageUrl` in the history JSON must match the `<slug>` and section names used here.

### Validate coverage

Every `imageUrl` referenced in `<slug>.json` must have a matching prompt in
the image-map. Run a quick check:

```sh
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('mocks/<slug>-images-map.json'));const h=JSON.parse(fs.readFileSync('mocks/<slug>.json'));const exp=[];h.locations.forEach(l=>exp.push(['location',l.imageUrl]));h.objects.forEach(o=>exp.push(['object',o.imageUrl]));h.characters.forEach(c=>exp.push(['characters',c.imageUrl]));h.endings.forEach(e=>exp.push(['endings',e.imageUrl]));exp.push(['history',h.coverImageUrl]);exp.push(['history',h.thumbnailUrl]);const miss=exp.filter(([s,p])=>{const n=p.split('/').pop().replace(/\.\w+$/,'');return !m[s]||!m[s][n];});console.log(miss.length?'MISSING: '+JSON.stringify(miss):'OK: all '+exp.length+' assets covered');"
```

## Phase 4 — Generate images

The image-generator derives the slug from the input filename (strips
`-images-map` suffix) and outputs to `output/<slug>/`.

**IMPORTANT:** npm workspace runs with CWD = `apps/image-generator/`, so pass
the **absolute path** to the input file (relative paths from the repo root
will not be found).

```sh
npm start -w @ai-history/image-generator -- "$(pwd)/mocks/<slug>-images-map.json"
```

Options: `--resolution 1k` (default), `--concurrency 3`, `--force` (regenerate
existing), `--no-prefix-master`. Requires `WAVESPEED_API_KEY` in `.env`.

Output: `output/<slug>/{history,location,object,characters,endings}/*.png` +
`manifest.json`. (Note: this lands under `apps/image-generator/output/` because
of the workspace CWD — that's a known limitation.)

## Phase 5 — Seed into the database

1. Add the filename to the `historyFiles` array in `apps/api/src/seed.ts`.
2. Build + seed:

```sh
npm run build -w @ai-history/api && npm run db:seed -w @ai-history/api
```

The seed is **silent on create** (only logs "already seeded" for updates).

**IMPORTANT:** `db:seed` only updates `status`, `isFeatured`, `isFree`, and image URLs for
existing histories — it does NOT update descriptions, clue reveal rules, or secret stages.
If you changed any of those fields on an already-seeded history, use `db:reseed` instead:

```sh
npm run build -w @ai-history/api && npm run db:reseed -w @ai-history/api
```

`db:reseed` deletes and recreates every history from scratch (cascade), ensuring all fields
are updated.
Verify the row landed:

```sh
docker exec ai-history-postgres-1 psql -U postgres -d ai_history -t -c \
  "SELECT slug, \"isFeatured\", \"isFree\", status FROM \"History\" WHERE slug='<slug>';"
```

And count related records (should match the JSON):

```sh
docker exec ai-history-postgres-1 psql -U postgres -d ai_history -t -c \
  "SELECT 'chars', COUNT(*) FROM \"CharacterDefinition\" WHERE \"historyId\"=(SELECT id FROM \"History\" WHERE slug='<slug>')
   UNION ALL SELECT 'clues', COUNT(*) FROM \"ClueDefinition\" WHERE \"historyId\"=(SELECT id FROM \"History\" WHERE slug='<slug>')
   UNION ALL SELECT 'endings', COUNT(*) FROM \"EndingDefinition\" WHERE \"historyId\"=(SELECT id FROM \"History\" WHERE slug='<slug>');"
```

## Phase 6 — Validate with the LLM investigator

Requires (in `.env`): `VALIDATOR_EMAIL`, `VALIDATOR_PASSWORD`, `OPENROUTER_API_KEY`.
Set `VALIDATOR_HISTORY_SLUG=<slug>` in `.env` (default is the bilhete).

```sh
npm start -w @ai-history/validator
```

The validator logs in, starts a session, runs an LLM investigator (default
`deepseek/deepseek-v4-pro`) for up to 50 turns, and writes a report.

**Success criteria:**

- All clues discovered (`<n>/<n> clues`)
- `stopReason: investigator decided to stop` (resolved) — NOT hitting `maxIterations`
- Every entity shows `<n>/<n>` in the ENTITY PROGRESS section

Report lands at `apps/validator/validator-output.txt`.

If the investigator gets stuck or mis-accuses, the problem is usually:

- A clue unreachable (re-run the audit)
- A secret stage with missing/too-strict `requiresClueIds` (the LLM can't unlock the confession)
- A red herring without an exculpatory alibi clue (LLM accuses the wrong person)

## Commit conventions

- Lowercase, imperative, one line (e.g. `add o relogio parado mock history`).
- Split into focused commits: one for the history JSON, one for the image-map,
  one for seed/config changes.
- **Never commit `.env`** (it's gitignored and holds secrets). Only `.env.example`
  is commitable, with empty values for secrets.
- `output/` is gitignored — generated images are not committed.
