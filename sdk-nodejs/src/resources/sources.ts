import { buildForm, type UploadFile } from '../form';
import { enc, type HttpClient } from '../http';

export type WatchSchedule = 'daily' | 'weekly' | false;

/** AI knowledge sources: website crawls and uploaded documents. */
export class Sources {
  constructor(private readonly http: HttpClient) {}

  private base(appId: string): string {
    return `/v2/apps/${enc(appId)}/sources`;
  }

  // --- Site crawl ------------------------------------------------------------

  /** Queue a website crawl. `POST /v2/apps/{appId}/sources/site-crawl` */
  crawlSite<T = unknown>(
    appId: string,
    { url, followLink }: { url: string; followLink?: boolean }
  ): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/site-crawl`, { body: { url, followLink } });
  }

  /** List crawled site sources. `GET /v2/apps/{appId}/sources/site-crawl` */
  listCrawls<T = unknown>(
    appId: string,
    { limit, offset }: { limit?: number; offset?: number } = {}
  ): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/site-crawl`, { query: { limit, offset } });
  }

  /** Get one crawled source with content. `GET .../site-crawl/{sourceId}` */
  getCrawl<T = unknown>(appId: string, sourceId: string): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/site-crawl/${enc(sourceId)}`);
  }

  /** Reindex a crawled URL. `POST .../site-crawl-reindex` */
  reindexCrawl<T = unknown>(appId: string, urlId: string): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/site-crawl-reindex`, { body: { urlId } });
  }

  /** Crawl job status. `GET .../site-crawl-jobs/{jobId}` */
  getCrawlJob<T = unknown>(appId: string, jobId: string): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/site-crawl-jobs/${enc(jobId)}`);
  }

  /** Cancel a running crawl. `POST .../site-crawl-jobs/{jobId}/cancel` */
  cancelCrawl<T = unknown>(appId: string, jobId: string): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/site-crawl-jobs/${enc(jobId)}/cancel`);
  }

  /** Set tags on a crawled source. `PATCH .../site-crawl/{sourceId}/tags` */
  setCrawlTags<T = unknown>(appId: string, sourceId: string, tags: string[]): Promise<T> {
    return this.http.patch<T>(`${this.base(appId)}/site-crawl/${enc(sourceId)}/tags`, {
      body: { tags },
    });
  }

  /** Delete a crawled record by URL. `DELETE .../site-crawl/url` */
  deleteCrawlByUrl<T = unknown>(appId: string, url: string): Promise<T> {
    return this.http.delete<T>(`${this.base(appId)}/site-crawl/url`, { body: { url } });
  }

  /** Batch delete crawled records by ids. `DELETE .../site-crawl-v2/url` */
  deleteCrawls<T = unknown>(
    appId: string,
    { ids, urls }: { ids?: string[]; urls?: string[] }
  ): Promise<T> {
    return this.http.delete<T>(`${this.base(appId)}/site-crawl-v2/url`, { body: { ids, urls } });
  }

  // --- Watched sites ---------------------------------------------------------

  /** List watched sites. `GET .../site-watches` */
  listWatches<T = unknown>(appId: string, { agentId }: { agentId?: string } = {}): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/site-watches`, { query: { agentId } });
  }

  /** Change a watch's schedule. `PATCH .../site-watches/{watchId}` */
  setWatchSchedule<T = unknown>(
    appId: string,
    watchId: string,
    schedule: WatchSchedule
  ): Promise<T> {
    return this.http.patch<T>(`${this.base(appId)}/site-watches/${enc(watchId)}`, {
      body: { schedule },
    });
  }

  /** Refresh a watched site now. `POST .../site-watches/{watchId}/refresh` */
  refreshWatch<T = unknown>(appId: string, watchId: string): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/site-watches/${enc(watchId)}/refresh`);
  }

  /** Re-index specific URLs now. `POST .../site-refresh-urls` */
  refreshUrls<T = unknown>(appId: string, urls: string[]): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/site-refresh-urls`, { body: { urls } });
  }

  // --- Refresh key -----------------------------------------------------------

  /** Get the Web Index refresh key. `GET .../refresh-key` */
  getRefreshKey<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/refresh-key`);
  }

  /** Create/replace the refresh key. `POST .../refresh-key` */
  createRefreshKey<T = unknown>(appId: string): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/refresh-key`);
  }

  /** Revoke the refresh key. `DELETE .../refresh-key` */
  revokeRefreshKey<T = unknown>(appId: string): Promise<T> {
    return this.http.delete<T>(`${this.base(appId)}/refresh-key`);
  }

  // --- Documents -------------------------------------------------------------

  /** Upload documents for ingestion (multipart). `POST .../sources/docs` */
  uploadDocs<T = unknown>(appId: string, files: Array<UploadFile | Blob>): Promise<T> {
    return this.http.post<T>(`${this.base(appId)}/docs`, { form: buildForm({}, files) });
  }

  /** List ingested documents. `GET .../sources/docs` */
  listDocs<T = unknown>(appId: string): Promise<T> {
    return this.http.get<T>(`${this.base(appId)}/docs`);
  }

  /** Set tags on a document. `PATCH .../sources/docs/{docId}/tags` */
  setDocTags<T = unknown>(appId: string, docId: string, tags: string[]): Promise<T> {
    return this.http.patch<T>(`${this.base(appId)}/docs/${enc(docId)}/tags`, { body: { tags } });
  }

  /** Delete a document. `DELETE .../sources/docs/{docId}` */
  deleteDoc<T = unknown>(appId: string, docId: string): Promise<T> {
    return this.http.delete<T>(`${this.base(appId)}/docs/${enc(docId)}`);
  }
}
