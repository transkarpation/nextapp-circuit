import { enc, type HttpClient } from '../http';

/** Per-app AI bot settings. */
export class Bots {
  constructor(private readonly http: HttpClient) {}

  /** Get AI bot settings for an app. `GET /v2/apps/{appId}/bot` */
  get<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/bot`);
  }

  /** Update AI bot settings for an app. `PUT /v2/apps/{appId}/bot` */
  update<T = unknown>(appId: string, body: Record<string, unknown>): Promise<T> {
    return this.http.put<T>(`/v2/apps/${enc(appId)}/bot`, { body });
  }
}
