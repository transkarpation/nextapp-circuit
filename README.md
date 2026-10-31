# nextapp-circuit

Симулятор електронних схем у браузері на Next.js: схеми можна створювати з нуля або
з 330 шаблонів, редагувати на канвасі й зберігати у Firestore. Вхід через Firebase.
Є також ролі користувачів і сторінка todo.

```
├── server/             Next.js (App Router) — Firebase Auth на клієнті, Firestore через Admin SDK
│   ├── lib/sdk/        типи + HTTP-клієнти TodoApi, AdminApi, CircuitApi і ApiKeyApi
│   └── public/templates/  шаблони схем і їхнє меню (setuplist.txt)
└── packages/circuit/   симулятор і канвас-редактор (TypeScript, GPL), збирається самим Next
```

## Як це працює

- **Вхід** (`/login`): Google-popup або email/пароль через Firebase Web SDK.
- **Сторінка todo** (`/todos`): захищена, показує todo залогіненого користувача.
  Клієнт ходить до API через `@/lib/sdk` (`TodoApi`), додаючи Firebase ID-токен
  у заголовок `Authorization: Bearer <token>`.
- **API** (`/api/todos`, `/api/todos/[id]`): кожен роут перевіряє ID-токен через
  Firebase **Admin SDK** і працює з Firestore-колекцією `todos`, скоупленою по `uid`.
  Admin SDK має повний доступ, тож ізоляцію користувачів забезпечує сервер.

## Схеми

- **Список** (`/circuits`): власні схеми користувача — відкрити, перейменувати, скопіювати,
  видалити; створення порожньої схеми або схеми з шаблону (пошук по 330 шаблонах).
- **Редактор** (`/circuits/[id]`): правки зберігаються автоматично через 2 секунди після
  останньої зміни, а також за `Ctrl+S`, кнопкою «Зберегти» і при виході зі сторінки.
- **Публічні схеми**: власник вмикає «Публічна» в редакторі, і посилання `/circuits/[id]`
  відкривається будь-кому, навіть без входу. Глядач може запускати схему й змінювати її
  локально, але нічого не зберігається. Нові схеми й копії приватні.
- **API** (`/api/circuits`, `/api/circuits/[id]`): як і todo, перевіряє ID-токен і працює
  з Firestore-колекцією `circuits`, скоупленою по `uid`. Список не повертає текст схем.
  Без входу доступний лише `GET /api/circuits/[id]` для публічної схеми.
- **Симулятор** виконується в браузері; звичайне API зберігає текст схеми й не розбирає його.
  Рушій на сервері запускає лише MCP, для перевірки схем від агента.

## MCP для агентів

LLM-агент може створювати й редагувати схеми користувача через MCP-сервер `/api/mcp`
(Streamable HTTP, без сесій).

1. На сторінці `/settings` створи API-ключ і скопіюй його. Сервер зберігає лише SHA-256 ключа,
   тому повністю ключ видно один раз. Новий ключ замінює старий.
2. Додай сервер у клієнт, що підтримує віддалений MCP:
   ```json
   {
     "mcpServers": {
       "circuit": {
         "type": "http",
         "url": "https://<домен>/api/mcp",
         "headers": { "Authorization": "Bearer <API-ключ>" }
       }
     }
   }
   ```

| Інструмент | Що робить |
|---|---|
| `get_circuit_format` | Описує текстовий формат схем |
| `list_templates`, `get_template` | Шаблони як приклади синтаксису |
| `list_circuits`, `get_circuit` | Читання схем |
| `create_circuit`, `update_circuit` | Запис; перед збереженням схема запускається в симуляторі |
| `simulate_circuit` | Запуск без збереження: напруги на виводах і струми |

- Схему з нечитабельними рядками або таку, яку симулятор зупиняє, агент зберегти не може.
- Видаляти схеми й робити їх публічними агент не може: таких інструментів немає.
- Ключ зберігається в Firestore-колекції `apiKeys` (id документа — `uid`) і не працює для
  заблокованих чи видалених користувачів. Керувати ключем можна лише з Firebase ID-токеном.
- Шаблони читаються з диска, тому `next.config.ts` додає `public/templates` у серверну функцію.

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
- Клієнт ходить до admin-API через `@/lib/sdk` (`AdminApi`); роути
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
pnpm dev        # http://localhost:3000  → редірект на /circuits → /login
pnpm build      # зібрати server (потрібні NEXT_PUBLIC_* у .env.local)
pnpm start      # прод-сервер
pnpm typecheck  # перевірка типів
pnpm test       # тести симулятора
```

> Публічний `NEXT_PUBLIC_FIREBASE_*` конфіг потрібен і під час `build` (він не секретний).
> Серверні `FIREBASE_*` піднімаються ліниво — лише при першому запиті до API.

> **Лише webpack.** `dev` і `build` запускаються з `--webpack`, не прибирай цей прапорець.
> Модулі симулятора циклічні й покладаються на порядок виконання з `packages/circuit/src/core/internal.ts`.
> Turbopack його порушує: збірка проходить успішно, але редактор падає в браузері з
> `Cannot access 'CircuitElm' before initialization`.

## Деплой на Vercel

1. Імпортуй репозиторій у Vercel і вкажи **Root Directory: `server`**. Опцію
   «Include files outside the root directory» лишай увімкненою: потрібен `packages/circuit`.
2. Додай усі змінні з `server/.env.local.example`, крім `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`,
   для середовищ Production і Preview. `FIREBASE_PRIVATE_KEY` встав із літеральними `\n`.
3. **Firebase Console → Authentication → Settings → Authorized domains**: додай домен Vercel,
   інакше вхід через Google не працюватиме.

Команду збірки задає `server/vercel.json`.

## Локальний запуск з емулятором

Щоб не чіпати реальний проєкт, можна використати Firebase Emulator: задай
`NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099` для браузера,
а для Admin SDK — `FIREBASE_AUTH_EMULATOR_HOST` і `FIRESTORE_EMULATOR_HOST`.

## Ліцензія

`packages/circuit` і шаблони схем поширюються за GNU GPL v2 або новішою: текст у
`packages/circuit/COPYING.txt`, у застосунку він доступний за адресою `/COPYING.txt`.
