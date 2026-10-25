import { buildForm } from '../form';
import { enc, type HttpClient, type Query } from '../http';

export type DeleteMode = 'soft' | 'hard';
export type Room = Record<string, unknown>;

/** Apps, tenancy, tokens, provisioning. */
export class Apps {
  constructor(private readonly http: HttpClient) {}

  /** List apps visible to the token's tenant actor. `GET /v2/apps` */
  list<T = unknown>(query?: Query): Promise<T> {
    return this.http.get<T>('/v2/apps', { query });
  }

  /** Create a child app. `POST /v2/apps` */
  create<T = unknown>(body: Record<string, unknown>): Promise<T> {
    return this.http.post<T>('/v2/apps', { body });
  }

  /** Get one app. `GET /v2/apps/{appId}` */
  get<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}`);
  }

  /** Partially update an app. `PATCH /v2/apps/{appId}` */
  update<T = unknown>(appId: string, body: Record<string, unknown>): Promise<T> {
    return this.http.patch<T>(`/v2/apps/${enc(appId)}`, { body });
  }

  /**
   * Archive (soft, default) or purge (`mode: 'hard'`) an app.
   * `DELETE /v2/apps/{appId}` — hard mode returns 202 + jobId.
   */
  delete<T = unknown>(
    appId: string,
    { mode, reason }: { mode?: DeleteMode; reason?: string } = {}
  ): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}`, { query: { mode, reason } });
  }

  /** Restore an archived app. `POST /v2/apps/{appId}/restore` */
  restore<T = unknown>(appId: string): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/restore`);
  }

  /** Poll a hard-delete cascade purge job. `GET /v2/apps/purge-jobs/{jobId}` */
  getPurgeJob<T = unknown>(jobId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/purge-jobs/${enc(jobId)}`);
  }

  /**
   * Export an app bundle. `GET /v2/apps/{appId}/export`.
   * With `format: 'zip'` the raw Response is returned so you can stream the archive.
   */
  export(appId: string, opts: { format: 'zip'; include?: string }): Promise<Response>;
  export<T = unknown>(appId: string, opts?: { format?: 'json'; include?: string }): Promise<T>;
  export<T = unknown>(
    appId: string,
    { format = 'json', include }: { format?: 'json' | 'zip'; include?: string } = {}
  ): Promise<T | Response> {
    const path = `/v2/apps/${enc(appId)}/export`;
    if (format === 'zip') {
      return this.http.request('GET', path, { query: { format, include }, raw: true });
    }
    return this.http.get<T>(path, { query: { format, include } });
  }

  /** Import an app bundle (JSON). `POST /v2/apps/import` */
  import<T = unknown>(
    bundle: unknown,
    { domainNameOverride }: { domainNameOverride?: string } = {}
  ): Promise<T> {
    return this.http.post<T>('/v2/apps/import', { body: bundle, query: { domainNameOverride } });
  }

  /** Import an app bundle from a zip archive (multipart). `POST /v2/apps/import` */
  importZip<T = unknown>(
    zip: Buffer | Uint8Array | Blob,
    {
      filename = 'bundle.zip',
      domainNameOverride,
    }: { filename?: string; domainNameOverride?: string } = {}
  ): Promise<T> {
    const form = buildForm({}, [{ data: zip, filename, contentType: 'application/zip' }], 'bundle');
    return this.http.post<T>('/v2/apps/import', { form, query: { domainNameOverride } });
  }

  /** Provision default rooms. `POST /v2/apps/{appId}/provision` */
  provision<T = unknown>(appId: string, rooms: Room[] | { rooms: Room[] }): Promise<T> {
    const body = Array.isArray(rooms) ? { rooms } : rooms;
    return this.http.post<T>(`/v2/apps/${enc(appId)}/provision`, { body });
  }

  /** Provision a tenant-owner chat session. `POST /v2/apps/{appId}/owner-session` */
  ownerSession<T = unknown>(appId: string): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/owner-session`);
  }

  // --- App tokens (metadata-managed, returned once) --------------------------

  /** List app-token metadata. `GET /v2/apps/{appId}/tokens` */
  listTokens<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/tokens`);
  }

  /** Create an app token (returned once). `POST /v2/apps/{appId}/tokens` */
  createToken<T = unknown>(appId: string, { label }: { label?: string } = {}): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/tokens`, { body: { label } });
  }

  /** Rotate an app token. `POST /v2/apps/{appId}/tokens/{tokenId}/rotate` */
  rotateToken<T = unknown>(
    appId: string,
    tokenId: string,
    { label }: { label?: string } = {}
  ): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/tokens/${enc(tokenId)}/rotate`, {
      body: { label },
    });
  }

  /** Revoke an app token. `DELETE /v2/apps/{appId}/tokens/{tokenId}` */
  revokeToken<T = unknown>(appId: string, tokenId: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/tokens/${enc(tokenId)}`);
  }

  // --- Minted server tokens (revocable; need an OWNER USER JWT) --------------

  /**
   * List minted server tokens. `GET /v2/apps/{appId}/server-tokens`.
   * Note: creating/listing minted server tokens requires an owner USER JWT,
   * not a B2B server token.
   */
  listServerTokens<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/server-tokens`);
  }

  /** Mint a revocable server token (owner USER JWT). `POST /v2/apps/{appId}/server-tokens` */
  createServerToken<T = unknown>(
    appId: string,
    { name, ttlDays }: { name?: string; ttlDays?: number } = {}
  ): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/server-tokens`, { body: { name, ttlDays } });
  }

  /** Revoke a minted server token. `DELETE /v2/apps/{appId}/server-tokens/{id}` */
  revokeServerToken<T = unknown>(appId: string, id: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/server-tokens/${enc(id)}`);
  }

  /** AI token usage for an app. `GET /v2/apps/{appId}/ai-usage` */
  aiUsage<T = unknown>(appId: string, { from, to }: { from?: string; to?: string } = {}): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/ai-usage`, { query: { from, to } });
  }
}
