// DuckMC — контроллер запуска игры.
// Демо-режим: этапы проходят с симуляцией прогресса. Когда подключим нативный
// движок (Tauri/Capacitor), вместо симуляции будут реальные шаги — контракт тот же.
import type { Account, Edition, LaunchProgress, Settings, VersionInfo } from './types';
import type { PlatformAdapter } from './platform';

export interface LaunchCallbacks {
  onProgress: (p: LaunchProgress) => void;
  onDone: (success: boolean, message: string) => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class LaunchController {
  private cancelled = false;
  private running = false;

  isRunning(): boolean {
    return this.running;
  }

  cancel(): void {
    this.cancelled = true;
  }

  async launch(
    opts: {
      edition: Edition;
      version: VersionInfo | null;
      account: Account | null;
      settings: Settings;
      adapter: PlatformAdapter;
    },
    cb: LaunchCallbacks,
  ): Promise<void> {
    if (this.running) {
      cb.onProgress({ phase: 'error', percent: 0, detail: 'Игра уже запускается' });
      return;
    }
    this.running = true;
    this.cancelled = false;
    const P = (phase: LaunchProgress['phase'], percent: number, detail: string) =>
      cb.onProgress({ phase, percent, detail });

    try {
      // 0. Проверки
      P('preparing', 2, 'Проверяем конфигурацию…');
      await sleep(350);
      if (this.cancelled) return this.finish(cb, false, 'Запуск отменён');
      if (!opts.account) {
        P('error', 0, 'Нет аккаунта');
        this.running = false;
        cb.onDone(false, 'Сначала добавьте аккаунт во вкладке «Аккаунты»');
        return;
      }

      // 1. Аккаунт
      P('account', 8, `Проверяем сессию: ${opts.account.nickname} (${opts.account.provider})…`);
      await sleep(500);
      if (this.cancelled) return this.finish(cb, false, 'Запуск отменён');

      // 2. Файлы игры
      const steps: [number, string][] = [
        [20, 'Загружаем манифест версии…'],
        [32, 'Скачиваем клиент и библиотеки…'],
        [46, 'Скачиваем ассеты (звуки, индексы текстур)…'],
        [58, 'Докачиваем нативные библиотеки…'],
      ];
      for (const [pct, msg] of steps) {
        P('downloading', pct, msg);
        await sleep(650);
        if (this.cancelled) return this.finish(cb, false, 'Загрузка отменена');
      }

      // 3. Проверка файлов
      if (opts.settings.downloads.verifyFiles) {
        P('verifying', 66, 'Проверяем целостность файлов (SHA-1)…');
        await sleep(700);
        if (this.cancelled) return this.finish(cb, false, 'Запуск отменён');
      }

      // 4. JVM / окружение
      P('jvm', 78, 'Настраиваем Java-машину…');
      await sleep(600);
      if (this.cancelled) return this.finish(cb, false, 'Запуск отменён');

      // 5. Запуск
      P('running', 92, opts.adapter.canLaunchReal() ? 'Запускаем игру…' : 'Демо-режим: процесс игры не создаётся');
      await sleep(800);
      if (this.cancelled) return this.finish(cb, false, 'Запуск отменён');

      P('done', 100, 'Готово!');
      await sleep(250);
      this.running = false;
      if (opts.adapter.canLaunchReal()) {
        cb.onDone(true, 'Игра запущена. Приятной игры!');
      } else {
        cb.onDone(
          true,
          'Демо-режим: весь конвейер отработал, но реальный процесс появится после подключения нативного движка (см. docs/ROADMAP.md).',
        );
      }
    } catch (e) {
      this.running = false;
      cb.onProgress({ phase: 'error', percent: 0, detail: String(e) });
      cb.onDone(false, 'Ошибка запуска: ' + String(e));
    }
  }

  private finish(cb: LaunchCallbacks, success: boolean, message: string): void {
    this.running = false;
    cb.onProgress({ phase: this.cancelled ? 'cancelled' : 'idle', percent: 0, detail: message });
    cb.onDone(success, message);
  }
}
