// DuckMC — авторизация аккаунтов.
// Провайдеры: Microsoft (device code), ely.by-совместимый authserver (по умолчанию
// authserver.ely.by; URL можно поменять на любой аналог, например eby.by), Оффлайн.
// В веб-демо запросы могут блокироваться CORS — тогда предлагаем «демо-вход»,
// а на нативных платформах (Tauri/Capacitor) запросы идут без ограничений.
import type { Account, AuthProviderId } from './types';
import { offlineUuid } from './md5';

export function makeId(): string {
  return 'acc_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export interface AuthResult {
  ok: true;
  account: Account;
}
export interface AuthError {
  ok: false;
  code:
    | 'network'
    | 'credentials'
    | 'rate_limit'
    | 'no_client_id'
    | 'cancelled'
    | 'pending'
    | 'unknown';
  message: string;
  /** если true — можно сохранить аккаунт локально как демо */
  demoFallback?: boolean;
  deviceCode?: DeviceCodeInfo;
}
export type AuthResponse = AuthResult | AuthError;

export interface DeviceCodeInfo {
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  interval: number;
  expiresAt: number;
}

const CLIENT_TOKEN = 'duckmc-launcher';

// ---------- Оффлайн ----------

export function loginOffline(nickname: string): AuthResponse {
  const nick = nickname.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
    return {
      ok: false,
      code: 'credentials',
      message: 'Ник должен быть 3–16 символов: латиница, цифры и _',
    };
  }
  return {
    ok: true,
    account: {
      id: makeId(),
      nickname: nick,
      uuid: offlineUuid(nick),
      provider: 'offline',
      createdAt: Date.now(),
    },
  };
}

// ---------- ely.by / совместимые authserver-провайдеры ----------

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
      body: JSON.stringify({
        username: creds.username,
        password: creds.password,
        clientToken: CLIENT_TOKEN,
      }),
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
        'Не удалось связаться с ' +
        creds.serverUrl +
        ' (возможно, CORS в браузере). Можно сохранить аккаунт в демо-режиме.',
    };
  }
}

// ---------- Microsoft (device code flow) ----------

const MS_DEVICECODE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const MS_SCOPE = 'XboxLive.signin offline_access';

export type MsStartResult = { ok: true; deviceCode: DeviceCodeInfo } | AuthError;

export async function startMicrosoftLogin(clientId: string): Promise<MsStartResult> {
  if (!clientId) {
    return {
      ok: false,
      code: 'no_client_id',
      message:
        'Для входа через Microsoft нужен свой Azure client_id (Настройки → Авторизация). ' +
        'Инструкция: docs/auth.md',
    };
  }
  try {
    const body = new URLSearchParams({ client_id: clientId, scope: MS_SCOPE });
    const res = await fetch(MS_DEVICECODE_URL, { method: 'POST', body });
    if (!res.ok) return { ok: false, code: 'unknown', message: 'Microsoft ответил ошибкой ' + res.status };
    const j = (await res.json()) as {
      user_code: string;
      verification_uri: string;
      device_code: string;
      interval?: number;
      expires_in: number;
    };
    return {
      ok: true,
      deviceCode: {
        userCode: j.user_code,
        verificationUri: j.verification_uri,
        deviceCode: j.device_code,
        interval: j.interval ?? 5,
        expiresAt: Date.now() + j.expires_in * 1000,
      },
    };
  } catch {
    return {
      ok: false,
      code: 'network',
      demoFallback: true,
      message: 'Браузер заблокировал запрос к Microsoft (CORS). На нативной платформе поток будет работать полностью.',
    };
  }
}

export async function pollMicrosoftToken(
  clientId: string,
  info: DeviceCodeInfo,
): Promise<AuthResponse> {
  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: info.deviceCode,
    });
    const res = await fetch(MS_TOKEN_URL, { method: 'POST', body });
    const j = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
    if (j.access_token) {
      // Здесь дальше идёт цепочка XBL → XSTS → Minecraft; пока сохраняем вход как демо,
      // полная цепочка описана в docs/auth.md и реализуется в нативном адаптере.
      return {
        ok: true,
        account: {
          id: makeId(),
          nickname: 'Microsoft Player',
          uuid: offlineUuid('Microsoft Player'),
          provider: 'microsoft',
          accessToken: j.access_token.slice(0, 12) + '…',
          createdAt: Date.now(),
        },
      };
    }
    if (j.error === 'authorization_pending') return { ok: false, code: 'pending', message: 'Ожидаем подтверждение…' };
    if (j.error === 'slow_down') return { ok: false, code: 'rate_limit', message: 'Слишком часто, замедляемся…' };
    return { ok: false, code: 'cancelled', message: j.error_description || 'Вход отменён' };
  } catch {
    return { ok: false, code: 'network', message: 'Сеть недоступна' };
  }
}

export function providerLabel(p: AuthProviderId): string {
  switch (p) {
    case 'microsoft': return 'Microsoft';
    case 'elyby': return 'ely.by';
    case 'offline': return 'Оффлайн';
  }
}

export function avatarUrl(acc: Account): string {
  // Мини-лицо скина по нику (minotar). Для фирменных скинов ely.by позже
  // добавим рендер через canvas + skins.ely.by — см. docs/auth.md
  return `https://minotar.net/helm/${encodeURIComponent(acc.nickname)}/64.png`;
}
