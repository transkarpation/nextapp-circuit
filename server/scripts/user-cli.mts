#!/usr/bin/env node
// CLI для керування користувачами через Firebase Admin SDK.
// Запуск (з теки server/):  node --env-file=.env.local scripts/user-cli.mts <команда> [опції]
// Або через pnpm:           pnpm user <команда> [опції]
//
// Команди:
//   create   --email <email> --password <pass> [--role admin|user]   створити користувача
//   set-role --email <email> --role admin|user                       змінити роль
//   list                                                             показати всіх користувачів
//   delete   --email <email>                                         видалити користувача
//
// Роль зберігається як custom claim { role } і доступна в ID-токені на сервері.

import { parseArgs } from "node:util";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth, type UserRecord } from "firebase-admin/auth";

type Role = "admin" | "user";

const USAGE = `
Керування користувачами (Firebase Admin)

Використання:
  pnpm user create   --email <email> --password <pass> [--role admin|user]
  pnpm user set-role --email <email> --role admin|user
  pnpm user list
  pnpm user delete   --email <email>
`.trim();

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function getAdminAuth(): Auth {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    fail(
      "Відсутні креденшели Firebase Admin (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).\n" +
        "  Запусти з --env-file=.env.local або через `pnpm user ...`.",
    );
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getAuth(app);
}

function parseRole(value: string | undefined, fallback?: Role): Role {
  if (value === undefined && fallback) return fallback;
  if (value !== "admin" && value !== "user") {
    fail(`--role має бути "admin" або "user"${fallback ? "" : " (обов'язково)"}`);
  }
  return value;
}

function roleOf(user: UserRecord): Role {
  const claim = (user.customClaims as { role?: unknown } | undefined)?.role;
  return claim === "admin" ? "admin" : "user";
}

async function findByEmail(auth: Auth, email: string): Promise<UserRecord> {
  try {
    return await auth.getUserByEmail(email);
  } catch {
    fail(`Користувача з email ${email} не знайдено`);
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      email: { type: "string" },
      password: { type: "string" },
      role: { type: "string" },
    },
  });

  const command = positionals[0];

  if (!command || command === "help") {
    console.log(USAGE);
    process.exit(command ? 0 : 1);
  }

  const auth = getAdminAuth();

  switch (command) {
    case "create": {
      if (!values.email) fail("--email обов'язковий");
      if (!values.password) fail("--password обов'язковий");
      const role = parseRole(values.role, "user");

      const user = await auth.createUser({
        email: values.email,
        password: values.password,
      });
      await auth.setCustomUserClaims(user.uid, { role });

      console.log(`✔ Створено ${values.email}  (роль: ${role}, uid: ${user.uid})`);
      break;
    }

    case "set-role": {
      if (!values.email) fail("--email обов'язковий");
      const role = parseRole(values.role);

      const user = await findByEmail(auth, values.email);
      await auth.setCustomUserClaims(user.uid, { role });

      console.log(`✔ ${values.email} → роль: ${role}`);
      console.log("  (користувач отримає нову роль після оновлення токена / повторного входу)");
      break;
    }

    case "list": {
      const { users } = await auth.listUsers(1000);
      if (users.length === 0) {
        console.log("Користувачів немає.");
        break;
      }
      console.log(`Користувачів: ${users.length}\n`);
      for (const u of users) {
        console.log(`  ${roleOf(u).padEnd(5)}  ${(u.email ?? "—").padEnd(32)}  ${u.uid}`);
      }
      break;
    }

    case "delete": {
      if (!values.email) fail("--email обов'язковий");
      const user = await findByEmail(auth, values.email);
      await auth.deleteUser(user.uid);
      console.log(`✔ Видалено ${values.email}`);
      break;
    }

    default:
      fail(`Невідома команда: ${command}\n\n${USAGE}`);
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
