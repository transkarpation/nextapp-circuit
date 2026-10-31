import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getUidFromApiKey } from "@/lib/auth";
import { createMcpServer } from "@/lib/mcp";

// Запас на аналіз великої схеми: симуляція обмежена 8 секундами, сам аналіз — лише цим лімітом.
export const maxDuration = 30;

// req.url містить ім'я, з яким запущено сервер, а посилання на схему має вести туди, куди прийшов клієнт.
function getOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

// Лише POST: сесій і SSE-потоку немає, тож GET і DELETE отримують 405 від самого Next.
export async function POST(req: Request) {
  const uid = await getUidFromApiKey(req);
  if (!uid) {
    return NextResponse.json(
      { error: "Не авторизовано" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const server = createMcpServer(uid, getOrigin(req));
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}
