'use strict'

const { EthoraApiError, EthoraConfigError } = require('./errors')

/**
 * Thin HTTP layer over the Ethora API. Handles auth headers, query building,
 * JSON and multipart bodies, timeouts, and canonical error parsing.
 *
 * Uses the global `fetch`, `FormData` and `Blob` (Node >= 18). A custom
 * `fetch` implementation can be injected for tests or older runtimes.
 */
class HttpClient {
  constructor(options = {}) {
    const {
      baseUrl,
      token,
      authMode = 'x-custom-token',
      headers = {},
      timeoutMs = 60000,
      fetch: fetchImpl,
    } = options

    if (!baseUrl) throw new EthoraConfigError('baseUrl is required')

    this.baseUrl = String(baseUrl).replace(/\/+$/, '')
    this.token = token
    this.authMode = authMode
    this.defaultHeaders = headers
    this.timeoutMs = timeoutMs
    this.fetch = fetchImpl || globalThis.fetch
    if (typeof this.fetch !== 'function') {
      throw new EthoraConfigError(
        'global fetch is unavailable; use Node >= 18 or pass a `fetch` implementation'
      )
    }
  }

  /** Return a copy of this client that authenticates with a different token. */
  withToken(token) {
    return new HttpClient({
      baseUrl: this.baseUrl,
      token,
      authMode: this.authMode,
      headers: this.defaultHeaders,
      timeoutMs: this.timeoutMs,
      fetch: this.fetch,
    })
  }

  _authHeaders() {
    if (!this.token) return {}
    if (this.authMode === 'authorization') {
      return { Authorization: `Bearer ${this.token}` }
    }
    return { 'x-custom-token': this.token }
  }

  _buildUrl(path, query) {
    const url = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`))
    if (query && typeof query === 'object') {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) continue
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','))
        } else if (typeof value === 'boolean') {
          url.searchParams.set(key, value ? 'true' : 'false')
        } else {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }

  /**
   * Perform a request.
   *
   * @param {string} method - HTTP method
   * @param {string} path - path beginning with `/`
   * @param {object} [opts]
   * @param {object} [opts.query] - query-string params
   * @param {object} [opts.body] - JSON body
   * @param {FormData} [opts.form] - multipart body (takes precedence over body)
   * @param {object} [opts.headers] - extra headers
   * @param {number} [opts.timeoutMs] - per-request timeout override
   * @param {boolean} [opts.raw] - resolve with the raw Response (for binary downloads)
   * @returns {Promise<any>}
   */
  async request(method, path, opts = {}) {
    const { query, body, form, headers = {}, timeoutMs, raw = false } = opts
    const url = this._buildUrl(path, query)

    const finalHeaders = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...this._authHeaders(),
      ...headers,
    }

    let payload
    if (form != null) {
      payload = form // let fetch set the multipart boundary
    } else if (body != null) {
      finalHeaders['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }

    const controller = new AbortController()
    const limit = timeoutMs != null ? timeoutMs : this.timeoutMs
    const timer = limit ? setTimeout(() => controller.abort(), limit) : null

    let response
    try {
      response = await this.fetch(url, {
        method,
        headers: finalHeaders,
        body: payload,
        signal: controller.signal,
      })
    } catch (err) {
      if (timer) clearTimeout(timer)
      if (err && err.name === 'AbortError') {
        throw new EthoraApiError(`Request timed out after ${limit}ms`, {
          code: 'REQUEST_TIMEOUT',
          method,
          path,
        })
      }
      throw new EthoraApiError(`Network error: ${err.message}`, {
        code: 'NETWORK_ERROR',
        method,
        path,
      })
    } finally {
      if (timer) clearTimeout(timer)
    }

    if (raw) return response

    const parsed = await parseBody(response)

    if (!response.ok) {
      const envelope = parsed && typeof parsed === 'object' ? parsed : {}
      throw new EthoraApiError(
        envelope.error || envelope.message || `HTTP ${response.status}`,
        {
          status: response.status,
          code: envelope.code,
          requestId: envelope.requestId,
          details: envelope.details,
          body: parsed,
          method,
          path,
        }
      )
    }

    return parsed
  }

  get(path, opts) {
    return this.request('GET', path, opts)
  }
  post(path, opts) {
    return this.request('POST', path, opts)
  }
  put(path, opts) {
    return this.request('PUT', path, opts)
  }
  patch(path, opts) {
    return this.request('PATCH', path, opts)
  }
  delete(path, opts) {
    return this.request('DELETE', path, opts)
  }
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (response.status === 204) return null
  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  const text = await response.text()
  return text || null
}

module.exports = { HttpClient }
