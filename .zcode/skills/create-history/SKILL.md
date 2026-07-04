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

| Field                                   | Rule                                                                                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teaser`, `subtitle`                    | Set the mood; do NOT reveal the twist, the culprit's nature, or structural hints                                                                                             |
| `opening.shortText`, `opening.fullText` | Describe the scene and the crime; list characters by their facade only ("um empresário"), never by their secret ("um empresário que não sabe explicar o que faz")            |
| `opening.callToAction`                  | Tell the player what to investigate; do NOT hint at what they'll discover                                                                                                    |
| `objective.description`                 | State the goal; remove parenthetical hints about the mystery's nature                                                                                                        |
| `characters[].shortDescription`         | Describe the visible facade only. Do NOT hint the facade is fake, reveal guilt, or describe secrets                                                                          |
| `characters[].openingLine`              | Can show personality; must NOT state secrets or clues outright                                                                                                               |
| `objects[].shortDescription`            | Describe what the object IS, not what it PROVES                                                                                                                              |
| `objects[].initialDescription`          | Describe visual appearance ONLY. No interpretations ("a rachadura indica força"), no conclusions ("sem sinal de uso indevido"), no pre-revealing what examination would find |
| `locations[].shortDescription`          | Brief factual description of the place                                                                                                                                       |
| `locations[].initialDescription`        | Atmosphere and decor; do NOT highlight specific evidence in the scene description                                                                                            |

**Examples of what to fix:**

| Bad (spoils clue)                                   | Good (spoiler-free)                           |
| --------------------------------------------------- | --------------------------------------------- |
| "jornalista que nunca publicou um artigo"           | "que se apresenta como jornalista"            |
| "o painel está torto, com marcas de dedos recentes" | "um painel de manutenção na parede"           |
| "a tinta ainda está úmida"                          | (remove — this is a clueRevealRule discovery) |
| "talvez descubra que ninguém é quem diz ser"        | (remove — structural hint)                    |
| "ferramentas sem sinal de uso indevido"             | "ferramentas de precisão na bancada"          |
| "cinco identidades falsas"                          | "cinco passageiros no mesmo vagão"            |

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

### Intent design — optimize for experience, not difficulty

`intentDefinitions` and the `triggerIntents` on rules/stages decide whether a
player's natural phrasing unlocks a clue. The goal is a **smooth investigation
that feels fair**, not a hard puzzle. Tune for **moderate** difficulty — never
too easy, never too hard.

**Too specific is the main trap.** An intent like `ask_beatriz_about_medication_swap_on_thursday`
will only fire on a near-exact phrasing, so the player asks the right question
and gets nothing back — that reads as a bug, not a mystery. Prefer broad,
conversational intents (`ask_about_medication`, `ask_about_motive`,
`ask_about_alibi`) that match many phrasings of the same idea.

| Bad (too specific)                          | Good (broad, natural)  |
| ------------------------------------------- | ---------------------- |
| `ask_if_lucia_poisoned_the_champagne_glass` | `ask_about_poison`     |
| `ask_beatriz_why_she_swapped_pills_at_22h`  | `ask_about_motive`     |
| `ask_where_rafael_was_at_midnight_exactly`  | `ask_about_alibi`      |
| `press_lucia_stage_3_botic_access`          | `press_for_confession` |

**Concrete rules of thumb:**

- **Keep intent count moderate** (~8–12 for a 16-clue story, ~15–22 for a 30-clue
  story). Most are reusable `ask_about_<topic>` + one `accuse_<character>` per
  real suspect, plus the universal `inspect_object` / `press_for_confession` /
  `off_topic`.
- **Write 4–6 `keywords` per intent** using the everyday words a player would
  actually say (`veneno`, `morte`, `brinde`, `álibi`), not investigator jargon.
  Keyword matches force `confidence = 1.0`, so good keywords are the most
  reliable way to make a clue reachable.
- **Reuse the same intent across many `triggerIntents`.** A single
  `ask_about_motive` can gate motive-flavored rules on several characters —
  that's how the player "asks about motive" anywhere and gets relevant reveals.
- **Never create an intent whose only purpose is to gate exactly one rule with
  a niche phrasing.** If a clue needs that, broaden the intent or fold it into
  an existing topic intent.
- **Validate by reading the `intents:` line during Phase 6.** If the
  investigator is asking the right question but the clue still won't unlock,
  the intent is too specific — broaden its `keywords`/`examples`, or re-point
  the rule's `triggerIntents` at a broader intent.

The player should never feel they have to guess the developer's exact wording.
When in doubt, make the intent broader.

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
node .zcode/skills/create-history/scripts/audit.js mocks/<slug>.json
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

### Character diversity (CRITICAL)

Without explicit guidance, the image model converges on a single default
archetype and every portrait comes out looking the same. **You MUST make the
cast visibly distinct** — different skin tones, ages, builds, hair, and facial
features. A cast that is all the same ethnicity/skin tone breaks immersion and
feels generic.

- **Specify ethnicity/skin tone explicitly in every character prompt.** State it
  plainly: "a young White woman with fair skin and freckles", "a middle-aged
  Afro-Brazilian man with dark brown skin", "a Mestizo Mexican woman with warm
  tan skin", etc. Do NOT default to a vague nationality ("a Mexican man") — that
  is what causes the convergence.
- **Vary the cast.** If the story has 3+ characters, the cast should visibly span
  a range (e.g. White, Pardo/mixed, Black), matching what's plausible for the
  setting. Mexican settings are overwhelmingly Mestizo but realistically include
  Indigenous, White, and Afro-Mexican people — reflect that range. Brazilian
  settings are multiethnic by default.
- **Differentiate beyond skin tone too**: age, build, hair color/texture, facial
  features, facial hair, scars, glasses. No two characters should read as the
  same "person in different clothes".
- **Bad vs good character prompt openers:**

  | Bad (converges)                 | Good (explicitly distinct)                                                                        |
  | ------------------------------- | ------------------------------------------------------------------------------------------------- |
  | "a Mexican man in his thirties" | "a Mestizo Mexican man in his early thirties, warm tan skin, sharp jawline, wavy dark brown hair" |
  | "an elegant woman"              | "an Afro-Mexican woman, deep brown skin, natural coily hair pulled back"                          |
  | "an older man, grey hair"       | "a White older man, ruddy fair skin, receding steel-grey hair, thick grey beard"                  |

- When you write the whole cast, read all character prompts together and check
  they describe visibly _different_ people — not the same default face in
  different outfits.

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

### Uploading to S3 is NOT part of this skill

**Do NOT upload the generated images to S3.** The `coverImageUrl` /
`thumbnailUrl` / `imageUrl` fields in the history JSON store S3 _keys_
(`histories/<slug>/...`) only as references — the actual upload is handled
separately, out of band, and is not a step in this pipeline. Generating the
images locally and committing the JSON + image-map is enough; seeding and
validating work with the keys alone.

## Phase 5 — Seed into the database

> ## 🚨 GATE RULE — LOCAL ONLY BY DEFAULT
>
> **The seed commands below target the LOCAL database** (`localhost:5555` via
> `DATABASE_URL`). **NEVER seed production unless the user has EXPLICITLY
> requested a production seed in the CURRENT conversation.** To seed prod,
> the user must invoke the `seed-production-db` skill, which requires its
> own explicit confirmation. Running these commands against prod by swapping
> env vars / `DATABASE_URL` is forbidden. Default to local; surface the
> prod path and let the user drive it.

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

**Pass the slug via CLI args** — do NOT edit `VALIDATOR_HISTORY_SLUG` in `.env`.
The validator resolves config with precedence **CLI arg > env > default**, so
multiple histories can be validated in parallel without touching `.env`, and
each run writes to its own report file (`validator-output-<slug>.txt`) instead
of overwriting a shared one.

```sh
npm start -w @ai-history/validator -- --slug <slug>
```

### Watch the run live (REQUIRED)

**The user wants to follow the investigation as it unfolds — do NOT just fire the
validator and report the final result.** Run it in the background with a long
timeout (the run can take 10–15 min for a 30-clue history) and tail the output
log in a loop so the user sees each turn in real time.

Pattern:

```sh
# 1. launch in background (timeout ~900000ms = 15 min for a full run)
npm start -w @ai-history/validator -- --slug <slug>   # run_in_background: true, timeout: 900000

# 2. wait, then tail — repeat every ~90–150s until the run finishes
sleep 90 && tail -40 <stdout-log-path>
```

Each turn prints, in order:

```
[turn N] -> <type> / <entity name>
  reasoning: <why the investigator chose this>
  sent:      <utterance sent to the entity>
  intents:   <intentId> (<confidence>), ...   # only for character turns
  reply:     <character's in-character response>   # only for character turns
  discovered: <clue title>, <clue title>           # when new clues unlock
  progress:  <N> clues discovered so far
```

Keep tailing and surfacing progress to the user (e.g. "turn 12, 14/30 clues,
just unlocked the Sofía half-sister twist") until the run ends with either
`[validator] done — <n> clues in <t> turns (investigator decided to stop)`
(success) or `max iterations` / an error (failure). The `intents:` line shows
which intents the API detected and with what confidence — it's the key debug
signal when a clue fails to unlock (the trigger intent wasn't detected, or a
`requiresClueIds` prerequisite is missing).

### Pitfalls

- **Stale session → 409.** If a previous run was killed mid-investigation, the
  session stays `active` in the DB and the next start fails with
  `409: Você já tem uma sessão em andamento`. Abandon it before re-running:
  ```sh
  docker exec ai-history-postgres-1 psql -U postgres -d ai_history -c \
    "UPDATE \"HistorySession\" SET status='abandoned' WHERE status='active';"
  ```
- **Background-task timeout ≠ failure.** Exit code 143 (SIGTERM) means the
  harness killed the run for hitting its timeout, not a real error. Check the
  last log line and stderr before treating it as a failure.

Available flags (all optional; anything not passed falls back to `.env`):

| Flag               | Env equivalent                 |
| ------------------ | ------------------------------ |
| `--slug`           | `VALIDATOR_HISTORY_SLUG`       |
| `--email`          | `VALIDATOR_EMAIL`              |
| `--password`       | `VALIDATOR_PASSWORD`           |
| `--api-url`        | `VALIDATOR_API_URL`            |
| `--model`          | `VALIDATOR_INVESTIGATOR_MODEL` |
| `--max-iterations` | `VALIDATOR_MAX_ITERATIONS`     |
| `--output`         | `VALIDATOR_OUTPUT`             |

The validator logs in, starts a session, runs an LLM investigator (default
`deepseek/deepseek-v4-flash`) for up to 50 turns, and writes a report.

**Success criteria:**

- All clues discovered (`<n>/<n> clues`)
- `stopReason: investigator decided to stop` (resolved) — NOT hitting `maxIterations`
- Every entity shows `<n>/<n>` in the ENTITY PROGRESS section

Report lands at `apps/validator/validator-output-<slug>.txt` (override with `--output`).

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
