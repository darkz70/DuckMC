// DuckMC — мост в нативный слой Android (плагин DuckMCPlugin.java).
// В браузере функции недоступны: UI показывает честные подписи об этом.
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface DuckMCNativeInterface {
  pickApkAndInstall(): Promise<{ started: boolean }>;
}

export const DuckMCNative = registerPlugin<DuckMCNativeInterface>('DuckMCNative');

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function nativeErrorText(code: string): string {
  switch (code) {
    case 'need_install_permission':
      return 'Разрешите DuckMC «устанавливать неизвестные приложения» в открывшемся окне и повторите';
    case 'cancelled':
      return 'Выбор файла отменён';
    case 'install_failed':
      return 'Не удалось запустить установку APK';
    default:
      return code;
  }
}
