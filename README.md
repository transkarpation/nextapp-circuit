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
