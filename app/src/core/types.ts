// DuckMC — общие типы

export type Edition = 'java' | 'bedrock';

export type VersionType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha' | 'bedrock';

export interface VersionInfo {
  id: string;
  type: VersionType;
  releaseTime: string; // ISO
  url?: string;
  /** источники, из которых можно скачать (demo-режим: официальные ссылки) */
  notes?: string;
}

export type AuthProviderId = 'microsoft' | 'elyby' | 'offline';

export interface Account {
  id: string;
  nickname: string;
  uuid: string;
  provider: AuthProviderId;
  /** email для ely.by / microsoft */
  email?: string;
  accessToken?: string;
  createdAt: number;
  /** активный аккаунт */
  active?: boolean;
}

export interface GameSettings {
  memoryMb: number;
  fullWidth: number;
  fullHeight: number;
  fullscreen: boolean;
  javaPath: string;
  jvmArgs: string;
  gameDir: string;
  defaultEdition: Edition;
  defaultVersionJava: string;
  defaultVersionBedrock: string;
}

export interface LauncherSettings {
  language: 'ru' | 'en';
  theme: 'light' | 'dark';
  closeAfterLaunch: boolean;
  checkUpdatesOnStart: boolean;
  discordRpc: boolean;
}

export interface AccountSettings {
  /** базовый URL authserver для ely.by / совместимых (eby.by и т.п.) */
  authServerUrl: string;
  /** client id приложения Microsoft (нужен свой после регистрации в Azure) */
  microsoftClientId: string;
  preferredProvider: AuthProviderId;
}

export interface DownloadSettings {
  installDir: string;
  verifyFiles: boolean;
  torrentMirror: boolean;
}

export interface Settings {
  game: GameSettings;
  launcher: LauncherSettings;
  accounts: AccountSettings;
  downloads: DownloadSettings;
  installedJava: string[];
  installedBedrock: string[];
}

export type LaunchPhaseId =
  | 'idle'
  | 'preparing'
  | 'account'
  | 'downloading'
  | 'verifying'
  | 'jvm'
  | 'running'
  | 'done'
  | 'error'
  | 'cancelled';

export interface LaunchProgress {
  phase: LaunchPhaseId;
  percent: number;
  detail: string;
}

export type PlatformId = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web';
