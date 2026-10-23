# nextapp-withsdk

pnpm-монорепо: Next.js-сервер + власна бібліотека, з авторизацією через Firebase
та зберіганням todo у Firestore.

```
├── sdk-api/   @app/sdk-api — типи Todo + HTTP-клієнт TodoApi (фреймворк-незалежний)
└── server/    Next.js (App Router) — Firebase Auth на клієнті, Firestore через Admin SDK
```

## Як це працює

- **Вхід** (`/login`): Google-popup або email/пароль через Firebase Web SDK.
- **Сторінка todo** (`/todos`): захищена, показує todo залогіненого користувача.
  Клієнт ходить до API через `@app/sdk-api` (`TodoApi`), додаючи Firebase ID-токен
  у заголовок `Authorization: Bearer <token>`.
- **API** (`/api/todos`, `/api/todos/[id]`): кожен роут перевіряє ID-токен через
  Firebase **Admin SDK** і працює з Firestore-колекцією `todos`, скоупленою по `uid`.
  Admin SDK має повний доступ, тож ізоляцію користувачів забезпечує сервер.

## Налаштування Firebase

1. Створи проєкт на https://console.firebase.google.com
2. **Authentication → Sign-in method**: увімкни **Google** і **Email/Password**.
3. **Firestore Database**: створи базу (production або test mode).
4. **Project settings → General → Your apps**: додай Web-app, скопіюй конфіг у
   `NEXT_PUBLIC_FIREBASE_*`.
5. **Project settings → Service accounts → Generate new private key**: з JSON візьми
   `project_id`, `client_email`, `private_key` у `FIREBASE_*`.
6. Скопіюй приклад і заповни:
   ```bash
   cp server/.env.local.example server/.env.local
   ```
   `FIREBASE_PRIVATE_KEY` бери в лапках, переноси рядків — як літеральні `\n`.

## Ролі та адмін-панель

Роль зберігається як Firebase custom claim `{ role: "admin" | "user" }` і приїжджає
в ID-токені, тож сервер читає її без звернень до БД.

- **Сторінка `/admin`** — доступна лише адмінам (інші бачать «Немає доступу»).
  Адмін може створювати користувачів (email + пароль + роль), змінювати роль і видаляти.
  Не можна змінити власну роль чи видалити себе — щоб не залишитися без доступу.
- Клієнт ходить до admin-API через `@app/sdk-api` (`AdminApi`); роути
  `/api/admin/users*` перевіряють роль через Admin SDK (`requireAdmin`).

> Першого адміна створи через CLI (нижче) — далі можна керувати з панелі.
> Після зміни ролі користувач отримає її після оновлення токена (повторний вхід).

## Керування користувачами (CLI)

Те саме з терміналу — зручно для першого адміна. Через Firebase Admin SDK.
Запускати з кореня або з теки `server/` (потрібен заповнений `server/.env.local`):

```bash
pnpm user create   --email user@example.com --password secret123 --role admin
pnpm user set-role --email user@example.com --role user
pnpm user list
pnpm user delete   --email user@example.com
```

`--role` за замовчуванням `user`. Після зміни ролі користувач отримає її після
оновлення токена (повторний вхід або `getIdToken(true)`).

## Запуск

```bash
pnpm install
pnpm dev        # http://localhost:3000  → редірект на /todos → /login
pnpm build      # зібрати sdk-api + server (потрібні NEXT_PUBLIC_* у .env.local)
pnpm start      # прод-сервер
pnpm typecheck  # перевірка типів по всіх пакетах
```

> Публічний `NEXT_PUBLIC_FIREBASE_*` конфіг потрібен і під час `build` (він не секретний).
> Серверні `FIREBASE_*` піднімаються ліниво — лише при першому запиті до API.
