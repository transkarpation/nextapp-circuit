import { enc, type HttpClient } from '../http';

/** AI website-widget appearance and conversations. */
export class Widget {
  constructor(private readonly http: HttpClient) {}

  /** Get stored widget appearance. `GET /v2/apps/{appId}/widget/appearance` */
  getAppearance<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/widget/appearance`);
  }

  /**
   * Replace stored widget appearance. `PUT /v2/apps/{appId}/widget/appearance`
   * Pass a map of `data-*` attribute names to values; `{}` clears everything.
   */
  setAppearance<T = unknown>(appId: string, appearance: Record<string, unknown>): Promise<T> {
    return this.http.put<T>(`/v2/apps/${enc(appId)}/widget/appearance`, { body: { appearance } });
  }

  /** List widget conversations. `GET /v2/apps/{appId}/widget/conversations` */
  listConversations<T = unknown>(
    appId: string,
    { limit, offset }: { limit?: number; offset?: number } = {}
  ): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/widget/conversations`, {
      query: { limit, offset },
    });
  }
}
