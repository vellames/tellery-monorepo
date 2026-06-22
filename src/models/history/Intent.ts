import { BaseModel } from "../BaseModel";

export interface IntentDefinition extends BaseModel {
  description: string;
  examples: string[];
  keywords: string[];
}
