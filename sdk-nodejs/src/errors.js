'use strict'

/**
 * Error thrown for any non-2xx response from the Ethora API.
 *
 * The Ethora backend returns a canonical error envelope that carries a
 * machine-readable `code` and a `requestId`; both are surfaced here so callers
 * can branch on `err.code` (e.g. `SERVER_TOKEN_REVOKED`) and quote `requestId`
 * when reporting a problem.
 */
class EthoraApiError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'EthoraApiError'
    /** HTTP status code (e.g. 401, 422). */
    this.status = details.status
    /** Canonical error code from the backend (e.g. `VALIDATION_ERROR`). */
    this.code = details.code
    /** Server-assigned request id, useful when reporting an issue. */
    this.requestId = details.requestId
    /** Structured validation / error detail, when present. */
    this.details = details.details
    /** Parsed response body (object or string). */
    this.body = details.body
    /** HTTP method of the failing call. */
    this.method = details.method
    /** Request path of the failing call. */
    this.path = details.path
  }
}

/** Error thrown when the SDK is misconfigured (bad constructor args, etc.). */
class EthoraConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'EthoraConfigError'
  }
}

module.exports = { EthoraApiError, EthoraConfigError }
