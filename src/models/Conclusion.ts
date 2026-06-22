import { BaseModel } from "./BaseModel";

export interface ConclusionDefinition extends BaseModel {
  fields: ConclusionField[];
}

export interface ConclusionField extends BaseModel {
  label: string;
  type: ConclusionFieldType;
  options: ConclusionOption[];
}

export type ConclusionFieldType = "character" | "choice";

export interface ConclusionOption extends BaseModel {
  label: string;
}
