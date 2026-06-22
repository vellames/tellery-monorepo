import ts from "typescript";
import fs from "fs";
import path from "path";

interface FieldSchema {
  name: string;
  type: string;
  optional: boolean;
}

interface ModelSchema {
  name: string;
  extends?: string[];
  fields: FieldSchema[];
}

const root = path.resolve(__dirname, "..");
const modelsDir = path.join(root, "src/models");
const outPath = path.join(root, "models.schema.json");

function getModelFileNames(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return getModelFileNames(fullPath);
    if (entry.isFile() && entry.name.endsWith(".ts")) return [fullPath];

    return [];
  });
}

const fileNames = getModelFileNames(modelsDir);

const program = ts.createProgram(fileNames, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
});

const sourceFiles = program
  .getSourceFiles()
  .filter((sf) => sf.fileName.startsWith(modelsDir));

const schemas: Record<string, ModelSchema> = {};

for (const sourceFile of sourceFiles) {
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isInterfaceDeclaration(node) || !node.name) return;

    const name = node.name.getText(sourceFile);
    if (name === "User") return;

    const extendsTypes: string[] = [];
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        for (const type of clause.types) {
          extendsTypes.push(type.expression.getText(sourceFile));
        }
      }
    }

    const fields: FieldSchema[] = [];
    for (const member of node.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      const fieldName = member.name.getText(sourceFile);
      const optional = !!member.questionToken;
      const typeNode = member.type;
      const typeString = typeNode ? typeNode.getText(sourceFile) : "unknown";
      fields.push({ name: fieldName, type: typeString, optional });
    }

    schemas[name] = { name, fields, extends: extendsTypes };
  });
}

fs.writeFileSync(outPath, JSON.stringify(schemas, null, 2));
console.log(`Schema written to ${outPath}`);
