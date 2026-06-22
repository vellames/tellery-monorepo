import fs from "fs";
import path from "path";

export function loadMockJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "mocks", fileName);
  const fileContents = fs.readFileSync(filePath, "utf8");

  return JSON.parse(fileContents) as T;
}
