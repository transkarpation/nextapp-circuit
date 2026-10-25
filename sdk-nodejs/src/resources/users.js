'use strict'

const { buildForm } = require('../form')

/** Provision, update, archive and administer end-users. */
class Users {
  constructor(http) {
    this.http = http
  }

  /**
   * Async batch create users in a target app (preferred for backends).
   * `POST /v2/apps/{appId}/users/batch` → `{ jobId }` (202). Poll `getBatchJob`.
   *
   * @param {string} appId
   * @param {object} opts
   * @param {Array} opts.usersList - `[{ email, firstName, lastName, password?, uuid?, profileImage? }]`
   * @param {boolean} [opts.bypassEmailConfirmation]
   * @param {Array} [opts.files] - optional multipart files referenced by `profileImageFileIndex`
   */
  createBatch(appId, { usersList, bypassEmailConfirmation, files } = {}) {
    if (files && files.length) {
      const form = buildForm(
        { usersList, bypassEmailConfirmation },
        files
      )
      return this.http.post(`/v2/apps/${enc(appId)}/users/batch`, { form })
    }
    return this.http.post(`/v2/apps/${enc(appId)}/users/batch`, {
      body: { usersList, bypassEmailConfirmation },
    })
  }

  /** Status/results of an app-scoped batch job. `GET /v2/apps/{appId}/users/batch/{jobId}` */
  getBatchJob(appId, jobId) {
    return this.http.get(`/v2/apps/${enc(appId)}/users/batch/${enc(jobId)}`)
  }

  /**
   * Archive (soft, default) or purge (`mode:'hard'`) users in an app.
   * `DELETE /v2/apps/{appId}/users/batch`
   */
  deleteBatch(appId, { usersIdList, mode, reason } = {}) {
    return this.http.delete(`/v2/apps/${enc(appId)}/users/batch`, {
      query: { mode, reason },
      body: { usersIdList },
    })
  }

  /** Restore a soft-archived user. `POST /v2/apps/{appId}/users/{userId}/restore` */
  restore(appId, userId) {
    return this.http.post(`/v2/apps/${enc(appId)}/users/${enc(userId)}/restore`)
  }

  /** Reset a user's MFA (admin recovery). `DELETE /v2/apps/{appId}/users/{userId}/mfa` */
  resetMfa(appId, userId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/users/${enc(userId)}/mfa`)
  }

  /** Remove a user's admin-panel access. `DELETE /v2/apps/{appId}/users/{userId}/access` */
  removeAccess(appId, userId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/users/${enc(userId)}/access`)
  }

  /** Grant platform super-admin (base app only). `POST .../superadmin` */
  grantSuperAdmin(appId, userId) {
    return this.http.post(`/v2/apps/${enc(appId)}/users/${enc(userId)}/superadmin`)
  }

  /** Revoke platform super-admin. `DELETE .../superadmin` */
  revokeSuperAdmin(appId, userId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/users/${enc(userId)}/superadmin`)
  }

  /** Read platform-level access flags. `GET .../platform-access` */
  getPlatformAccess(appId, userId) {
    return this.http.get(`/v2/apps/${enc(appId)}/users/${enc(userId)}/platform-access`)
  }

  /** Set platform-level access flags. `PATCH .../platform-access` */
  setPlatformAccess(appId, userId, flags) {
    return this.http.patch(`/v2/apps/${enc(appId)}/users/${enc(userId)}/platform-access`, {
      body: flags,
    })
  }

  /** List users of an app. `GET /v1/users/{appId}` */
  list(appId, query) {
    return this.http.get(`/v1/users/${enc(appId)}`, { query })
  }

  /** Resolve one user by xmppUsername (`{appId}_{userId}`). `GET /v1/apps/users/{xmppUsername}` */
  getByXmppUsername(xmppUsername) {
    return this.http.get(`/v1/apps/users/${enc(xmppUsername)}`)
  }

  /**
   * Synchronous batch create against the token's own app (B2B-only).
   * `POST /v1/users/batch`. Prefer the async `createBatch` for large imports.
   */
  createBatchSync({ usersList, bypassEmailConfirmation } = {}) {
    return this.http.post('/v1/users/batch', {
      body: { usersList, bypassEmailConfirmation },
    })
  }

  /** Delete users in the token's own app (B2B-only). `DELETE /v1/users/batch` */
  deleteBatchSync({ usersIdList } = {}) {
    return this.http.delete('/v1/users/batch', { body: { usersIdList } })
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Users }
