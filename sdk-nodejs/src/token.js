'use strict'

const crypto = require('crypto')
const { EthoraConfigError } = require('./errors')

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/**
 * Translate a duration into whole seconds.
 * Accepts a number (seconds) or a string like `90d`, `24h`, `30m`, `45s`.
 */
function toSeconds(value) {
  if (value == null) return null
  if (typeof value === 'number') return Math.floor(value)
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(String(value).trim())
  if (!match) {
    throw new EthoraConfigError(
      `Invalid duration: ${value} (use a number of seconds or e.g. "90d", "24h", "30m")`
    )
  }
  const n = Number(match[1])
  const unit = match[2] || 's'
  const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit]
  return n * mult
}

/**
 * Derive the purpose-scoped signing secret the backend uses for server tokens.
 * Mirrors `helpers/authSecrets.js::deriveScopedSecret(secret, 'server')`.
 *
 * @param {string} appSecret - the app's `tenantSecret` (or `appSecret` fallback)
 * @param {string} [purpose='server']
 * @returns {string} hex-encoded HMAC
 */
function deriveScopedSecret(appSecret, purpose = 'server') {
  return crypto
    .createHmac('sha256', String(appSecret))
    .update(`ethora:${purpose}:v1`)
    .digest('hex')
}

/**
 * Hand-sign a B2B server token (legacy, non-revocable scheme).
 *
 * The token is an HS256 JWT `{ data: { type: 'server', appId, tenantId? } }`
 * signed with `deriveScopedSecret(appSecret, 'server')`. Prefer a minted,
 * revocable token (`POST /v2/apps/{appId}/server-tokens`, see
 * `client.serverTokens.create`) when you have an owner user JWT; this helper
 * exists for installs that integrate directly with an app secret.
 *
 * @param {object} opts
 * @param {string} opts.appId - the scope app `_id`
 * @param {string} opts.appSecret - the app's `tenantSecret`/`appSecret`
 * @param {string} [opts.tenantId] - parent app `_id`, if the token should carry one
 * @param {string|number} [opts.expiresIn] - e.g. `90d`, `24h`, or seconds; omit for no expiry
 * @returns {string} a signed JWT
 */
function createServerToken(opts = {}) {
  const { appId, appSecret, tenantId, expiresIn } = opts
  if (!appId) throw new EthoraConfigError('createServerToken: appId is required')
  if (!appSecret) throw new EthoraConfigError('createServerToken: appSecret is required')

  const secret = deriveScopedSecret(appSecret, 'server')
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const data = { type: 'server', appId: String(appId) }
  if (tenantId) data.tenantId = String(tenantId)

  const payload = { data, iat: now }
  const expSeconds = toSeconds(expiresIn)
  if (expSeconds != null) payload.exp = now + expSeconds

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signingInput}.${signature}`
}

module.exports = { createServerToken, deriveScopedSecret, toSeconds }
