import crypto from 'node:crypto';
import { EthoraConfigError } from './errors';

/** A duration: seconds as a number, or a string like `90d`, `24h`, `30m`, `45s`. */
export type Duration = number | string;

export interface CreateServerTokenOptions {
  /** The scope app `_id`. */
  appId: string;
  /** The app's `tenantSecret`/`appSecret`. */
  appSecret: string;
  /** Parent app `_id`, if the token should carry one. */
  tenantId?: string;
  /** e.g. `90d`, `24h`, or seconds; omit for no expiry. */
  expiresIn?: Duration;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/** Translate a duration into whole seconds (`null` when not given). */
export function toSeconds(value: Duration | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Math.floor(value);
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(String(value).trim());
  if (!match) {
    throw new EthoraConfigError(
      `Invalid duration: ${value} (use a number of seconds or e.g. "90d", "24h", "30m")`
    );
  }
  const n = Number(match[1]);
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[(match[2] || 's') as 's' | 'm' | 'h' | 'd'];
  return n * mult;
}

/**
 * Derive the purpose-scoped signing secret the backend uses for server tokens.
 * Mirrors `helpers/authSecrets.js::deriveScopedSecret(secret, 'server')`.
 *
 * @returns hex-encoded HMAC
 */
export function deriveScopedSecret(appSecret: string, purpose = 'server'): string {
  return crypto
    .createHmac('sha256', String(appSecret))
    .update(`ethora:${purpose}:v1`)
    .digest('hex');
}

/**
 * Hand-sign a B2B server token (legacy, non-revocable scheme).
 *
 * The token is an HS256 JWT `{ data: { type: 'server', appId, tenantId? } }`
 * signed with `deriveScopedSecret(appSecret, 'server')`. Prefer a minted,
 * revocable token (`POST /v2/apps/{appId}/server-tokens`, see
 * `client.apps.createServerToken`) when you have an owner user JWT; this helper
 * exists for installs that integrate directly with an app secret.
 */
export function createServerToken(opts: CreateServerTokenOptions): string {
  const { appId, appSecret, tenantId, expiresIn } = opts ?? ({} as CreateServerTokenOptions);
  if (!appId) throw new EthoraConfigError('createServerToken: appId is required');
  if (!appSecret) throw new EthoraConfigError('createServerToken: appSecret is required');

  const secret = deriveScopedSecret(appSecret, 'server');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const data: { type: 'server'; appId: string; tenantId?: string } = {
    type: 'server',
    appId: String(appId),
  };
  if (tenantId) data.tenantId = String(tenantId);

  const payload: { data: typeof data; iat: number; exp?: number } = { data, iat: now };
  const expSeconds = toSeconds(expiresIn);
  if (expSeconds != null) payload.exp = now + expSeconds;

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}
