'use strict'

const { HttpClient } = require('./http')
const { createServerToken } = require('./token')
const { EthoraConfigError } = require('./errors')
const { Apps } = require('./resources/apps')
const { Users } = require('./resources/users')
const { Chats } = require('./resources/chats')
const { Messages } = require('./resources/messages')
const { Sources } = require('./resources/sources')
const { Agents } = require('./resources/agents')
const { Bots } = require('./resources/bots')
const { Widget } = require('./resources/widget')

/**
 * Top-level client for the Ethora B2B API.
 *
 * Authenticates every request with a server token (`x-custom-token` by
 * default, or `Authorization: Bearer` with `authMode: 'authorization'`).
 */
class EthoraB2BClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - e.g. `https://api.example.com`
   * @param {string} options.token - a B2B server token
   * @param {'x-custom-token'|'authorization'} [options.authMode='x-custom-token']
   * @param {object} [options.headers] - extra default headers (e.g. x-internal-secret)
   * @param {number} [options.timeoutMs=60000]
   * @param {Function} [options.fetch] - custom fetch implementation
   */
  constructor(options = {}) {
    if (!options.token) {
      throw new EthoraConfigError(
        'token is required; pass a server token or use EthoraB2BClient.withAppSecret(...)'
      )
    }
    this.http = new HttpClient(options)
    this._wireResources()
  }

  /**
   * Build a client that hand-signs a (legacy, non-revocable) server token from
   * an app secret. Prefer a minted token when you have an owner user JWT.
   *
   * @param {object} options - `{ baseUrl, appId, appSecret, tenantId?, expiresIn?, ...httpOptions }`
   */
  static withAppSecret(options = {}) {
    const { appId, appSecret, tenantId, expiresIn, ...rest } = options
    const token = createServerToken({ appId, appSecret, tenantId, expiresIn })
    return new EthoraB2BClient({ ...rest, token })
  }

  _wireResources() {
    this.apps = new Apps(this.http)
    this.users = new Users(this.http)
    this.chats = new Chats(this.http)
    this.messages = new Messages(this.http)
    this.sources = new Sources(this.http)
    this.agents = new Agents(this.http)
    this.bots = new Bots(this.http)
    this.widget = new Widget(this.http)
  }

  /** Clone this client with a different token (e.g. to act as a child app). */
  withToken(token) {
    const clone = Object.create(EthoraB2BClient.prototype)
    clone.http = this.http.withToken(token)
    clone._wireResources()
    return clone
  }

  /**
   * Escape hatch for any route not wrapped by a resource.
   * @param {string} method
   * @param {string} path
   * @param {object} [opts] - `{ query, body, form, headers, timeoutMs, raw }`
   */
  request(method, path, opts) {
    return this.http.request(method, path, opts)
  }

  /**
   * Introspect an Ethora JWT (B2B-only). `POST /internal/auth/verify`.
   * Requires `x-internal-secret` matching the install's INTERNAL_REQUESTS_SECRET.
   */
  verifyToken(token, internalSecret) {
    return this.http.post('/internal/auth/verify', {
      body: { token },
      headers: internalSecret ? { 'x-internal-secret': internalSecret } : undefined,
    })
  }

  /**
   * Poll an async job until it finishes or the timeout is hit.
   *
   * @param {() => Promise<any>} fetchStatus - returns the job status payload
   * @param {object} [opts]
   * @param {(job:any)=>boolean} [opts.isDone] - defaults to a sensible status check
   * @param {(job:any)=>boolean} [opts.isFailed]
   * @param {number} [opts.intervalMs=2000]
   * @param {number} [opts.timeoutMs=120000]
   * @returns {Promise<any>} the final job payload
   */
  async waitForJob(fetchStatus, opts = {}) {
    const {
      intervalMs = 2000,
      timeoutMs = 120000,
      isDone = defaultIsDone,
      isFailed = defaultIsFailed,
    } = opts

    const deadline = Date.now() + timeoutMs
    for (;;) {
      const job = await fetchStatus()
      if (isFailed(job)) {
        const err = new Error('Ethora job failed')
        err.job = job
        throw err
      }
      if (isDone(job)) return job
      if (Date.now() >= deadline) {
        const err = new Error(`Ethora job did not finish within ${timeoutMs}ms`)
        err.job = job
        throw err
      }
      await sleep(intervalMs)
    }
  }
}

function statusOf(job) {
  if (!job || typeof job !== 'object') return undefined
  return job.state || job.status || (job.data && (job.data.state || job.data.status))
}

function defaultIsDone(job) {
  const s = String(statusOf(job) || '').toLowerCase()
  return ['completed', 'done', 'finished', 'success', 'succeeded'].includes(s)
}

function defaultIsFailed(job) {
  const s = String(statusOf(job) || '').toLowerCase()
  return ['failed', 'error'].includes(s)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = { EthoraB2BClient }
