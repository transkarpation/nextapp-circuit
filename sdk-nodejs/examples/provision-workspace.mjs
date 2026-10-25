// End-to-end workspace provisioning with a single parent-app server token.
// Run: node examples/provision-workspace.mjs
import { EthoraB2BClient } from '../index.js'

const ethora = new EthoraB2BClient({
  baseUrl: process.env.ETHORA_BASE_URL, // e.g. https://api.example.com
  token: process.env.ETHORA_SERVER_TOKEN,
})

// Alternatively, hand-sign a token from an app secret:
// const ethora = EthoraB2BClient.withAppSecret({
//   baseUrl: process.env.ETHORA_BASE_URL,
//   appId: process.env.ETHORA_APP_ID,
//   appSecret: process.env.ETHORA_APP_SECRET,
//   expiresIn: '90d',
// })

async function main() {
  // 1. Create a child app.
  const { data: app } = await ethora.apps.create({
    displayName: 'Acme Support',
    domainName: 'acmesupport',
    createDefaultChat: true,
  })
  const appId = app._id
  console.log('created app', appId)

  // 2. Seed its system chat/admin.
  await ethora.apps.provision(appId, [{ title: 'General', pinned: true }])

  // 3. Batch-create users (async job) and wait for it.
  const { jobId } = await ethora.users.createBatch(appId, {
    bypassEmailConfirmation: true,
    usersList: [
      { email: 'ava@example.com', firstName: 'Ava', lastName: 'Stone' },
      { email: 'ben@example.com', firstName: 'Ben', lastName: 'Lee' },
    ],
  })
  const job = await ethora.waitForJob(() => ethora.users.getBatchJob(appId, jobId))
  console.log('users created', job)

  // 4. Create a room and add members.
  const { data: chat } = await ethora.chats.create(appId, {
    title: 'Welcome',
    type: 'group',
  })

  // 5. Broadcast an announcement (async job).
  const { jobId: bJob } = await ethora.chats.broadcast(appId, {
    text: 'Welcome to Acme Support!',
    allRooms: true,
  })
  await ethora.waitForJob(() => ethora.chats.getBroadcastJob(appId, bJob))
  console.log('broadcast sent to', chat?.name)
}

main().catch((err) => {
  console.error(err.code || '', err.message, err.requestId || '')
  process.exit(1)
})
