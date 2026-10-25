'use strict'

const { buildForm } = require('../form')

/** AI knowledge sources: website crawls and uploaded documents. */
class Sources {
  constructor(http) {
    this.http = http
  }

  // --- Site crawl ------------------------------------------------------------

  /** Queue a website crawl. `POST /v2/apps/{appId}/sources/site-crawl` */
  crawlSite(appId, { url, followLink } = {}) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/site-crawl`, {
      body: { url, followLink },
    })
  }

  /** List crawled site sources. `GET /v2/apps/{appId}/sources/site-crawl` */
  listCrawls(appId, { limit, offset } = {}) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/site-crawl`, {
      query: { limit, offset },
    })
  }

  /** Get one crawled source with content. `GET .../site-crawl/{sourceId}` */
  getCrawl(appId, sourceId) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/site-crawl/${enc(sourceId)}`)
  }

  /** Reindex a crawled URL. `POST .../site-crawl-reindex` */
  reindexCrawl(appId, urlId) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/site-crawl-reindex`, {
      body: { urlId },
    })
  }

  /** Crawl job status. `GET .../site-crawl-jobs/{jobId}` */
  getCrawlJob(appId, jobId) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/site-crawl-jobs/${enc(jobId)}`)
  }

  /** Cancel a running crawl. `POST .../site-crawl-jobs/{jobId}/cancel` */
  cancelCrawl(appId, jobId) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/site-crawl-jobs/${enc(jobId)}/cancel`)
  }

  /** Set tags on a crawled source. `PATCH .../site-crawl/{sourceId}/tags` */
  setCrawlTags(appId, sourceId, tags) {
    return this.http.patch(`/v2/apps/${enc(appId)}/sources/site-crawl/${enc(sourceId)}/tags`, {
      body: { tags },
    })
  }

  /** Delete a crawled record by URL. `DELETE .../site-crawl/url` */
  deleteCrawlByUrl(appId, url) {
    return this.http.delete(`/v2/apps/${enc(appId)}/sources/site-crawl/url`, { body: { url } })
  }

  /** Batch delete crawled records by ids. `DELETE .../site-crawl-v2/url` */
  deleteCrawls(appId, { ids, urls } = {}) {
    return this.http.delete(`/v2/apps/${enc(appId)}/sources/site-crawl-v2/url`, {
      body: { ids, urls },
    })
  }

  // --- Watched sites ---------------------------------------------------------

  /** List watched sites. `GET .../site-watches` */
  listWatches(appId, { agentId } = {}) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/site-watches`, { query: { agentId } })
  }

  /** Change a watch's schedule. `PATCH .../site-watches/{watchId}` */
  setWatchSchedule(appId, watchId, schedule) {
    return this.http.patch(`/v2/apps/${enc(appId)}/sources/site-watches/${enc(watchId)}`, {
      body: { schedule },
    })
  }

  /** Refresh a watched site now. `POST .../site-watches/{watchId}/refresh` */
  refreshWatch(appId, watchId) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/site-watches/${enc(watchId)}/refresh`)
  }

  /** Re-index specific URLs now. `POST .../site-refresh-urls` */
  refreshUrls(appId, urls) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/site-refresh-urls`, { body: { urls } })
  }

  // --- Refresh key -----------------------------------------------------------

  /** Get the Web Index refresh key. `GET .../refresh-key` */
  getRefreshKey(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/refresh-key`)
  }

  /** Create/replace the refresh key. `POST .../refresh-key` */
  createRefreshKey(appId) {
    return this.http.post(`/v2/apps/${enc(appId)}/sources/refresh-key`)
  }

  /** Revoke the refresh key. `DELETE .../refresh-key` */
  revokeRefreshKey(appId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/sources/refresh-key`)
  }

  // --- Documents -------------------------------------------------------------

  /**
   * Upload documents for ingestion (multipart). `POST .../sources/docs`
   * @param {string} appId
   * @param {Array} files - `[{ data, filename, contentType }]` or Blobs
   */
  uploadDocs(appId, files) {
    const form = buildForm({}, files)
    return this.http.post(`/v2/apps/${enc(appId)}/sources/docs`, { form })
  }

  /** List ingested documents. `GET .../sources/docs` */
  listDocs(appId) {
    return this.http.get(`/v2/apps/${enc(appId)}/sources/docs`)
  }

  /** Set tags on a document. `PATCH .../sources/docs/{docId}/tags` */
  setDocTags(appId, docId, tags) {
    return this.http.patch(`/v2/apps/${enc(appId)}/sources/docs/${enc(docId)}/tags`, {
      body: { tags },
    })
  }

  /** Delete a document. `DELETE .../sources/docs/{docId}` */
  deleteDoc(appId, docId) {
    return this.http.delete(`/v2/apps/${enc(appId)}/sources/docs/${enc(docId)}`)
  }
}

function enc(v) {
  return encodeURIComponent(String(v))
}

module.exports = { Sources }
