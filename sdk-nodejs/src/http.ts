import { EthoraApiError, EthoraConfigError } from './errors';

export type AuthMode = 'x-custom-token' | 'authorization';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Query = Record<string, unknown>;

export interface HttpOptions {
  /** e.g. `https://api.example.com` */
  baseUrl: string;
  /** Header used for the token. Defaults to `x-custom-token`. */
  authMode?: AuthMode;
  /** Extra default headers (e.g. `x-internal-secret`). */
  headers?: Record<string, string>;
  /** Default per-request timeout. Defaults to 60000 ms; `0` disables it. */
  timeoutMs?: number;
  /** Custom fetch implementation (tests, older runtimes). */
  fetch?: typeof fetch;
}

export interface HttpClientOptions extends HttpOptions {
  token?: string;
}

export interface RequestOptions {
  /** Query-string params; `null`/`undefined` values are skipped, arrays are comma-joined. */
  query?: Query;
  /** JSON body. */
  body?: unknown;
  /** Multipart body (takes precedence over `body`). */
  form?: FormData;
  /** Extra headers for this request. */
  headers?: Record<string, string>;
  /** Per-request timeout override. */
  timeoutMs?: number;
  /** Resolve with the raw `Response` (for binary downloads). */
  raw?: boolean;
}

/**
 * Thin HTTP layer over the Ethora API. Handles auth headers, query building,
 * JSON and multipart bodies, timeouts, and canonical error parsing.
 *
 * Uses the global `fetch`, `FormData` and `Blob` (Node >= 18). A custom
 * `fetch` implementation can be injected for tests or older runtimes.
 */
export class HttpClient {
  readonly baseUrl: string;
  private readonly token?: string;
  private readonly authMode: AuthMode;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions) {
    const {
      baseUrl,
      token,
      authMode = 'x-custom-token',
      headers = {},
      timeoutMs = 60000,
      fetch: fetchImpl,
    } = options ?? ({} as HttpClientOptions);

    if (!baseUrl) throw new EthoraConfigError('baseUrl is required');

    this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    this.token = token;
    this.authMode = authMode;
    this.defaultHeaders = headers;
    this.timeoutMs = timeoutMs;

    const resolved = fetchImpl ?? globalThis.fetch;
    if (typeof resolved !== 'function') {
      throw new EthoraConfigError(
        'global fetch is unavailable; use Node >= 18 or pass a `fetch` implementation'
      );
    }
    this.fetchImpl = resolved;
  }

  /** Return a copy of this client that authenticates with a different token. */
  withToken(token: string): HttpClient {
    return new HttpClient({
      baseUrl: this.baseUrl,
      token,
      authMode: this.authMode,
      headers: this.defaultHeaders,
      timeoutMs: this.timeoutMs,
      fetch: this.fetchImpl,
    });
  }

  private authHeaders(): Record<string, string> {
    if (!this.token) return {};
    if (this.authMode === 'authorization') {
      return { Authorization: `Bearer ${this.token}` };
    }
    return { 'x-custom-token': this.token };
  }

  private buildUrl(path: string, query?: Query): string {
    const url = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`));
    if (query && typeof query === 'object') {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) continue;
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else if (typeof value === 'boolean') {
          url.searchParams.set(key, value ? 'true' : 'false');
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /** Perform a request and resolve with the parsed body (or the raw `Response`). */
  request(method: string, path: string, opts: RequestOptions & { raw: true }): Promise<Response>;
  request<T = unknown>(method: string, path: string, opts?: RequestOptions): Promise<T>;
  async request<T = unknown>(
    method: string,
    path: string,
    opts: RequestOptions = {}
  ): Promise<T | Response> {
    const { query, body, form, headers = {}, timeoutMs, raw = false } = opts;
    const url = this.buildUrl(path, query);

    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...this.authHeaders(),
      ...headers,
    };

    let payload: string | FormData | undefined;
    if (form != null) {
      payload = form; // let fetch set the multipart boundary
    } else if (body != null) {
      finalHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const controller = new AbortController();
    const limit = timeoutMs ?? this.timeoutMs;
    const timer = limit ? setTimeout(() => controller.abort(), limit) : null;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
      });
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') {
        throw new EthoraApiError(`Request timed out after ${limit}ms`, {
          code: 'REQUEST_TIMEOUT',
          method,
          path,
        });
      }
      throw new EthoraApiError(`Network error: ${e?.message}`, {
        code: 'NETWORK_ERROR',
        method,
        path,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (raw) return response;

    const parsed = await parseBody(response);

    if (!response.ok) {
      const envelope = (parsed && typeof parsed === 'object' ? parsed : {}) as {
        error?: string;
        message?: string;
        code?: string;
        requestId?: string;
        details?: unknown;
      };
      throw new EthoraApiError(envelope.error || envelope.message || `HTTP ${response.status}`, {
        status: response.status,
        code: envelope.code,
        requestId: envelope.requestId,
        details: envelope.details,
        body: parsed,
        method,
        path,
      });
    }

    return parsed as T;
  }

  get<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, opts);
  }
  post<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, opts);
  }
  put<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, opts);
  }
  patch<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, opts);
  }
  delete<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return null;
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text || null;
}

/** Encode a path segment. */
export function enc(v: unknown): string {
  return encodeURIComponent(String(v));
}
