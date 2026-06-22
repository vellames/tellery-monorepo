import { BaseModel } from "../BaseModel";

export type ClueImportance = "required" | "supporting" | "red_herring";

export interface ClueDefinition extends BaseModel {
  title: string;
  description: string;

  importance: ClueImportance;
}
