'use strict'

/** AI agents and bot instances. */
class Agents {
  constructor(http) {
    this.http = http
  }

  /** List agents in an app. `GET /v2/apps/{appId}/agents` */
  list(appId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/agents`, { query })
  }

  /** Create an agent for an app. `POST /v2/apps/{appId}/agents` */
  create(appId, body) {
    return this.http.post(`/v2/apps/${enc(appId)}/agents`, { body })
  }

  /** Delete an app's agent. `DELETE /v2/apps/{appId}/agents/{idOrAddress}` */
  delete(appId, idOrAddress) {
    return this.http.delete(`/v2/apps/${enc(appId)}/agents/${enc(idOrAddress)}`)
  }

  /** Add an agent to a chat. `POST /v2/apps/{appId}/agents/{idOrAddress}/invite-to-chat` */
  inviteToChat(appId, idOrAddress, { chatJid, chatId } = {}) {
    return this.http.post(
      `/v2/apps/${enc(appId)}/agents/${enc(idOrAddress)}/invite-to-chat`,
      { body: { chatJid, chatId } }
    )
  }

  /**
   * One-shot synchronous ask: text in, the agent's reply out (B2B-only).
   * `POST /v2/agents/{id}/reply`. Can take 10-30s — set a generous timeout.
   */
  reply(id, text, { timeoutMs = 60000 } = {}) {
    return this.http.post(`/v2/agents/${enc(id)}/reply`, {
      body: { text },
      timeoutMs,
    })
  }

  /** Get a single agent (account-level). `GET /v2/agents/{idOrAddress}` */
  get(idOrAddress) {
    return this.http.get(`/v2/agents/${enc(idOrAddress)}`)
  }

  /** Update an agent. `PUT /v2/agents/{idOrAddress}` */
  update(idOrAddress, body) {
    return this.http.put(`/v2/agents/${enc(idOrAddress)}`, { body })
  }

  /** List bot instances in an app. `GET /v2/apps/{appId}/bot-instances` */
  listBotInstances(appId, query) {
    return this.http.get(`/v2/apps/${enc(appId)}/bot-instances`, { query })
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Agents }
