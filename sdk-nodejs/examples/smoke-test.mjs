// Offline smoke test: no network. Verifies the SDK loads, the token signing
// matches the backend's purpose-scoped derivation, and requests are shaped
// correctly against a stubbed fetch.
//
// Run: node examples/smoke-test.mjs
import assert from 'node:assert'
import crypto from 'node:crypto'
import {
  EthoraB2BClient,
  createServerToken,
  deriveScopedSecret,
  EthoraApiError,
} from '../index.js'

// --- 1. Token derivation mirrors helpers/authSecrets.js --------------------
const appSecret = 'test-secret'
const expectedSecret = crypto
  .createHmac('sha256', appSecret)
  .update('ethora:server:v1')
  .digest('hex')
assert.equal(deriveScopedSecret(appSecret, 'server'), expectedSecret, 'scoped secret')

const token = createServerToken({ appId: 'app123', appSecret, tenantId: 'parent1' })
const [h, p, sig] = token.split('.')
const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
assert.deepEqual(payload.data, { type: 'server', appId: 'app123', tenantId: 'parent1' }, 'payload')
const check = crypto
  .createHmac('sha256', expectedSecret)
  .update(`${h}.${p}`)
  .digest('base64url')
assert.equal(sig, check, 'signature verifies with scoped secret')
console.log('✓ token signing matches backend derivation')

// --- 2. Request shaping against a stub fetch -------------------------------
const calls = []
const stubFetch = async (url, init) => {
  calls.push({ url, init })
  return new Response(JSON.stringify({ ok: true, data: { _id: 'app999' } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const client = new EthoraB2BClient({
  baseUrl: 'https://api.example.com/',
  token,
  fetch: stubFetch,
})

await client.apps.create({ displayName: 'X' })
assert.equal(calls[0].url, 'https://api.example.com/v2/apps')
assert.equal(calls[0].init.method, 'POST')
assert.equal(calls[0].init.headers['x-custom-token'], token)
assert.equal(JSON.parse(calls[0].init.body).displayName, 'X')

await client.chats.list('app999', { limit: 10, includeMembers: true })
assert.ok(calls[1].url.includes('/v2/apps/app999/chats?'))
assert.ok(calls[1].url.includes('limit=10'))
assert.ok(calls[1].url.includes('includeMembers=true'))
console.log('✓ request method, path, query, auth header, body')

// --- 3. Error envelope parsing ---------------------------------------------
const errFetch = async () =>
  new Response(JSON.stringify({ error: 'nope', code: 'SERVER_TOKEN_REVOKED', requestId: 'req-1' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
const errClient = new EthoraB2BClient({ baseUrl: 'https://x', token, fetch: errFetch })
await assert.rejects(
  () => errClient.apps.get('a'),
  (e) => e instanceof EthoraApiError && e.code === 'SERVER_TOKEN_REVOKED' && e.requestId === 'req-1'
)
console.log('✓ error envelope → EthoraApiError (status/code/requestId)')

// --- 4. authMode: authorization --------------------------------------------
const authCalls = []
const authClient = new EthoraB2BClient({
  baseUrl: 'https://x',
  token,
  authMode: 'authorization',
  fetch: async (url, init) => {
    authCalls.push(init)
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
  },
})
await authClient.agents.reply('ag1', 'hi')
assert.equal(authCalls[0].headers.Authorization, `Bearer ${token}`)
console.log('✓ authMode: authorization sends Bearer')

console.log('\nAll smoke tests passed.')
