import { BaseModel } from "./BaseModel";

export interface EndingDefinition extends BaseModel {
  title: string;

  type: EndingType;

  condition: EndingCondition;

  summary: string;
  epilogue: string;
}

export type EndingType = "full_truth" | "partial_truth" | "wrong_accusation";

export interface EndingCondition {
  conclusionMatches?: Record<string, string>;
  requiresClueIds?: string[];
}
