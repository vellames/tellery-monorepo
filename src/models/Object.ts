import { BaseModel } from "./BaseModel";

export interface ObjectDefinition extends BaseModel {
  name: string;
  shortDescription: string;

  imageUrl?: string;

  locationId: string;

  initialDescription: string;

  clueRevealRules: ObjectClueRevealRule[];
}

export interface ObjectClueRevealRule {
  clueId: string;
  triggerIntents: string[];
  requiresClueIds?: string[];
  revealText: string;
}
