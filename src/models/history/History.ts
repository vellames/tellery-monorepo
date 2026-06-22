import type { ClueDefinition } from "./Clue";
import type { ConclusionDefinition } from "./Conclusion";
import type { CharacterDefinition } from "./Character";
import type { EndingDefinition } from "./Ending";
import type { HistoryRules } from "./HistoryRules";
import type { IntentDefinition } from "./Intent";
import type { LocationDefinition } from "./Location";
import { BaseModel, createBaseModel } from "../BaseModel";
import type { ObjectDefinition } from "./Object";

export interface History extends BaseModel {
  slug: string;

  title: string;
  subtitle?: string;
  teaser: string;

  genre: "mystery";
  language: "pt-BR";

  estimatedDurationMinutes: number;

  status: "draft" | "published" | "archived";
  version: number;

  coverImageUrl?: string;
  thumbnailUrl?: string;

  opening: HistoryOpening;
  objective: HistoryObjective;

  intentDefinitions: IntentDefinition[];

  characters: CharacterDefinition[];
  locations: LocationDefinition[];
  objects: ObjectDefinition[];
  clues: ClueDefinition[];

  conclusion: ConclusionDefinition;
  endings: EndingDefinition[];

  rules: HistoryRules;

  publishedAt?: Date;
}

export interface HistoryOpening {
  title?: string;
  imageUrl?: string;

  shortText: string;
  fullText: string;

  callToAction?: string;
}

export interface HistoryObjective {
  mainQuestion: string;
  description: string;
}

export function createHistory(input: {
  slug: string;
  title: string;
  subtitle?: string;
  teaser: string;
  opening: HistoryOpening;
  objective: HistoryObjective;
  rules: HistoryRules;
}): History {
  return {
    ...createBaseModel(),
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    teaser: input.teaser,
    genre: "mystery",
    language: "pt-BR",
    estimatedDurationMinutes: 0,
    status: "draft",
    version: 1,
    opening: input.opening,
    objective: input.objective,
    intentDefinitions: [],
    characters: [],
    locations: [],
    objects: [],
    clues: [],
    conclusion: { ...createBaseModel(), fields: [] },
    endings: [],
    rules: input.rules,
  };
}
