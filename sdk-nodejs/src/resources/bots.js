'use strict'

/** Per-app AI bot settings. */
class Bots {
  constructor(http) {
    this.http = http
  }

  /** Get AI bot settings for an app. `GET /v2/apps/{appId}/bot` */
  get(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/bot`)
  }

  /** Update AI bot settings for an app. `PUT /v2/apps/{appId}/bot` */
  update(appId, body) {
    return this.http.put(`/v2/apps/${enc(appId)}/bot`, { body })
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Bots }
