// DuckMC — НАСТОЯЩАЯ авторизация Microsoft (полная цепочка, как у больших лаунчеров):
//   1) OAuth 2.0 Device Code → токен Microsoft
//   2) Xbox Live (user.auth.xboxlive.com)
//   3) XSTS (xsts.auth.xboxlive.com)
//   4) Minecraft (api.minecraftservices.com/authentication/login_with_xbox)
//   5) Профиль: настоящий ник + UUID игрока
// В браузере (превью) запросы идут через прокси dev-сервера (/msauth/*),
// в Android/десктоп-сборке — напрямую (CapacitorHttp, без CORS).
// Единственное, что нужен свой Azure client_id — требование Microsoft, обойти нельзя.

import { Capacitor } from '@capacitor/core';
import type { Account, AuthProviderId } from './types';
import { offlineUuid } from './md5';

export function makeId(): string {
  return 'acc_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** В браузере — через прокси vite (нет CORS), в нативе — напрямую */
const NATIVE = Capacitor.isNativePlatform();
const EP = {
  devicecode: NATIVE
    ? 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode'
    : '/msauth/devicecode',
  token: NATIVE
    ? 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
    : '/msauth/token',
  xbl: NATIVE
    ? 'https://user.auth.xboxlive.com/user/authenticate'
    : '/msauth/xbl',
  xsts: NATIVE
    ? 'https://xsts.auth.xboxlive.com/xsts/authorize'
    : '/msauth/xsts',
  mcLogin: NATIVE
    ? 'https://api.minecraftservices.com/authentication/login_with_xbox'
    : '/msauth/mclogin',
  profile: NATIVE
    ? 'https://api.minecraftservices.com/minecraft/profile'
    : '/msauth/profile',
};

const CLIENT_TOKEN = 'duckmc-launcher';
const MS_SCOPE = 'XboxLive.signin offline_access';

/**
 * client_id, вшитый при сборке через app/.env (VITE_MS_CLIENT_ID).
 * Файл .env не попадает в git — ID есть только в вашей APK-сборке,
 * и его не нужно вводить руками в интерфейсе.
 */
export const BUILT_IN_CLIENT_ID: string =
  (import.meta.env.VITE_MS_CLIENT_ID as string | undefined) ?? '';

export interface AuthResult {
  ok: true;
  account: Account;
}
export interface AuthError {
  ok: false;
  code: 'network' | 'credentials' | 'rate_limit' | 'no_client_id' | 'cancelled' | 'pending' | 'unknown';
  message: string;
  demoFallback?: boolean;
}
export type AuthResponse = AuthResult | AuthError;

// ---------- Оффлайн ----------

export function loginOffline(nickname: string): AuthResponse {
  const nick = nickname.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
    return { ok: false, code: 'credentials', message: 'Ник должен быть 3–16 символов: латиница, цифры и _' };
  }
  return {
    ok: true,
    account: { id: makeId(), nickname: nick, uuid: offlineUuid(nick), provider: 'offline', createdAt: Date.now() },
  };
}

// ---------- ely.by / совместимые authserver ----------

export interface ElyByCreds {
  serverUrl: string;
  username: string;
  password: string;
}

export async function loginAuthServer(creds: ElyByCreds): Promise<AuthResponse> {
  const url = creds.serverUrl.replace(/\/+$/, '') + '/api/authserver/authenticate';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password, clientToken: CLIENT_TOKEN }),
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, code: 'credentials', message: 'Неверный логин или пароль' };
    }
    if (res.status === 429) {
      return { ok: false, code: 'rate_limit', message: 'Слишком много попыток. Подождите немного' };
    }
    if (!res.ok) {
      return { ok: false, code: 'unknown', message: 'Сервер ответил ошибкой ' + res.status };
    }
    const data = (await res.json()) as {
      accessToken: string;
      selectedProfile?: { id: string; name: string };
      availableProfiles?: { id: string; name: string }[];
    };
    const profile = data.selectedProfile ?? data.availableProfiles?.[0];
    if (!profile) {
      return { ok: false, code: 'unknown', message: 'Сервер не вернул профиль игрока' };
    }
    return {
      ok: true,
      account: {
        id: makeId(),
        nickname: profile.name,
        uuid: profile.id,
        provider: 'elyby',
        email: creds.username,
        accessToken: data.accessToken,
        createdAt: Date.now(),
      },
    };
  } catch {
    return {
      ok: false,
      code: 'network',
      demoFallback: true,
      message:
        'Не удалось связаться с ' + creds.serverUrl + ' (в браузере мешает CORS; в Android-сборке вход пройдёт напрямую).',
    };
  }
}

// ---------- Microsoft: шаг 1. Код устройства ----------

export interface DeviceCodeInfo {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  interval: number;
  expiresAt: number;
}

export async function startMicrosoftLogin(clientId: string): Promise<
  { ok: true; deviceCode: DeviceCodeInfo } | AuthError
> {
  const id = clientId.trim() || BUILT_IN_CLIENT_ID;
  if (!id) {
    return {
      ok: false,
      code: 'no_client_id',
      message:
        'Нужен Azure client_id (бесплатно, 5 минут): portal.azure.com → Microsoft Entra ID → Регистрация приложений → «Общедоступное клиентское приложение», включите «Разрешить потоки общедоступных клиентов», скопируйте ID (Application/client Id) и вставьте здесь. Это требование Microsoft — без своего ID вход невозможен ни в одном лаунчере.',
    };
  }
  try {
    const body = new URLSearchParams({ client_id: id, scope: MS_SCOPE });
    const res = await fetch(EP.devicecode, { method: 'POST', body });
    const j = (await res.json()) as {
      user_code?: string;
      verification_uri?: string;
      device_code?: string;
      interval?: number;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (j.error || !j.user_code || !j.device_code) {
      return {
        ok: false,
        code: 'unknown',
        message:
          'Microsoft отклонил запрос: ' +
          (j.error_description ?? j.error ?? 'проверьте client_id (и включённые «публичные потоки»)'),
      };
    }
    return {
      ok: true,
      deviceCode: {
        userCode: j.user_code,
        verificationUri: j.verification_uri ?? 'https://www.microsoft.com/link',
        deviceCode: j.device_code,
        interval: j.interval ?? 5,
        expiresAt: Date.now() + (j.expires_in ?? 900) * 1000,
      },
    };
  } catch (e) {
    return { ok: false, code: 'network', message: 'Сеть недоступна: ' + String(e) };
  }
}

// ---------- Microsoft: шаг 2. Поллинг токена ----------

export type MsPollResult =
  | { state: 'pending' }
  | { state: 'slowdown' }
  | { state: 'expired' }
  | { state: 'denied' }
  | { state: 'ok'; accessToken: string };

export async function pollMicrosoftToken(clientId: string, info: DeviceCodeInfo): Promise<MsPollResult> {
  try {
    const body = new URLSearchParams({
      client_id: clientId.trim(),
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: info.deviceCode,
    });
    const res = await fetch(EP.token, { method: 'POST', body });
    const j = (await res.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (j.access_token) return { state: 'ok', accessToken: j.access_token };
    if (j.error === 'authorization_pending') return { state: 'pending' };
    if (j.error === 'slow_down') return { state: 'slowdown' };
    if (j.error === 'authorization_expired') return { state: 'expired' };
    if (j.error === 'authorization_declined') return { state: 'denied' };
    return { state: 'denied' };
  } catch {
    return { state: 'pending' }; // сетевой сбой — попробуем на следующем такте
  }
}

// ---------- Microsoft: шаги 3–5. XBL → XSTS → Minecraft-профиль ----------

export interface McProfile {
  name: string;
  id: string;
}

async function postJson(url: string, payload: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (j as { XErr?: number }).XErr;
    if (err === 2148910233) throw new Error('У этого аккаунта нет Xbox Live. Создайте профиль Xbox на xbox.com и повторите.');
    if (err === 2148910234) throw new Error('Детский аккаунт: нужно разрешение взрослого в настройках семьи Microsoft.');
    if (err === 2148910235 || err === 2148910238) throw new Error('Аккаунт из региона, где Xbox Live недоступен, либо возрастные ограничения.');
    throw new Error('Ошибка аутентификации (HTTP ' + res.status + (err ? ', XErr ' + err : '') + ')');
  }
  return j;
}

/** Полная цепочка до настоящего профиля Minecraft. Бросает Error с понятным текстом. */
export async function completeMicrosoftAuth(msAccessToken: string): Promise<Account> {
  // XBL
  const xbl = await postJson(EP.xbl, {
    Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: 'd=' + msAccessToken },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType: 'JWT',
  });
  const xblToken = (xbl as { Token?: string }).Token;
  const uhs = ((xbl as { DisplayClaims?: { xui?: { uhs?: string }[] } }).DisplayClaims?.xui ?? [])[0]?.uhs;
  if (!xblToken || !uhs) throw new Error('Xbox Live не вернул токен');

  // XSTS
  const xsts = await postJson(EP.xsts, {
    Properties: { SandboxId: 'RETAIL', UserTokens: [xblToken] },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT',
  });
  const xstsToken = (xsts as { Token?: string }).Token;
  const xstsUhs = ((xsts as { DisplayClaims?: { xui?: { uhs?: string }[] } }).DisplayClaims?.xui ?? [])[0]?.uhs ?? uhs;
  if (!xstsToken) throw new Error('XSTS не вернул токен');

  // Minecraft
  const mcRes = await fetch(EP.mcLogin, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ identityToken: 'XBL3.0 x=' + xstsUhs + ';' + xstsToken }),
  });
  if (!mcRes.ok) throw new Error('Minecraft-аутентификация не прошла (HTTP ' + mcRes.status + ')');
  const mc = (await mcRes.json()) as { access_token?: string };
  if (!mc.access_token) throw new Error('Minecraft не вернул токен сессии');

  // Профиль — вот он, настоящий ник и UUID
  const profRes = await fetch(EP.profile, {
    headers: { Authorization: 'Bearer ' + mc.access_token },
  });
  if (profRes.status === 404) {
    throw new Error('У аккаунта нет профиля Minecraft: купите Java Edition на minecraft.net или сыграйте через Game Pass.');
  }
  if (!profRes.ok) throw new Error('Профиль Minecraft не получен (HTTP ' + profRes.status + ')');
  const prof = (await profRes.json()) as McProfile;
  if (!prof.name || !prof.id) throw new Error('Профиль Minecraft пуст');

  return {
    id: makeId(),
    nickname: prof.name,
    uuid: prof.id,
    provider: 'microsoft' as AuthProviderId,
    accessToken: mc.access_token,
    createdAt: Date.now(),
  };
}

export function providerLabel(p: AuthProviderId): string {
  switch (p) {
    case 'microsoft': return 'Microsoft';
    case 'elyby': return 'ely.by';
    case 'offline': return 'Оффлайн';
  }
}

export function avatarUrl(acc: Account): string {
  return `https://minotar.net/helm/${encodeURIComponent(acc.nickname)}/64.png`;
}
