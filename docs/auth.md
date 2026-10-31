# Авторизация в DuckMC

Поддерживаются три провайдера. Активный аккаунт помечается звездой и используется при запуске.

## 1. Microsoft (лицензия)

Поток — OAuth 2.0 Device Code (удобно для консоли/Android TV/телефона):

```
1) POST https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode
   client_id=<ВАШ_ID>&scope=XboxLive.signin offline_access
   → user_code, verification_uri, device_code
2) Пользователь открывает https://www.microsoft.com/link и вводит код
3) Поллинг POST .../oauth2/v2.0/token (grant_type=urn:ietf:params:oauth:grant-type:device_code)
4) Цепочка: access_token → Xbox Live (user.auth.xboxlive.com)
   → XSTS (xsts.auth.xboxlive.com) → uhs+xsts_token
5) POST https://api.minecraftservices.com/authentication/login_with_xbox
6) GET  https://api.minecraftservices.com/minecraft/profile → ник, UUID, скин
```

**Нужен свой Azure client_id** (бесплатно): portal.azure.com → App registrations →
Public client/native → включить «Allow public client flows» → ID вставить в
Настройки → Авторизация. Без него кнопка входа подскажет об этом.

В браузере шаги 1/3 могут блокироваться CORS — тогда UI предлагает «Демо-вход».
В нативной обёртке (Tauri/Capacitor) запросы идут напрямую без CORS.

## 2. ely.by / совместимые authserver'ы (в т.ч. ваш собственный, напр. «eby.by»)

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
