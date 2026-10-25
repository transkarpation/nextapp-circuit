export interface EthoraApiErrorDetails {
  status?: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  body?: unknown;
  method?: string;
  path?: string;
}

/**
 * Error thrown for any non-2xx response from the Ethora API.
 *
 * The Ethora backend returns a canonical error envelope that carries a
 * machine-readable `code` and a `requestId`; both are surfaced here so callers
 * can branch on `err.code` (e.g. `SERVER_TOKEN_REVOKED`) and quote `requestId`
 * when reporting a problem.
 */
export class EthoraApiError extends Error {
  override readonly name = 'EthoraApiError' as const;
  /** HTTP status code (e.g. 401, 422). */
  readonly status?: number;
  /** Canonical error code from the backend (e.g. `VALIDATION_ERROR`). */
  readonly code?: string;
  /** Server-assigned request id, useful when reporting an issue. */
  readonly requestId?: string;
  /** Structured validation / error detail, when present. */
  readonly details?: unknown;
  /** Parsed response body (object or string). */
  readonly body?: unknown;
  /** HTTP method of the failing call. */
  readonly method?: string;
  /** Request path of the failing call. */
  readonly path?: string;

  constructor(message: string, details: EthoraApiErrorDetails = {}) {
    super(message);
    this.status = details.status;
    this.code = details.code;
    this.requestId = details.requestId;
    this.details = details.details;
    this.body = details.body;
    this.method = details.method;
    this.path = details.path;
  }
}

/** Error thrown when the SDK is misconfigured (bad constructor args, etc.). */
export class EthoraConfigError extends Error {
  override readonly name = 'EthoraConfigError' as const;
}
