'use strict'

/** Message history, search, context windows and unread counts. */
class Messages {
  constructor(http) {
    this.http = http
  }

  /** Read a chat's history from the MAM archive. `GET /v2/apps/{appId}/chats/{chatId}/messages` */
  history(appId, chatId, { limit, before } = {}) {
    return this.http.get(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages`, {
      query: { limit, before },
    })
  }

  /** Bulk-delete a chat's history. `DELETE /v2/apps/{appId}/chats/{chatId}/messages` */
  deleteHistory(appId, chatId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages`)
  }

  /**
   * Search archived messages by text. `GET /v2/apps/{appId}/messages/search`
   * @param {object} query - `{ q, mode?, chatId?, fromUserId?, since?, until?, sort?, limit?, offset? }`
   */
  search(appId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/messages/search`, { query })
  }

  /** Load context around a message. `GET /v2/apps/{appId}/chats/{chatId}/messages/context` */
  context(appId, chatId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/chats/${enc(chatId)}/messages/context`, {
      query,
    })
  }

  /** Batch unread counts per room for a set of users. `POST /v2/apps/{appId}/users/unread-counts` */
  unreadCounts(appId, { userIds, mode, cap } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/users/unread-counts`, {
      body: { userIds, mode, cap },
    })
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Messages }
