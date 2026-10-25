// Type definitions for ethora-b2b-sdk

export interface HttpOptions {
  baseUrl: string;
  authMode?: 'x-custom-token' | 'authorization';
  headers?: Record<string, string>;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface ClientOptions extends HttpOptions {
  token: string;
}

export interface AppSecretOptions extends HttpOptions {
  appId: string;
  appSecret: string;
  tenantId?: string;
  expiresIn?: string | number;
}

export interface CreateServerTokenOptions {
  appId: string;
  appSecret: string;
  tenantId?: string;
  expiresIn?: string | number;
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  timeoutMs?: number;
  raw?: boolean;
}

export interface WaitForJobOptions {
  isDone?: (job: any) => boolean;
  isFailed?: (job: any) => boolean;
  intervalMs?: number;
  timeoutMs?: number;
}

/** A file to upload in a multipart request. */
export interface UploadFile {
  data: Buffer | Uint8Array | Blob | string;
  filename?: string;
  contentType?: string;
}

export interface UserDataB2B {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  uuid?: string;
  profileImage?: string;
  profileImageFileIndex?: number;
}

export class EthoraApiError extends Error {
  name: 'EthoraApiError';
  status?: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  body?: unknown;
  method?: string;
  path?: string;
}

export class EthoraConfigError extends Error {
  name: 'EthoraConfigError';
}

export function createServerToken(opts: CreateServerTokenOptions): string;
export function deriveScopedSecret(appSecret: string, purpose?: string): string;

export class Apps {
  list(query?: Record<string, unknown>): Promise<any>;
  create(body: Record<string, unknown>): Promise<any>;
  get(appId: string): Promise<any>;
  update(appId: string, body: Record<string, unknown>): Promise<any>;
  delete(appId: string, opts?: { mode?: 'soft' | 'hard'; reason?: string }): Promise<any>;
  restore(appId: string): Promise<any>;
  getPurgeJob(jobId: string): Promise<any>;
  export(appId: string, opts?: { format?: 'json' | 'zip'; include?: string }): Promise<any>;
  import(bundle: unknown, opts?: { domainNameOverride?: string }): Promise<any>;
  importZip(zip: Buffer | Uint8Array | Blob, opts?: { filename?: string; domainNameOverride?: string }): Promise<any>;
  provision(appId: string, rooms: Array<Record<string, unknown>> | { rooms: Array<Record<string, unknown>> }): Promise<any>;
  ownerSession(appId: string): Promise<any>;
  listTokens(appId: string): Promise<any>;
  createToken(appId: string, opts?: { label?: string }): Promise<any>;
  rotateToken(appId: string, tokenId: string, opts?: { label?: string }): Promise<any>;
  revokeToken(appId: string, tokenId: string): Promise<any>;
  listServerTokens(appId: string): Promise<any>;
  createServerToken(appId: string, opts?: { name?: string; ttlDays?: number }): Promise<any>;
  revokeServerToken(appId: string, id: string): Promise<any>;
  aiUsage(appId: string, opts?: { from?: string; to?: string }): Promise<any>;
}

export class Users {
  createBatch(appId: string, opts: { usersList: UserDataB2B[]; bypassEmailConfirmation?: boolean; files?: UploadFile[] }): Promise<any>;
  getBatchJob(appId: string, jobId: string): Promise<any>;
  deleteBatch(appId: string, opts: { usersIdList: string[]; mode?: 'soft' | 'hard'; reason?: string }): Promise<any>;
  restore(appId: string, userId: string): Promise<any>;
  resetMfa(appId: string, userId: string): Promise<any>;
  removeAccess(appId: string, userId: string): Promise<any>;
  grantSuperAdmin(appId: string, userId: string): Promise<any>;
  revokeSuperAdmin(appId: string, userId: string): Promise<any>;
  getPlatformAccess(appId: string, userId: string): Promise<any>;
  setPlatformAccess(appId: string, userId: string, flags: { superadmin?: boolean; agents?: boolean; netStats?: boolean }): Promise<any>;
  list(appId: string, query?: Record<string, unknown>): Promise<any>;
  getByXmppUsername(xmppUsername: string): Promise<any>;
  createBatchSync(opts: { usersList: UserDataB2B[]; bypassEmailConfirmation?: boolean }): Promise<any>;
  deleteBatchSync(opts: { usersIdList: string[] }): Promise<any>;
}

export class Chats {
  create(appId: string, body: Record<string, unknown>): Promise<any>;
  createPrivate(appId: string, opts: { members: string[]; e2ee?: boolean }): Promise<any>;
  delete(appId: string, name: string): Promise<any>;
  list(appId: string, query?: Record<string, unknown>): Promise<any>;
  listForUser(appId: string, userId: string, query?: Record<string, unknown>): Promise<any>;
  updateMeta(appId: string, chatId: string, body: { title?: string; description?: string }): Promise<any>;
  addMembers(appId: string, opts: { chatName: string; members: string[] }): Promise<any>;
  removeMembers(appId: string, opts: { chatName: string; members: string[] }): Promise<any>;
  patchUsers(appId: string, users: Array<Record<string, unknown>> | { users: Array<Record<string, unknown>> }): Promise<any>;
  broadcast(appId: string, body: Record<string, unknown>): Promise<any>;
  getBroadcastJob(appId: string, jobId: string): Promise<any>;
}

export class Messages {
  history(appId: string, chatId: string, opts?: { limit?: number; before?: number }): Promise<any>;
  deleteHistory(appId: string, chatId: string): Promise<any>;
  search(appId: string, query: Record<string, unknown>): Promise<any>;
  context(appId: string, chatId: string, query: Record<string, unknown>): Promise<any>;
  unreadCounts(appId: string, opts: { userIds: string[]; mode?: 'count' | 'flag'; cap?: number }): Promise<any>;
}

export class Sources {
  crawlSite(appId: string, opts: { url: string; followLink?: boolean }): Promise<any>;
  listCrawls(appId: string, opts?: { limit?: number; offset?: number }): Promise<any>;
  getCrawl(appId: string, sourceId: string): Promise<any>;
  reindexCrawl(appId: string, urlId: string): Promise<any>;
  getCrawlJob(appId: string, jobId: string): Promise<any>;
  cancelCrawl(appId: string, jobId: string): Promise<any>;
  setCrawlTags(appId: string, sourceId: string, tags: string[]): Promise<any>;
  deleteCrawlByUrl(appId: string, url: string): Promise<any>;
  deleteCrawls(appId: string, opts: { ids?: string[]; urls?: string[] }): Promise<any>;
  listWatches(appId: string, opts?: { agentId?: string }): Promise<any>;
  setWatchSchedule(appId: string, watchId: string, schedule: 'daily' | 'weekly' | false): Promise<any>;
  refreshWatch(appId: string, watchId: string): Promise<any>;
  refreshUrls(appId: string, urls: string[]): Promise<any>;
  getRefreshKey(appId: string): Promise<any>;
  createRefreshKey(appId: string): Promise<any>;
  revokeRefreshKey(appId: string): Promise<any>;
  uploadDocs(appId: string, files: UploadFile[]): Promise<any>;
  listDocs(appId: string): Promise<any>;
  setDocTags(appId: string, docId: string, tags: string[]): Promise<any>;
  deleteDoc(appId: string, docId: string): Promise<any>;
}

export class Agents {
  list(appId: string, query?: Record<string, unknown>): Promise<any>;
  create(appId: string, body: Record<string, unknown>): Promise<any>;
  delete(appId: string, idOrAddress: string): Promise<any>;
  inviteToChat(appId: string, idOrAddress: string, opts: { chatJid?: string; chatId?: string }): Promise<any>;
  reply(id: string, text: string, opts?: { timeoutMs?: number }): Promise<any>;
  get(idOrAddress: string): Promise<any>;
  update(idOrAddress: string, body: Record<string, unknown>): Promise<any>;
  listBotInstances(appId: string, query?: Record<string, unknown>): Promise<any>;
}

export class Bots {
  get(appId: string): Promise<any>;
  update(appId: string, body: Record<string, unknown>): Promise<any>;
}

export class Widget {
  getAppearance(appId: string): Promise<any>;
  setAppearance(appId: string, appearance: Record<string, unknown>): Promise<any>;
  listConversations(appId: string, opts?: { limit?: number; offset?: number }): Promise<any>;
}

export class EthoraB2BClient {
  constructor(options: ClientOptions);
  static withAppSecret(options: AppSecretOptions): EthoraB2BClient;

  apps: Apps;
  users: Users;
  chats: Chats;
  messages: Messages;
  sources: Sources;
  agents: Agents;
  bots: Bots;
  widget: Widget;

  withToken(token: string): EthoraB2BClient;
  request(method: string, path: string, opts?: RequestOptions): Promise<any>;
  verifyToken(token: string, internalSecret?: string): Promise<any>;
  waitForJob(fetchStatus: () => Promise<any>, opts?: WaitForJobOptions): Promise<any>;
}
