'use strict'

const { buildForm } = require('../form')

/** Apps, tenancy, tokens, provisioning. */
class Apps {
  constructor(http) {
    this.http = http
  }

  /** List apps visible to the token's tenant actor. `GET /v2/apps` */
  list(query) {
    return this.http.get('/v2/apps', { query })
  }

  /** Create a child app. `POST /v2/apps` */
  create(body) {
    return this.http.post('/v2/apps', { body })
  }

  /** Get one app. `GET /v2/apps/{appId}` */
  get(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}`)
  }

  /** Partially update an app. `PATCH /v2/apps/{appId}` */
  update(appId, body) {
    return this.http.patch(`/v2/apps/${enc(appId)}`, { body })
  }

  /**
   * Archive (soft, default) or purge (`mode: 'hard'`) an app.
   * `DELETE /v2/apps/{appId}` — hard mode returns 202 + jobId.
   */
  delete(appId, { mode, reason } = {}) {
    return this.http.delete(`/v2/apps/${enc(appId)}`, { query: { mode, reason } })
  }

  /** Restore an archived app. `POST /v2/apps/{appId}/restore` */
  restore(appId) {
    return this.http.post(`/v2/apps/${enc(appId)}/restore`)
  }

  /** Poll a hard-delete cascade purge job. `GET /v2/apps/purge-jobs/{jobId}` */
  getPurgeJob(jobId) {
    return this.http.get(`/v2/apps/purge-jobs/${enc(jobId)}`)
  }

  /**
   * Export an app bundle. `GET /v2/apps/{appId}/export`.
   * With `format: 'zip'` the raw Response is returned so you can stream the archive.
   */
  export(appId, { format = 'json', include } = {}) {
    if (format === 'zip') {
      return this.http.get(`/v2/apps/${enc(appId)}/export`, {
        query: { format, include },
        raw: true,
      })
    }
    return this.http.get(`/v2/apps/${enc(appId)}/export`, { query: { format, include } })
  }

  /** Import an app bundle (JSON). `POST /v2/apps/import` */
  import(bundle, { domainNameOverride } = {}) {
    return this.http.post('/v2/apps/import', {
      body: bundle,
      query: { domainNameOverride },
    })
  }

  /** Provision default rooms. `POST /v2/apps/{appId}/provision` */
  provision(appId, rooms) {
    const body = Array.isArray(rooms) ? { rooms } : rooms
    return this.http.post(`/v2/apps/${enc(appId)}/provision`, { body })
  }

  /** Provision a tenant-owner chat session. `POST /v2/apps/{appId}/owner-session` */
  ownerSession(appId) {
    return this.http.post(`/v2/apps/${enc(appId)}/owner-session`)
  }

  // --- App tokens (metadata-managed, returned once) --------------------------

  /** List app-token metadata. `GET /v2/apps/{appId}/tokens` */
  listTokens(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/tokens`)
  }

  /** Create an app token (returned once). `POST /v2/apps/{appId}/tokens` */
  createToken(appId, { label } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/tokens`, { body: { label } })
  }

  /** Rotate an app token. `POST /v2/apps/{appId}/tokens/{tokenId}/rotate` */
  rotateToken(appId, tokenId, { label } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/tokens/${enc(tokenId)}/rotate`, {
      body: { label },
    })
  }

  /** Revoke an app token. `DELETE /v2/apps/{appId}/tokens/{tokenId}` */
  revokeToken(appId, tokenId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/tokens/${enc(tokenId)}`)
  }

  // --- Minted server tokens (revocable; need an OWNER USER JWT) --------------

  /**
   * List minted server tokens. `GET /v2/apps/{appId}/server-tokens`.
   * Note: creating/listing minted server tokens requires an owner USER JWT,
   * not a B2B server token.
   */
  listServerTokens(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/server-tokens`)
  }

  /** Mint a revocable server token (owner USER JWT). `POST /v2/apps/{appId}/server-tokens` */
  createServerToken(appId, { name, ttlDays } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/server-tokens`, {
      body: { name, ttlDays },
    })
  }

  /** Revoke a minted server token. `DELETE /v2/apps/{appId}/server-tokens/{id}` */
  revokeServerToken(appId, id) {
    return this.http.delete(`/v2/apps/${enc(appId)}/server-tokens/${enc(id)}`)
  }

  /** AI token usage for an app. `GET /v2/apps/{appId}/ai-usage` */
  aiUsage(appId, { from, to } = {}) {
    return this.http.get(`/v2/apps/${enc(appId)}/ai-usage`, { query: { from, to } })
  }
}

// Multipart import lives on the prototype but is kept here for clarity.
Apps.prototype.importZip = function importZip(zip, { filename = 'bundle.zip', domainNameOverride } = {}) {
  const form = buildForm({}, [{ data: zip, filename, contentType: 'application/zip' }], 'bundle')
  return this.http.post('/v2/apps/import', { form, query: { domainNameOverride } })
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Apps }
