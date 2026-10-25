import { EthoraConfigError } from './errors';
import { HttpClient, type HttpOptions, type RequestOptions } from './http';
import { createServerToken, type Duration } from './token';
import { Agents } from './resources/agents';
import { Apps } from './resources/apps';
import { Bots } from './resources/bots';
import { Chats } from './resources/chats';
import { Messages } from './resources/messages';
import { Sources } from './resources/sources';
import { Users } from './resources/users';
import { Widget } from './resources/widget';

export interface ClientOptions extends HttpOptions {
  /** A B2B server token. */
  token: string;
}

export interface AppSecretOptions extends HttpOptions {
  appId: string;
  appSecret: string;
  tenantId?: string;
  expiresIn?: Duration;
}

export interface WaitForJobOptions<J = unknown> {
  /** Defaults to a status check for `completed`/`done`/`finished`/`success`/`succeeded`. */
  isDone?: (job: J) => boolean;
  /** Defaults to a status check for `failed`/`error`. */
  isFailed?: (job: J) => boolean;
  intervalMs?: number;
  timeoutMs?: number;
}

/** Error thrown by `waitForJob`; carries the last job payload. */
export class EthoraJobError<J = unknown> extends Error {
  override readonly name = 'EthoraJobError' as const;
  constructor(
    message: string,
    readonly job: J
  ) {
    super(message);
  }
}

/**
 * Top-level client for the Ethora B2B API.
 *
 * Authenticates every request with a server token (`x-custom-token` by
 * default, or `Authorization: Bearer` with `authMode: 'authorization'`).
 */
export class EthoraB2BClient {
  readonly http: HttpClient;
  readonly apps: Apps;
  readonly users: Users;
  readonly chats: Chats;
  readonly messages: Messages;
  readonly sources: Sources;
  readonly agents: Agents;
  readonly bots: Bots;
  readonly widget: Widget;

  constructor(options: ClientOptions);
  /** @internal — used by `withToken` to reuse an existing HTTP layer. */
  constructor(options: ClientOptions | HttpClient);
  constructor(options: ClientOptions | HttpClient) {
    if (options instanceof HttpClient) {
      this.http = options;
    } else {
      if (!options?.token) {
        throw new EthoraConfigError(
          'token is required; pass a server token or use EthoraB2BClient.withAppSecret(...)'
        );
      }
      this.http = new HttpClient(options);
    }

    this.apps = new Apps(this.http);
    this.users = new Users(this.http);
    this.chats = new Chats(this.http);
    this.messages = new Messages(this.http);
    this.sources = new Sources(this.http);
    this.agents = new Agents(this.http);
    this.bots = new Bots(this.http);
    this.widget = new Widget(this.http);
  }

  /**
   * Build a client that hand-signs a (legacy, non-revocable) server token from
   * an app secret. Prefer a minted token when you have an owner user JWT.
   */
  static withAppSecret(options: AppSecretOptions): EthoraB2BClient {
    const { appId, appSecret, tenantId, expiresIn, ...rest } = options;
    const token = createServerToken({ appId, appSecret, tenantId, expiresIn });
    return new EthoraB2BClient({ ...rest, token });
  }

  /** Clone this client with a different token (e.g. to act as a child app). */
  withToken(token: string): EthoraB2BClient {
    return new EthoraB2BClient(this.http.withToken(token));
  }

  /** Escape hatch for any route not wrapped by a resource. */
  request(method: string, path: string, opts: RequestOptions & { raw: true }): Promise<Response>;
  request<T = unknown>(method: string, path: string, opts?: RequestOptions): Promise<T>;
  request<T = unknown>(method: string, path: string, opts?: RequestOptions): Promise<T | Response> {
    return this.http.request<T>(method, path, opts);
  }

  /**
   * Introspect an Ethora JWT (B2B-only). `POST /internal/auth/verify`.
   * Requires `x-internal-secret` matching the install's INTERNAL_REQUESTS_SECRET.
   */
  verifyToken<T = unknown>(token: string, internalSecret?: string): Promise<T> {
    return this.http.post<T>('/internal/auth/verify', {
      body: { token },
      headers: internalSecret ? { 'x-internal-secret': internalSecret } : undefined,
    });
  }

  /**
   * Poll an async job until it finishes or the timeout is hit.
   *
   * @param fetchStatus - returns the job status payload
   * @returns the final job payload
   * @throws EthoraJobError when the job fails or does not finish in time
   */
  async waitForJob<J = unknown>(
    fetchStatus: () => Promise<J>,
    opts: WaitForJobOptions<J> = {}
  ): Promise<J> {
    const {
      intervalMs = 2000,
      timeoutMs = 120000,
      isDone = defaultIsDone,
      isFailed = defaultIsFailed,
    } = opts;

    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const job = await fetchStatus();
      if (isFailed(job)) throw new EthoraJobError('Ethora job failed', job);
      if (isDone(job)) return job;
      if (Date.now() >= deadline) {
        throw new EthoraJobError(`Ethora job did not finish within ${timeoutMs}ms`, job);
      }
      await sleep(intervalMs);
    }
  }
}

function statusOf(job: unknown): unknown {
  if (!job || typeof job !== 'object') return undefined;
  const j = job as { state?: unknown; status?: unknown; data?: { state?: unknown; status?: unknown } };
  return j.state || j.status || (j.data && (j.data.state || j.data.status));
}

function defaultIsDone(job: unknown): boolean {
  const s = String(statusOf(job) || '').toLowerCase();
  return ['completed', 'done', 'finished', 'success', 'succeeded'].includes(s);
}

function defaultIsFailed(job: unknown): boolean {
  const s = String(statusOf(job) || '').toLowerCase();
  return ['failed', 'error'].includes(s);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
