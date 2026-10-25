import { enc, type HttpClient, type Query } from '../http';

/** AI agents and bot instances. */
export class Agents {
  constructor(private readonly http: HttpClient) {}

  /** List agents in an app. `GET /v2/apps/{appId}/agents` */
  list<T = unknown>(appId: string, query?: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/agents`, { query });
  }

  /** Create an agent for an app. `POST /v2/apps/{appId}/agents` */
  create<T = unknown>(appId: string, body: Record<string, unknown>): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/agents`, { body });
  }

  /** Delete an app's agent. `DELETE /v2/apps/{appId}/agents/{idOrAddress}` */
  delete<T = unknown>(appId: string, idOrAddress: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/agents/${enc(idOrAddress)}`);
  }

  /** Add an agent to a chat. `POST /v2/apps/{appId}/agents/{idOrAddress}/invite-to-chat` */
  inviteToChat<T = unknown>(
    appId: string,
    idOrAddress: string,
    { chatJid, chatId }: { chatJid?: string; chatId?: string }
  ): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/agents/${enc(idOrAddress)}/invite-to-chat`, {
      body: { chatJid, chatId },
    });
  }

  /**
   * One-shot synchronous ask: text in, the agent's reply out (B2B-only).
   * `POST /v2/agents/{id}/reply`. Can take 10-30s — set a generous timeout.
   */
  reply<T = unknown>(
    id: string,
    text: string,
    { timeoutMs = 60000 }: { timeoutMs?: number } = {}
  ): Promise<T> {
    return this.http.post<T>(`/v2/agents/${enc(id)}/reply`, { body: { text }, timeoutMs });
  }

  /** Get a single agent (account-level). `GET /v2/agents/{idOrAddress}` */
  get<T = unknown>(idOrAddress: string): Promise<T> {
    return this.http.get<T>(`/v2/agents/${enc(idOrAddress)}`);
  }

  /** Update an agent. `PUT /v2/agents/{idOrAddress}` */
  update<T = unknown>(idOrAddress: string, body: Record<string, unknown>): Promise<T> {
    return this.http.put<T>(`/v2/agents/${enc(idOrAddress)}`, { body });
  }

  /** List bot instances in an app. `GET /v2/apps/{appId}/bot-instances` */
  listBotInstances<T = unknown>(appId: string, query?: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/bot-instances`, { query });
  }
}
