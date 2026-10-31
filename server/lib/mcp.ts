import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { simulateCircuit, type SimulationReport } from "@app/circuit/headless";
import { z } from "zod";
import { CIRCUIT_FORMAT_GUIDE } from "./circuit-format";
import { readTemplate, readTemplateGroups } from "./circuit-templates.server";
import { createCircuit, getCircuitView, listCircuits, updateCircuit } from "./circuits.repo";
import { validateContent, validateTitle } from "./circuits.validation";

// Час аналізу росте кубічно від розміру схеми, а найбільший шаблон займає близько 7 КБ.
const MAX_SIMULATED_BYTES = 100_000;
const MAX_STEPS = 20_000;
const CHECK_STEPS = 200;
const CHECK_BUDGET_MS = 2_000;
const SIMULATE_BUDGET_MS = 8_000;

const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const failure = (message: string) => ({
  content: [{ type: "text" as const, text: message }],
  isError: true,
});

function contentError(content: string): string | null {
  const error = validateContent(content);
  if (error) return error;
  return Buffer.byteLength(content, "utf8") > MAX_SIMULATED_BYTES ? "Схема завелика" : null;
}

function describeProblem(report: SimulationReport): string {
  const lines = report.unreadLines.map((line) => `Unreadable line: ${line}`);
  if (report.error) lines.push(`Simulator: ${report.error}`);
  return lines.join("\n");
}

/** Повертає текст помилки, якщо схему не можна зберегти, інакше null. */
function checkContent(content: string): string | null {
  const error = contentError(content);
  if (error) return error;
  const report = simulateCircuit(content, { steps: CHECK_STEPS, budgetMs: CHECK_BUDGET_MS });
  return report.ok ? null : `The circuit was not saved.\n${describeProblem(report)}`;
}

/** Сервер живе один запит: транспорт працює без сесій, а uid уже перевірив роут. */
export function createMcpServer(uid: string, origin: string): McpServer {
  const server = new McpServer(
    { name: "nextapp-circuit", version: "0.1.0" },
    {
      instructions:
        "Creates and edits the user's electronic circuits. Call get_circuit_format before writing a circuit. " +
        "create_circuit and update_circuit run the circuit and refuse to save one that fails; fix what they report and retry.",
    },
  );

  const withUrl = <T extends { id: string }>(circuit: T) => ({
    ...circuit,
    url: `${origin}/circuits/${circuit.id}`,
  });

  server.registerTool(
    "get_circuit_format",
    {
      description: "Returns the syntax of the circuit text format. Read it before writing a circuit.",
      annotations: { readOnlyHint: true },
    },
    async () => ({ content: [{ type: "text", text: CIRCUIT_FORMAT_GUIDE }] }),
  );

  server.registerTool(
    "list_templates",
    {
      description: "Lists the sample circuits by menu group. Pass query to filter by title or group.",
      inputSchema: { query: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const needle = query?.trim().toLowerCase() ?? "";
      const groups = (await readTemplateGroups())
        .map((group) => ({
          ...group,
          templates: group.templates.filter(
            (t) =>
              t.title.toLowerCase().includes(needle) || group.title.toLowerCase().includes(needle),
          ),
        }))
        .filter((group) => group.templates.length > 0);
      return json(groups);
    },
  );

  server.registerTool(
    "get_template",
    {
      description: "Returns the text of a sample circuit. Use it as an example of the format, or as a starting point.",
      inputSchema: { file: z.string().describe("File name from list_templates, such as lrc.txt") },
      annotations: { readOnlyHint: true },
    },
    async ({ file }) => {
      const content = await readTemplate(file);
      return content === null
        ? failure(`Unknown template: ${file}`)
        : { content: [{ type: "text", text: content }] };
    },
  );

  server.registerTool(
    "list_circuits",
    {
      description: "Lists the user's circuits without their text, most recently changed first.",
      annotations: { readOnlyHint: true },
    },
    async () => json((await listCircuits(uid)).map(withUrl)),
  );

  server.registerTool(
    "get_circuit",
    {
      description: "Returns one circuit with its text.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const circuit = await getCircuitView(uid, id);
      return circuit ? json(withUrl(circuit)) : failure(`Circuit not found: ${id}`);
    },
  );

  server.registerTool(
    "create_circuit",
    {
      description: "Saves a new private circuit and returns it with a url the user can open.",
      inputSchema: { title: z.string(), content: z.string().describe("Circuit text") },
    },
    async ({ title, content }) => {
      const trimmed = title.trim();
      const error = validateTitle(trimmed) ?? checkContent(content);
      if (error) return failure(error);
      return json(withUrl(await createCircuit(uid, trimmed, content)));
    },
  );

  server.registerTool(
    "update_circuit",
    {
      description: "Changes the title or the text of one of the user's circuits.",
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional().describe("Circuit text; replaces the whole circuit"),
      },
    },
    async ({ id, title, content }) => {
      const patch: { title?: string; content?: string } = {};
      if (title !== undefined) {
        patch.title = title.trim();
        const error = validateTitle(patch.title);
        if (error) return failure(error);
      }
      if (content !== undefined) {
        const error = checkContent(content);
        if (error) return failure(error);
        patch.content = content;
      }
      const updated = await updateCircuit(uid, id, patch);
      return updated ? json(withUrl(updated)) : failure(`Circuit not found: ${id}`);
    },
  );

  server.registerTool(
    "simulate_circuit",
    {
      description:
        "Runs a circuit without saving it and returns the final voltage at each terminal and the current through each two-terminal element, leaving out wires. " +
        "Pass content, or the id of a saved circuit. One step is the timestep from the circuit's settings line.",
      inputSchema: {
        content: z.string().optional().describe("Circuit text"),
        id: z.string().optional().describe("Id of a saved circuit"),
        steps: z.number().int().min(1).max(MAX_STEPS).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ content, id, steps }) => {
      let text = content;
      if (text === undefined) {
        if (id === undefined) return failure("Pass content or id");
        const circuit = await getCircuitView(uid, id);
        if (!circuit) return failure(`Circuit not found: ${id}`);
        text = circuit.content;
      }
      const error = contentError(text);
      if (error) return failure(error);
      return json(simulateCircuit(text, { steps, budgetMs: SIMULATE_BUDGET_MS }));
    },
  );

  return server;
}
