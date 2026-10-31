import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseTemplateList, type TemplateGroup } from "./circuit-templates";

// На Vercel public/ не потрапляє у функцію сама: дивись outputFileTracingIncludes у next.config.ts.
const TEMPLATES_DIR = path.join(process.cwd(), "public", "templates");

export async function readTemplateGroups(): Promise<TemplateGroup[]> {
  return parseTemplateList(await readFile(path.join(TEMPLATES_DIR, "setuplist.txt"), "utf8"));
}

/** Повертає null для файлу не з меню: ім'я приходить ззовні й не повинно виводити за межі теки. */
export async function readTemplate(file: string): Promise<string | null> {
  const groups = await readTemplateGroups();
  const known = groups.some((group) => group.templates.some((t) => t.file === file));
  return known ? readFile(path.join(TEMPLATES_DIR, file), "utf8") : null;
}
