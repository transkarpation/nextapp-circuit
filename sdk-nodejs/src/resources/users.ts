import { buildForm, type UploadFile } from '../form';
import { enc, type HttpClient, type Query } from '../http';
import type { DeleteMode } from './apps';

/** A user record for B2B batch creation. */
export interface UserDataB2B {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  uuid?: string;
  profileImage?: string;
  /** Index into the multipart `files` passed to `createBatch`. */
  profileImageFileIndex?: number;
}

export interface CreateUserOptions {
  bypassEmailConfirmation?: boolean;
}

export interface PlatformAccessFlags {
  superadmin?: boolean;
  agents?: boolean;
  netStats?: boolean;
}

/** Provision, update, archive and administer end-users. */
export class Users {
  constructor(private readonly http: HttpClient) {}

  /**
   * Async batch create users in a target app (preferred for backends).
   * `POST /v2/apps/{appId}/users/batch` → `{ jobId }` (202). Poll `getBatchJob`.
   *
   * Pass `files` to upload profile images referenced by `profileImageFileIndex`.
   */
  createBatch<T = unknown>(
    appId: string,
    {
      usersList,
      bypassEmailConfirmation,
      files,
    }: { usersList: UserDataB2B[]; files?: UploadFile[] } & CreateUserOptions
  ): Promise<T> {
    const path = `/v2/apps/${enc(appId)}/users/batch`;
    if (files && files.length) {
      const form = buildForm({ usersList, bypassEmailConfirmation }, files);
      return this.http.post<T>(path, { form });
    }
    return this.http.post<T>(path, { body: { usersList, bypassEmailConfirmation } });
  }

  /**
   * Convenience: create a single user in a target app. Wraps the async
   * `createBatch` — resolves to `{ jobId }` (202); poll with `getBatchJob`
   * or `client.waitForJob`.
   */
  create<T = unknown>(
    appId: string,
    user: UserDataB2B,
    { bypassEmailConfirmation }: CreateUserOptions = {}
  ): Promise<T> {
    return this.createBatch<T>(appId, { usersList: [user], bypassEmailConfirmation });
  }

  /** Status/results of an app-scoped batch job. `GET /v2/apps/{appId}/users/batch/{jobId}` */
  getBatchJob<T = unknown>(appId: string, jobId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/users/batch/${enc(jobId)}`);
  }

  /**
   * Archive (soft, default) or purge (`mode:'hard'`) users in an app.
   * `DELETE /v2/apps/{appId}/users/batch`
   */
  deleteBatch<T = unknown>(
    appId: string,
    { usersIdList, mode, reason }: { usersIdList: string[]; mode?: DeleteMode; reason?: string }
  ): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/users/batch`, {
      query: { mode, reason },
      body: { usersIdList },
    });
  }

  /** Restore a soft-archived user. `POST /v2/apps/{appId}/users/{userId}/restore` */
  restore<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/restore`);
  }

  /** Reset a user's MFA (admin recovery). `DELETE /v2/apps/{appId}/users/{userId}/mfa` */
  resetMfa<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/mfa`);
  }

  /** Remove a user's admin-panel access. `DELETE /v2/apps/{appId}/users/{userId}/access` */
  removeAccess<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/access`);
  }

  /** Grant platform super-admin (base app only). `POST .../superadmin` */
  grantSuperAdmin<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.post<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/superadmin`);
  }

  /** Revoke platform super-admin. `DELETE .../superadmin` */
  revokeSuperAdmin<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.delete<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/superadmin`);
  }

  /** Read platform-level access flags. `GET .../platform-access` */
  getPlatformAccess<T = unknown>(appId: string, userId: string): Promise<T> {
    return this.http.get<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/platform-access`);
  }

  /** Set platform-level access flags. `PATCH .../platform-access` */
  setPlatformAccess<T = unknown>(
    appId: string,
    userId: string,
    flags: PlatformAccessFlags
  ): Promise<T> {
    return this.http.patch<T>(`/v2/apps/${enc(appId)}/users/${enc(userId)}/platform-access`, {
      body: flags,
    });
  }

  /** List users of an app. `GET /v1/users/{appId}` */
  list<T = unknown>(appId: string, query?: Query): Promise<T> {
    return this.http.get<T>(`/v1/users/${enc(appId)}`, { query });
  }

  /** Resolve one user by xmppUsername (`{appId}_{userId}`). `GET /v1/apps/users/{xmppUsername}` */
  getByXmppUsername<T = unknown>(xmppUsername: string): Promise<T> {
    return this.http.get<T>(`/v1/apps/users/${enc(xmppUsername)}`);
  }

  /**
   * Synchronous batch create against the token's own app (B2B-only).
   * `POST /v1/users/batch`. Prefer the async `createBatch` for large imports.
   */
  createBatchSync<T = unknown>({
    usersList,
    bypassEmailConfirmation,
  }: { usersList: UserDataB2B[] } & CreateUserOptions): Promise<T> {
    return this.http.post<T>('/v1/users/batch', { body: { usersList, bypassEmailConfirmation } });
  }

  /**
   * Convenience: synchronously create a single user in the token's own app
   * (B2B-only). Wraps `createBatchSync` — resolves to the created user(s)
   * immediately (no job polling).
   */
  createSync<T = unknown>(
    user: UserDataB2B,
    { bypassEmailConfirmation }: CreateUserOptions = {}
  ): Promise<T> {
    return this.createBatchSync<T>({ usersList: [user], bypassEmailConfirmation });
  }

  /** Delete users in the token's own app (B2B-only). `DELETE /v1/users/batch` */
  deleteBatchSync<T = unknown>({ usersIdList }: { usersIdList: string[] }): Promise<T> {
    return this.http.delete<T>('/v1/users/batch', { body: { usersIdList } });
  }
}
