// DuckMC — простой i18n (RU по умолчанию, EN в комплекте)
export type Lang = 'ru' | 'en';

const dict: Record<string, [ru: string, en: string]> = {
  // Навигация
  nav_home: ['Главная', 'Home'],
  nav_downloads: ['Скачивание', 'Downloads'],
  nav_accounts: ['Аккаунты', 'Accounts'],
  nav_settings: ['Настройки', 'Settings'],

  // Главная
  home_tagline: ['Кря! Java и Bedrock — в одном лаунчере', 'Quack! Java and Bedrock in one launcher'],
  play: ['ИГРАТЬ', 'PLAY'],
  playing: ['ЗАПУСКАЕМ…', 'LAUNCHING…'],
  cancel: ['Отменить', 'Cancel'],
  version: ['Версия', 'Version'],
  edition_java: ['Java Edition', 'Java Edition'],
  edition_bedrock: ['Bedrock Edition', 'Bedrock Edition'],
  no_account: ['Аккаунт не выбран', 'No account selected'],
  add_account: ['Добавить аккаунт', 'Add account'],
  demo_badge: ['Демо-режим (браузер)', 'Demo mode (browser)'],
  your_platform: ['Ваша платформа', 'Your platform'],
  android_first: ['Android — в первую очередь!', 'Android first!'],
  quick_stats: ['Быстрая статистика', 'Quick stats'],
  installed_versions: ['Установлено версий', 'Installed versions'],
  accounts_count: ['Аккаунтов', 'Accounts'],
  memory: ['Память', 'Memory'],

  // Скачивание
  downloads_title: ['Скачивание', 'Downloads'],
  search_placeholder: ['Поиск версии…', 'Search version…'],
  filter_all: ['Все', 'All'],
  filter_release: ['Релизы', 'Releases'],
  filter_snapshot: ['Снапшоты', 'Snapshots'],
  filter_old: ['Старые (Beta/Alpha)', 'Old (Beta/Alpha)'],
  install: ['Установить', 'Install'],
  installed: ['Установлено', 'Installed'],
  installing: ['Устанавливаем…', 'Installing…'],
  source_live: ['Источник: официальный манифест Mojang', 'Source: official Mojang manifest'],
  source_fallback: ['Офлайн-кэш (демо). Живой список подтянется при доступе к сети', 'Offline cache (demo). Live list loads when network allows'],
  bedrock_note_title: ['Как получить Bedrock Edition', 'How to get Bedrock Edition'],
  bedrock_note: [
    'Bedrock — платная игра, её нельзя распространять через сторонние лаунчеры. DuckMC находит установленную игру или открывает официальный магазин:',
    'Bedrock is a paid game and cannot be distributed by third-party launchers. DuckMC detects an installed copy or opens the official store:',
  ],

  // Аккаунты
  accounts_title: ['Аккаунты', 'Accounts'],
  accounts_empty: ['Пока нет аккаунтов. Добавьте первый!', 'No accounts yet. Add your first one!'],
  make_active: ['Сделать активным', 'Make active'],
  active: ['Активен', 'Active'],
  remove: ['Удалить', 'Remove'],
  login: ['Войти', 'Sign in'],
  provider_microsoft: ['Microsoft', 'Microsoft'],
  provider_elyby: ['ely.by / аналог', 'ely.by / compatible'],
  provider_offline: ['Оффлайн', 'Offline'],
  ms_device_title: ['Вход через Microsoft', 'Microsoft sign-in'],
  ms_device_hint: [
    'Откройте страницу и введите код:',
    'Open this page and enter the code:',
  ],
  ms_waiting: ['Ждём подтверждения…', 'Waiting for confirmation…'],
  elyby_login: ['Email или ник', 'Email or nickname'],
  password: ['Пароль', 'Password'],
  nickname: ['Ник', 'Nickname'],
  offline_hint: ['Для серверов с offline-mode и быстрого старта', 'For offline-mode servers and quick start'],
  demo_login: ['Войти в демо-режиме', 'Demo sign-in'],
  auth_server_url: ['Адрес auth-сервера', 'Auth server URL'],

  // Настройки
  settings_title: ['Настройки', 'Settings'],
  set_game: ['Игра', 'Game'],
  set_launcher: ['Лаунчер', 'Launcher'],
  set_auth: ['Авторизация', 'Authentication'],
  set_downloads: ['Загрузки', 'Downloads'],
  set_about: ['О программе', 'About'],
  memory_mb: ['Память (МБ)', 'Memory (MB)'],
  resolution: ['Разрешение окна', 'Window resolution'],
  fullscreen: ['Полный экран', 'Fullscreen'],
  java_path: ['Путь к Java', 'Java path'],
  java_path_hint: ['Оставьте пустым — DuckMC сам подберёт Java', 'Leave empty — DuckMC picks Java automatically'],
  jvm_args: ['Доп. аргументы JVM', 'Extra JVM args'],
  game_dir: ['Папка игры', 'Game folder'],
  default_edition: ['Издание по умолчанию', 'Default edition'],
  language: ['Язык', 'Language'],
  theme: ['Тема', 'Theme'],
  theme_light: ['Светлая (кремовая)', 'Light (cream)'],
  theme_dark: ['Тёмная (ночная)', 'Dark (night)'],
  close_after_launch: ['Сворачивать лаунчер после запуска', 'Minimize launcher after start'],
  check_updates: ['Проверять обновления при старте', 'Check updates on start'],
  discord_rpc: ['Discord Rich Presence', 'Discord Rich Presence'],
  ms_client_id: ['Microsoft Azure client_id', 'Microsoft Azure client_id'],
  ms_client_hint: ['Зарегистрируйте приложение в Azure и вставьте ID (см. docs/auth.md)', 'Register an Azure app and paste its ID (see docs/auth.md)'],
  preferred_provider: ['Приоритетный провайдер', 'Preferred provider'],
  install_dir: ['Папка установки', 'Install folder'],
  verify_files: ['Проверять файлы (SHA-1)', 'Verify files (SHA-1)'],
  save: ['Сохранить', 'Save'],
  saved: ['Сохранено!', 'Saved!'],
  reset: ['Сбросить', 'Reset'],
  about_version: ['Версия лаунчера', 'Launcher version'],
  about_license: ['Лицензия: MIT', 'License: MIT'],
  about_roadmap: ['План развития', 'Roadmap'],

  // Разное
  ok: ['Понятно', 'Got it'],
  close: ['Закрыть', 'Close'],
  error: ['Ошибка', 'Error'],
  done: ['Готово', 'Done'],
};

export function makeT(lang: Lang) {
  const idx = lang === 'ru' ? 0 : 1;
  return (key: string): string => {
    const e = dict[key];
    return e ? e[idx] : key;
  };
}
export type T = ReturnType<typeof makeT>;
