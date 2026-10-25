import { enc, type HttpClient, type Query } from '../http';

export interface ChatMembersInput {
  /** Canonical room name. */
  chatName: string;
  members: string[];
}

/** Chat rooms, membership, profiles and broadcasts. */
export class Chats {
  constructor(private readonly http: HttpClient) {}

  /** Create a public/group chat. `POST /v2/apps/{appId}/chats` */
  create<T = unknown>(appId: string, body: Record<string, unknown>): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/chats`, { body });
  }

  /** Open/return a 1-1 chat between two app users. `POST /v2/apps/{appId}/chats/private` */
  createPrivate<T = unknown>(
    appId: string,
    { members, e2ee }: { members: string[]; e2ee?: boolean }
  ): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/chats/private`, { body: { members, e2ee } });
  }

  /** Delete a chat by canonical room name. `DELETE /v2/apps/{appId}/chats` */
  delete<T = unknown>(appId: string, name: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/chats`, { body: { name } });
  }

  /** List all chats in an app. `GET /v2/apps/{appId}/chats` */
  list<T = unknown>(appId: string, query?: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/chats`, { query });
  }

  /** List chats a user belongs to. `GET /v2/apps/{appId}/users/{userId}/chats` */
  listForUser<T = unknown>(appId: string, userId: string, query?: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/chats`, { query });
  }

  /** Update chat title/description. `PATCH /v2/apps/{appId}/chats/{chatId}` */
  updateMeta<T = unknown>(
    appId: string,
    chatId: string,
    body: { title?: string; description?: string }
  ): Promise<T> {
    return this.http.patch<T>(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}`, { body });
  }

  /** Add members to a chat. `POST /v2/apps/{appId}/chats/users-access` */
  addMembers<T = unknown>(appId: string, { chatName, members }: ChatMembersInput): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/chats/users-access`, {
      body: { chatName, members },
    });
  }

  /** Remove members from a chat. `DELETE /v2/apps/{appId}/chats/users-access` */
  removeMembers<T = unknown>(appId: string, { chatName, members }: ChatMembersInput): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/chats/users-access`, {
      body: { chatName, members },
    });
  }

  /**
   * Batch-update user profiles (path-explicit; works for child apps).
   * `PATCH /v2/apps/{appId}/chats/users`. Inspect each item's `status`.
   */
  patchUsers<T = unknown>(
    appId: string,
    users: Array<Record<string, unknown>> | { users: Array<Record<string, unknown>> }
  ): Promise<T> {
    const body = Array.isArray(users) ? { users } : users;
    return this.http.patch<T>(`/v2/apps/${enc(appId)}/chats/users`, { body });
  }

  /**
   * Queue an app-wide/targeted broadcast. `POST /v2/apps/{appId}/chats/broadcast`
   * → `{ jobId, statusUrl }` (202). Poll `getBroadcastJob`.
   */
  broadcast<T = unknown>(appId: string, body: Record<string, unknown>): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/chats/broadcast`, { body });
  }

  /** Broadcast job status. `GET /v2/apps/{appId}/chats/broadcast/{jobId}` */
  getBroadcastJob<T = unknown>(appId: string, jobId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/chats/broadcast/${enc(jobId)}`);
  }
}
