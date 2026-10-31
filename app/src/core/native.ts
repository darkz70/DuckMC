// DuckMC — мост в нативный слой Android (плагин DuckMCPlugin.java).
// В браузере функции недоступны: UI показывает честные подписи об этом.
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface DuckMCNativeInterface {
  isBedrockInstalled(): Promise<{ installed: boolean; version: string }>;
  launchBedrock(): Promise<void>;
  openStore(options: { pkg?: string }): Promise<void>;
  pickApkAndInstall(): Promise<{ started: boolean }>;
  pickAddonAndImport(): Promise<{ started: boolean }>;
}

export const DuckMCNative = registerPlugin<DuckMCNativeInterface>('DuckMCNative');

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function bedrockStatus(): Promise<{ installed: boolean; version: string } | null> {
  if (!isNative()) return null;
  try {
    return await DuckMCNative.isBedrockInstalled();
  } catch {
    return null;
  }
}

export function nativeErrorText(code: string): string {
  switch (code) {
    case 'not_installed':
      return 'Minecraft Bedrock не установлен';
    case 'need_install_permission':
      return 'Разрешите DuckMC «устанавливать неизвестные приложения» в открывшемся окне и повторите';
    case 'cancelled':
      return 'Выбор файла отменён';
    case 'install_failed':
      return 'Не удалось запустить установку APK';
    case 'import_failed':
      return 'Не удалось передать файл Minecraft';
    default:
      return code;
  }
}
