'use strict'

/** Chat rooms, membership, profiles and broadcasts. */
class Chats {
  constructor(http) {
    this.http = http
  }

  /** Create a public/group chat. `POST /v2/apps/{appId}/chats` */
  create(appId, body) {
    return this.http.post(`/v2/apps/${enc(appId)}/chats`, { body })
  }

  /** Open/return a 1-1 chat between two app users. `POST /v2/apps/{appId}/chats/private` */
  createPrivate(appId, { members, e2ee } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/chats/private`, {
      body: { members, e2ee },
    })
  }

  /** Delete a chat by canonical room name. `DELETE /v2/apps/{appId}/chats` */
  delete(appId, name) {
    return this.http.delete(`/v2/apps/${enc(appId)}/chats`, { body: { name } })
  }

  /** List all chats in an app. `GET /v2/apps/{appId}/chats` */
  list(appId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/chats`, { query })
  }

  /** List chats a user belongs to. `GET /v2/apps/{appId}/users/{userId}/chats` */
  listForUser(appId, userId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/users/${enc(userId)}/chats`, { query })
  }

  /** Update chat title/description. `PATCH /v2/apps/{appId}/chats/{chatId}` */
  updateMeta(appId, chatId, body) {
    return this.http.patch(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}`, { body })
  }

  /** Add members to a chat. `POST /v2/apps/{appId}/chats/users-access` */
  addMembers(appId, { chatName, members } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/chats/users-access`, {
      body: { chatName, members },
    })
  }

  /** Remove members from a chat. `DELETE /v2/apps/{appId}/chats/users-access` */
  removeMembers(appId, { chatName, members } = {}) {
    return this.http.delete(`/v2/apps/${enc(appId)}/chats/users-access`, {
      body: { chatName, members },
    })
  }

  /**
   * Batch-update user profiles (path-explicit; works for child apps).
   * `PATCH /v2/apps/{appId}/chats/users`. Inspect each item's `status`.
   */
  patchUsers(appId, users) {
    const body = Array.isArray(users) ? { users } : users
    return this.http.patch(`/v2/apps/${enc(appId)}/chats/users`, { body })
  }

  /**
   * Queue an app-wide/targeted broadcast. `POST /v2/apps/{appId}/chats/broadcast`
   * → `{ jobId, statusUrl }` (202). Poll `getBroadcastJob`.
   */
  broadcast(appId, body) {
    return this.http.post(`/v2/apps/${enc(appId)}/chats/broadcast`, { body })
  }

  /** Broadcast job status. `GET /v2/apps/{appId}/chats/broadcast/{jobId}` */
  getBroadcastJob(appId, jobId) {
    return this.http.get(`/v2/apps/${enc(appId)}/chats/broadcast/${enc(jobId)}`)
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Chats }
