import { BaseModel } from "./BaseModel";

export interface LocationDefinition extends BaseModel {
  name: string;
  shortDescription: string;

  imageUrl?: string;

  initialDescription: string;

  ambientClueIds: string[];
  objectIds: string[];
}
