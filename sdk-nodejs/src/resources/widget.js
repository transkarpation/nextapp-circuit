'use strict'

/** AI website-widget appearance and conversations. */
class Widget {
  constructor(http) {
    this.http = http
  }

  /** Get stored widget appearance. `GET /v2/apps/{appId}/widget/appearance` */
  getAppearance(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/widget/appearance`)
  }

  /**
   * Replace stored widget appearance. `PUT /v2/apps/{appId}/widget/appearance`
   * Pass a map of `data-*` attribute names to values; `{}` clears everything.
   */
  setAppearance(appId, appearance) {
    return this.http.put(`/v2/apps/${enc(appId)}/widget/appearance`, {
      body: { appearance },
    })
  }

  /** List widget conversations. `GET /v2/apps/{appId}/widget/conversations` */
  listConversations(appId, { limit, offset } = {}) {
    return this.http.get(`/v2/apps/${enc(appId)}/widget/conversations`, {
      query: { limit, offset },
    })
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Widget }
