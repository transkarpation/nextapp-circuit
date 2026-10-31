// Шаблони — статичні файли у public/templates, setuplist.txt описує їхнє меню.
const TEMPLATES_URL = "/templates";

/** Порожня схема: лише рядок налаштувань симулятора. */
export const BLANK_CIRCUIT = "$ 1 5.0E-6 10 50 5.0\n";

export interface CircuitTemplate {
  file: string;
  title: string;
}

export interface TemplateGroup {
  /** Шлях у меню, наприклад "Other Passive Circuits / Relays". */
  title: string;
  templates: CircuitTemplate[];
}

/** Рядки: `+Назва` відкриває групу, `-` закриває, `файл.txt Назва` — шаблон, `>` — той, що за замовчуванням. */
export function parseTemplateList(text: string): TemplateGroup[] {
  const groups: TemplateGroup[] = [];
  const path: string[] = [];
  let group: TemplateGroup | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line[0] === "#") continue;
    if (line[0] === "+") {
      path.push(line.slice(1));
      group = null;
      continue;
    }
    if (line[0] === "-") {
      path.pop();
      group = null;
      continue;
    }
    const body = line[0] === ">" ? line.slice(1) : line;
    const space = body.indexOf(" ");
    if (space < 0) continue;
    if (!group) {
      // Група може продовжитися після вкладених: `+A`, `+B`, `-`, далі знову шаблони A.
      const title = path.join(" / ");
      group = groups.find((g) => g.title === title) ?? { title, templates: [] };
      if (!groups.includes(group)) groups.push(group);
    }
    group.templates.push({ file: body.slice(0, space), title: body.slice(space + 1) });
  }
  return groups;
}

export async function fetchTemplateGroups(): Promise<TemplateGroup[]> {
  const res = await fetch(`${TEMPLATES_URL}/setuplist.txt`);
  if (!res.ok) throw new Error("Не вдалося завантажити шаблони");
  return parseTemplateList(await res.text());
}

export async function fetchTemplate(file: string): Promise<string> {
  const res = await fetch(`${TEMPLATES_URL}/${file}`);
  if (!res.ok) throw new Error("Не вдалося завантажити шаблон");
  return res.text();
}
