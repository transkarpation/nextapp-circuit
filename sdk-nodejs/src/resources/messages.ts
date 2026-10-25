import { enc, type HttpClient, type Query } from '../http';

/** Message history, search, context windows and unread counts. */
export class Messages {
  constructor(private readonly http: HttpClient) {}

  /** Read a chat's history from the MAM archive. `GET /v2/apps/{appId}/chats/{chatId}/messages` */
  history<T = unknown>(
    appId: string,
    chatId: string,
    { limit, before }: { limit?: number; before?: number } = {}
  ): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages`, {
      query: { limit, before },
    });
  }

  /** Bulk-delete a chat's history. `DELETE /v2/apps/{appId}/chats/{chatId}/messages` */
  deleteHistory<T = unknown>(appId: string, chatId: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages`);
  }

  /**
   * Search archived messages by text. `GET /v2/apps/{appId}/messages/search`
   * @param query - `{ q, mode?, chatId?, fromUserId?, since?, until?, sort?, limit?, offset? }`
   */
  search<T = unknown>(appId: string, query: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/messages/search`, { query });
  }

  /** Load context around a message. `GET /v2/apps/{appId}/chats/{chatId}/messages/context` */
  context<T = unknown>(appId: string, chatId: string, query: Query): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages/context`, {
      query,
    });
  }

  /** Batch unread counts per room for a set of users. `POST /v2/apps/{appId}/users/unread-counts` */
  unreadCounts<T = unknown>(
    appId: string,
    { userIds, mode, cap }: { userIds: string[]; mode?: 'count' | 'flag'; cap?: number }
  ): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/users/unread-counts`, {
      body: { userIds, mode, cap },
    });
  }
}
