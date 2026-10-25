# ethora-b2b-sdk

Node.js SDK for the **Ethora backend B2B (server-token) API** — provision apps,
users, chats, AI sources and agents from your own backend with a server token.

- Zero runtime dependencies (uses the built-in `fetch`, `crypto`, `FormData`).
- Node **>= 18**.
- Works from both CommonJS (`require`) and ESM (`import`).
- Typed (`index.d.ts`) for editor autocomplete.

## Install

Not published to a registry. Import it by local path:

```bash
npm install /home/lvo/work/ethora-monoserver/temp/sdk-nodejs
# or in package.json:  "ethora-b2b-sdk": "file:../path/to/sdk-nodejs"
```

Or pack a tarball to drop into another project:

```bash
cd temp/sdk-nodejs && npm pack        # → ethora-b2b-sdk-0.1.0.tgz
npm install /path/to/ethora-b2b-sdk-0.1.0.tgz
```

## Quickstart

```js
const { EthoraB2BClient } = require('ethora-b2b-sdk')
// import { EthoraB2BClient } from 'ethora-b2b-sdk'

const ethora = new EthoraB2BClient({
  baseUrl: 'https://api.example.com',
  token: process.env.ETHORA_SERVER_TOKEN,
})

const apps = await ethora.apps.list()
```

## Authentication

A B2B token is an HS256 JWT with `{ data: { type: 'server', appId, tenantId? } }`.
There are two ways to supply one.

### 1. Use an existing token (preferred)

Mint a **revocable** token in the admin panel or via
`POST /v2/apps/{appId}/server-tokens` (needs an owner **user** JWT), then pass it:

```js
const ethora = new EthoraB2BClient({ baseUrl, token })
```

By default the token is sent as `x-custom-token`. To send it as
`Authorization: Bearer <token>` instead:

```js
new EthoraB2BClient({ baseUrl, token, authMode: 'authorization' })
```

### 2. Hand-sign from an app secret (legacy, non-revocable)

If you integrate directly with an app's secret, the SDK can derive the
purpose-scoped secret (`HMAC-SHA256(appSecret, "ethora:server:v1")`) and sign a
token for you:

```js
const ethora = EthoraB2BClient.withAppSecret({
  baseUrl,
  appId: process.env.ETHORA_APP_ID,
  appSecret: process.env.ETHORA_APP_SECRET,
  tenantId: process.env.ETHORA_TENANT_ID, // optional
  expiresIn: '90d',                        // optional; omit for no expiry
})
```

Or just get the string:

```js
const { createServerToken } = require('ethora-b2b-sdk')
const token = createServerToken({ appId, appSecret, expiresIn: '90d' })
```

> A token minted for app X can act on **X and its child apps** — never its
> parent. Scope your calls accordingly.

## Scope of a server token

`req.user._id` is the **app id**, not a person. "Me"-style routes
(`/v2/users/me`, own files, own password/MFA) are meaningless with a server
token — always use the app-explicit `/v2/apps/{appId}/...` surface, which this
SDK wraps.

## Resources

| Namespace | Covers |
| --- | --- |
| `ethora.apps` | list/create/get/update, archive & restore, hard-purge + job polling, export/import, provision rooms, owner-session, app tokens, minted server tokens, AI usage |
| `ethora.users` | async batch create + job polling, delete/archive, restore, MFA reset, access & super-admin, platform flags, list, resolve by xmppUsername |
| `ethora.chats` | create public/group & private, delete, list (per app / per user), update metadata, add/remove members, batch profile patch, broadcast + job polling |
| `ethora.messages` | MAM history, delete history, text search, context window, batch unread counts |
| `ethora.sources` | site crawl + jobs, watched sites, refresh keys, document upload/list/tag/delete |
| `ethora.agents` | list/create/delete per app, invite-to-chat, one-shot `reply`, get/update, bot instances |
| `ethora.bots` | per-app AI bot settings |
| `ethora.widget` | appearance get/set, conversation list |

### A few common calls

```js
// Create a child app + seed rooms
const { data: app } = await ethora.apps.create({ displayName: 'Acme', domainName: 'acme' })
await ethora.apps.provision(app._id, [{ title: 'General', pinned: true }])

// Batch-create users (async) and wait
const { jobId } = await ethora.users.createBatch(app._id, {
  bypassEmailConfirmation: true,
  usersList: [{ email: 'a@x.com', firstName: 'A', lastName: 'B' }],
})
await ethora.waitForJob(() => ethora.users.getBatchJob(app._id, jobId))

// Private 1-1 chat (idempotent)
await ethora.chats.createPrivate(app._id, { members: ['userIdA', 'userIdB'] })

// Search message history for support tooling
await ethora.messages.search(app._id, { q: 'refund', limit: 20 })

// Ask an agent synchronously (10-30s; chat-free)
const reply = await ethora.agents.reply('agentId', 'What are your hours?', { timeoutMs: 45000 })

// Upload knowledge documents
const fs = require('fs')
await ethora.sources.uploadDocs(app._id, [
  { data: fs.readFileSync('faq.pdf'), filename: 'faq.pdf', contentType: 'application/pdf' },
])
```

### Acting as a child app

```js
const childClient = ethora.withToken(childAppServerToken)
await childClient.chats.list(childAppId)
```

### Escape hatch

Any route not wrapped by a resource is reachable directly:

```js
await ethora.request('GET', '/v2/apps/' + appId + '/chats', { query: { limit: 50 } })
await ethora.request('POST', '/v1/files', { form }) // multipart via global FormData
```

## Errors

Non-2xx responses throw `EthoraApiError` carrying the backend's canonical
envelope:

```js
const { EthoraApiError } = require('ethora-b2b-sdk')
try {
  await ethora.apps.get(appId)
} catch (err) {
  if (err instanceof EthoraApiError) {
    console.error(err.status, err.code, err.requestId, err.details)
  }
}
```

> Don't share this client with user-session code that auto-refreshes on 401 — a
> B2B 401 is not an expired session.

## Job polling

Async endpoints return `{ jobId }` (and often `statusUrl`). `waitForJob` polls a
status fetcher until it completes or times out:

```js
const job = await ethora.waitForJob(() => ethora.chats.getBroadcastJob(appId, jobId), {
  intervalMs: 2000,
  timeoutMs: 120000,
})
```

Pass custom `isDone` / `isFailed` predicates if an endpoint reports status
differently.

## Examples & tests

- `examples/provision-workspace.mjs` — end-to-end provisioning flow.
- `examples/smoke-test.mjs` — offline checks (token signing, request shaping,
  error parsing). Run `node examples/smoke-test.mjs`.

## Reference

The full B2B route inventory lives in the monoserver repo at
`B2B_API_ROUTES.md`, and the live Swagger is at
`https://api.<your-domain>/api-docs/`.
