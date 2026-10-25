// Білий список операцій Ethora SDK, доступних зі сторінки /ethora-admin.
// Тільки сервер. Браузер не може викликати довільний метод SDK — лише ті,
// що описані тут за id. `run` отримує вже розпарсені аргументи.
import "server-only";
import type { EthoraB2BClient } from "ethora-b2b-sdk";
import type { EthoraOpMeta, EthoraParamMeta } from "@/lib/sdk";
import { getEthoraClient, getEthoraInternalSecret } from "./ethora";

interface EthoraOp extends EthoraOpMeta {
  run: (client: EthoraB2BClient, args: Record<string, unknown>) => Promise<unknown>;
}

// Короткі хелпери для опису параметрів.
const p = {
  str: (name: string, label: string, required = true, placeholder?: string): EthoraParamMeta => ({
    name,
    label,
    kind: "string",
    required,
    placeholder,
  }),
  num: (name: string, label: string, required = false): EthoraParamMeta => ({
    name,
    label,
    kind: "number",
    required,
  }),
  bool: (name: string, label: string): EthoraParamMeta => ({
    name,
    label,
    kind: "boolean",
  }),
  json: (name: string, label: string, required = true, placeholder?: string): EthoraParamMeta => ({
    name,
    label,
    kind: "json",
    required,
    placeholder,
  }),
};

// Хелпери читання аргументів.
const s = (args: Record<string, unknown>, k: string): string | undefined => {
  const v = args[k];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
};
const n = (args: Record<string, unknown>, k: string): number | undefined => {
  const v = args[k];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
};

const OPS: EthoraOp[] = [
  // ── Apps ───────────────────────────────────────────────────────────
  {
    id: "apps.list",
    label: "Список застосунків",
    group: "apps",
    params: [],
    run: (c) => c.apps.list(),
  },
  {
    id: "apps.get",
    label: "Застосунок за id",
    group: "apps",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.apps.get(s(a, "appId")!),
  },
  {
    id: "apps.listServerTokens",
    label: "Серверні токени застосунку",
    group: "apps",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.apps.listServerTokens(s(a, "appId")!),
  },
  {
    id: "apps.aiUsage",
    label: "Використання AI",
    group: "apps",
    params: [
      p.str("appId", "App ID"),
      p.str("from", "Від (ISO-дата)", false, "2026-01-01"),
      p.str("to", "До (ISO-дата)", false, "2026-01-31"),
    ],
    run: (c, a) => c.apps.aiUsage(s(a, "appId")!, { from: s(a, "from"), to: s(a, "to") }),
  },
  {
    id: "apps.createServerToken",
    label: "Створити серверний токен",
    group: "apps",
    danger: true,
    params: [
      p.str("appId", "App ID"),
      p.str("name", "Назва", false),
      p.num("ttlDays", "TTL (днів)"),
    ],
    run: (c, a) =>
      c.apps.createServerToken(s(a, "appId")!, { name: s(a, "name"), ttlDays: n(a, "ttlDays") }),
  },

  // ── Users ──────────────────────────────────────────────────────────
  {
    id: "users.list",
    label: "Список користувачів",
    group: "users",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.users.list(s(a, "appId")!),
  },
  {
    id: "users.createSync",
    label: "Створити користувача (sync, свій app)",
    group: "users",
    danger: true,
    params: [
      p.str("email", "Email"),
      p.str("firstName", "Імʼя"),
      p.str("lastName", "Прізвище"),
      p.str("password", "Пароль", false),
      p.bool("bypassEmailConfirmation", "Пропустити підтвердження email"),
    ],
    run: (c, a) =>
      c.users.createSync(
        {
          email: s(a, "email")!,
          firstName: s(a, "firstName")!,
          lastName: s(a, "lastName")!,
          password: s(a, "password"),
        },
        { bypassEmailConfirmation: Boolean(a.bypassEmailConfirmation) },
      ),
  },
  {
    id: "users.create",
    label: "Створити користувача (async batch, за App ID)",
    group: "users",
    danger: true,
    params: [
      p.str("appId", "App ID"),
      p.str("email", "Email"),
      p.str("firstName", "Імʼя"),
      p.str("lastName", "Прізвище"),
      p.str("password", "Пароль", false),
      p.bool("bypassEmailConfirmation", "Пропустити підтвердження email"),
    ],
    run: (c, a) =>
      c.users.create(
        s(a, "appId")!,
        {
          email: s(a, "email")!,
          firstName: s(a, "firstName")!,
          lastName: s(a, "lastName")!,
          password: s(a, "password"),
        },
        { bypassEmailConfirmation: Boolean(a.bypassEmailConfirmation) },
      ),
  },
  {
    id: "users.getByXmppUsername",
    label: "Користувач за XMPP-username",
    group: "users",
    params: [p.str("xmppUsername", "XMPP username")],
    run: (c, a) => c.users.getByXmppUsername(s(a, "xmppUsername")!),
  },

  // ── Chats ──────────────────────────────────────────────────────────
  {
    id: "chats.list",
    label: "Список чатів",
    group: "chats",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.chats.list(s(a, "appId")!),
  },
  {
    id: "chats.listForUser",
    label: "Чати користувача",
    group: "chats",
    params: [p.str("appId", "App ID"), p.str("userId", "User ID")],
    run: (c, a) => c.chats.listForUser(s(a, "appId")!, s(a, "userId")!),
  },
  {
    id: "chats.createPrivate",
    label: "Створити приватний чат (1-на-1)",
    group: "chats",
    danger: true,
    params: [
      p.str("appId", "App ID"),
      p.json("members", "Учасники (JSON-масив, 2 user ID)", true, '["userIdA", "userIdB"]'),
      p.bool("e2ee", "E2EE-шифрування"),
    ],
    run: (c, a) =>
      c.chats.createPrivate(s(a, "appId")!, {
        members: a.members as string[],
        e2ee: Boolean(a.e2ee),
      }),
  },
  {
    id: "chats.create",
    label: "Створити груповий чат",
    group: "chats",
    danger: true,
    params: [
      p.str("appId", "App ID"),
      p.json("body", "Тіло (JSON)", true, '{ "title": "General", "description": "…" }'),
    ],
    run: (c, a) => c.chats.create(s(a, "appId")!, a.body as Record<string, unknown>),
  },
  {
    id: "chats.addMembers",
    label: "Додати учасників у чат",
    group: "chats",
    danger: true,
    params: [
      p.str("appId", "App ID"),
      p.str("chatName", "Назва чату (room name)"),
      p.json("members", "Учасники (JSON-масив user ID)", true, '["userIdA", "userIdB"]'),
    ],
    run: (c, a) =>
      c.chats.addMembers(s(a, "appId")!, {
        chatName: s(a, "chatName")!,
        members: a.members as string[],
      }),
  },
  {
    id: "chats.broadcast",
    label: "Розсилка (broadcast)",
    group: "chats",
    danger: true,
    params: [p.str("appId", "App ID"), p.json("body", "Тіло (JSON)", true, '{ "text": "…" }')],
    run: (c, a) => c.chats.broadcast(s(a, "appId")!, a.body as Record<string, unknown>),
  },

  // ── Messages ───────────────────────────────────────────────────────
  {
    id: "messages.history",
    label: "Історія повідомлень",
    group: "messages",
    params: [p.str("appId", "App ID"), p.str("chatId", "Chat ID"), p.num("limit", "Ліміт")],
    run: (c, a) =>
      c.messages.history(s(a, "appId")!, s(a, "chatId")!, { limit: n(a, "limit") }),
  },
  {
    id: "messages.unreadCounts",
    label: "Непрочитані (unread counts)",
    group: "messages",
    params: [
      p.str("appId", "App ID"),
      p.json("userIds", "User IDs (JSON-масив)", true, '["u1", "u2"]'),
    ],
    run: (c, a) =>
      c.messages.unreadCounts(s(a, "appId")!, { userIds: a.userIds as string[] }),
  },

  // ── Agents ─────────────────────────────────────────────────────────
  {
    id: "agents.list",
    label: "Список агентів",
    group: "agents",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.agents.list(s(a, "appId")!),
  },
  {
    id: "agents.get",
    label: "Агент за id/адресою",
    group: "agents",
    params: [p.str("idOrAddress", "ID або адреса")],
    run: (c, a) => c.agents.get(s(a, "idOrAddress")!),
  },

  // ── Sources ────────────────────────────────────────────────────────
  {
    id: "sources.listCrawls",
    label: "Список кролів (crawls)",
    group: "sources",
    params: [p.str("appId", "App ID"), p.num("limit", "Ліміт"), p.num("offset", "Offset")],
    run: (c, a) =>
      c.sources.listCrawls(s(a, "appId")!, { limit: n(a, "limit"), offset: n(a, "offset") }),
  },
  {
    id: "sources.listDocs",
    label: "Список документів",
    group: "sources",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.sources.listDocs(s(a, "appId")!),
  },

  // ── Widget ─────────────────────────────────────────────────────────
  {
    id: "widget.getAppearance",
    label: "Вигляд віджета",
    group: "widget",
    params: [p.str("appId", "App ID")],
    run: (c, a) => c.widget.getAppearance(s(a, "appId")!),
  },
  {
    id: "widget.listConversations",
    label: "Розмови віджета",
    group: "widget",
    params: [p.str("appId", "App ID"), p.num("limit", "Ліміт"), p.num("offset", "Offset")],
    run: (c, a) =>
      c.widget.listConversations(s(a, "appId")!, {
        limit: n(a, "limit"),
        offset: n(a, "offset"),
      }),
  },

  // ── Інше ───────────────────────────────────────────────────────────
  {
    id: "verifyToken",
    label: "Перевірити JWT (verifyToken)",
    group: "other",
    params: [p.str("token", "JWT")],
    // internalSecret береться з env (ETHORA_INTERNAL_SECRET), не від клієнта.
    run: (c, a) => c.verifyToken(s(a, "token")!, getEthoraInternalSecret()),
  },
  {
    id: "request",
    label: "Довільний запит (escape hatch)",
    group: "other",
    danger: true,
    params: [
      p.str("method", "Метод", true, "GET"),
      p.str("path", "Шлях", true, "/v2/apps"),
      p.json("query", "Query (JSON)", false, '{ "limit": 10 }'),
      p.json("body", "Body (JSON)", false),
    ],
    run: (c, a) =>
      c.request(s(a, "method") ?? "GET", s(a, "path")!, {
        query: a.query as Record<string, unknown> | undefined,
        body: a.body,
      }),
  },
];

const BY_ID = new Map(OPS.map((op) => [op.id, op]));

/** Серіалізовний каталог для UI (без функцій `run`). */
export function ethoraCatalog(): EthoraOpMeta[] {
  return OPS.map(({ id, label, group, danger, params }) => ({ id, label, group, danger, params }));
}

export interface EthoraRunOutcome {
  ok: boolean;
  data?: unknown;
  error?: string;
  status?: number;
  code?: string;
}

/** Викликати операцію за id. Помилки Ethora повертаються як `{ ok: false }`. */
export async function runEthoraOp(
  id: string,
  args: Record<string, unknown>,
): Promise<EthoraRunOutcome> {
  const op = BY_ID.get(id);
  if (!op) throw new Error(`Невідома операція: ${id}`);

  const client = getEthoraClient();
  try {
    const data = await op.run(client, args ?? {});
    return { ok: true, data };
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number; code?: string };
    return {
      ok: false,
      error: e?.message ?? "Помилка виклику Ethora",
      status: typeof e?.status === "number" ? e.status : undefined,
      code: typeof e?.code === "string" ? e.code : undefined,
    };
  }
}

/** Чи існує операція з таким id. */
export function isKnownEthoraOp(id: unknown): id is string {
  return typeof id === "string" && BY_ID.has(id);
}
