# Авторизация в DuckMC

Поддерживаются три провайдера. Активный аккаунт помечается звездой и используется при запуске.

# Авторизация в DuckMC

## 1. Microsoft — НАСТОЯЩИЙ вход (полная цепочка)

Реализовано в `app/src/core/auth.ts` целиком, как в больших лаунчерах:

```
1) OAuth 2.0 Device Code
   POST login.microsoftonline.com/consumers/oauth2/v2.0/devicecode
   (client_id, scope=XboxLive.signin offline_access)
   → user_code, verification_uri, device_code
2) Пользователь открывает microsoft.com/link, вводит код, входит
3) Поллинг .../oauth2/v2.0/token → access_token Microsoft
4) Xbox Live:  POST user.auth.xboxlive.com/user/authenticate  → XBL token + UHS
5) XSTS:       POST xsts.auth.xboxlive.com/xsts/authorize     → XSTS token
6) Minecraft:  POST api.minecraftservices.com/authentication/login_with_xbox
               (identityToken: "XBL3.0 x=<uhs>;<xsts>")
               → access_token игры
7) Профиль:    GET api.minecraftservices.com/minecraft/profile
               → НАСТОЯЩИЙ ник + UUID игрока (не демо!)
```

Обработаны ошибки XSTS: нет Xbox-профиля (2148910233), детский аккаунт (2148910234),
регион (2148910235/238), нет купленной игры (профиль 404) — всё с понятными текстами.

### Где работает

- **Android/десктоп (Capacitor):** напрямую, в `capacitor.config.ts` включён
  `CapacitorHttp` — запросы идут через нативный слой, CORS нет.
- **Браузер (`npm run dev`):** vite-прокси `/msauth/*` пересылает запросы серверам
  Microsoft — вход работает и в браузере на вашем ПК.
- **Онлайн-превью в песочнице:** у песочницы исходящий доступ ограничен (только
  GitHub/npm), поэтому оттуда до Microsoft не достучаться — это ограничение
  витрины, не кода.

### Azure client_id — единственное, что нужно от вас

Требование Microsoft: у каждого приложения-лаунчера свой client_id. Бесплатно, 5 минут:

1. portal.azure.com → **Microsoft Entra ID** → **Регистрация приложений** → «Новая регистрация»
2. Тип: **«Общедоступное клиентское приложение (без платформы)»** (public client/native)
3. Учётные записи: «Personal Microsoft accounts only» (или любые)
4. **Authentication → Advanced settings → Allow public client flows → Yes → Save**
5. Скопируйте **Application (client) ID** → вставьте в
   DuckMC → Аккаунты → Войти через Microsoft → поле client_id (сохранится в настройках)

Без своего client_id вход невозможен ни в одном стороннем лаунчере — это не
ограничение DuckMC, а политика Microsoft.

### Защита от «кражи» — как правильно

- **«Секрет клиента» (client secret) НЕ нужен.** Секреты — для серверных веб-приложений.
  Наш лаунчер — общедоступный клиент (device code): Microsoft секрет не выдаёт и не
  требует. Созданный секрет не защитит, а лишний код входа только запутает.
- **client_id — это не пароль.** По одному ID нельзя ни войти в чей-то аккаунт, ни
  что-то украсть: вход всегда требует вашего пароля и подтверждения на
  microsoft.com/link. Худшее, что сделают с чужим ID, — начнут использовать его в
  своём приложении (как с ID Prism/MultiMC — их тоже «знают» все).
- **Защита уровня 1 — не публиковать ID в git.** Вшивайте его только в сборку:
  скопируйте `app/.env.example` → `app/.env`, впишите `VITE_MS_CLIENT_ID=ваш-id`.
  Файл добавлен в .gitignore и не попадёт в репозиторий, а в APK ID будет вшит и
  вводить его руками не придётся.
- **Защита уровня 2 — сам Azure-аккаунт:** включите двухфакторную аутентификацию
  аккаунта Microsoft (account.microsoft.com → Безопасность). Это главное.
- **Контроль:** в Azure → ваше приложение → «Безопасность»/«Условный доступ» можно
  ограничить, кто входит через приложение; в «Мониторинг» → «Входы» виден журнал.

## 2. ely.by / совместимые authserver'ы (в т.ч. собственные, напр. «eby.by»)

 совместимые authserver'ы (в т.ч. ваш собственный, напр. «eby.by»)

DuckMC говорит на протоколе **authserver**:

```
POST {authServerUrl}/api/authserver/authenticate
{ "username": "email@x.ru", "password": "***", "clientToken": "duckmc-launcher" }
→ { accessToken, selectedProfile: { id, name } }
```

- По умолчанию `authServerUrl = https://authserver.ely.by`
- Свой сервер (например eby.by, если такой сервис вы поднимаете сами) вписывается в
  **Настройки → Авторизация → Адрес auth-сервера** — код менять не нужно.
- Для входа на серверы нужна проверка `join`: `POST {authServerUrl}/api/authserver/join`
  (реализуется на шаге 4 роадмапа).

## 3. Оффлайн

Ник → UUID считается как в Minecraft: `UUID.nameUUIDFromBytes("OfflinePlayer:"+nick)`
(MD5 v3). Реализовано в `app/src/core/md5.ts` — совпадает с официальной логикой.
Подходит для offline-серверов и локального теста.

## Хранение

Токены и аккаунты лежат в `localStorage` (`duckmc.accounts.v1`). На нативных платформах
переезжаем на зашифрованное хранилище ОС (Keychain / Keystore) через адаптер платформы.
