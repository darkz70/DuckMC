// DuckMC — собственный набор SVG-иконок (без эмодзи).
// Единый стиль: контур 2px, скруглённые концы, цвет = currentColor.
import type { ReactNode, SVGProps } from 'react';
import type { PlatformId } from '../core/types';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Base({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ---------- Навигация ---------- */

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 10.5L12 3l8.5 7.5" />
    <path d="M5.5 9v11.5h13V9" />
  </Base>
);

export const IconDownload = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5V15" />
    <path d="M6.5 10.5l5.5 5.5 5.5-5.5" />
    <path d="M4.5 20.5h15" />
  </Base>
);

export const IconMenu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </Base>
);

export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.6-3.6 4.3-5.5 7.5-5.5s5.9 1.9 7.5 5.5" />
  </Base>
);

export const IconSliders = (p: IconProps) => (
  <Base {...p}>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

/* ---------- Действия ---------- */

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconX = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12.5l5 5L20 6.5" />
  </Base>
);

export const IconCheckCircle = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.3l2.4 2.4 4.8-4.8" />
  </Base>
);

export const IconAlert = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5L2.5 19.5h19L12 3.5z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V4.5h5V7" />
    <path d="M6.5 7l1 14h9l1-14" />
  </Base>
);

export const IconStar = (p: IconProps) => (
  <Base {...p}>
    <path
      d="M12 2.5l3 6.1 6.7 1-4.9 4.7 1.2 6.7L12 17.8l-6 3.2 1.2-6.7-4.9-4.7 6.7-1z"
      fill="currentColor"
      stroke="none"
    />
  </Base>
);

export const IconExternal = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M20 14.5V19a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19V6a1.5 1.5 0 011.5-1.5H10" />
  </Base>
);

export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);

export const IconRefresh = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 8a9 9 0 00-15.5-3.4L3 7" />
    <path d="M3 3v4h4" />
    <path d="M3 16a9 9 0 0015.5 3.4L21 17" />
    <path d="M21 21v-4h-4" />
  </Base>
);

export const IconLock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9.5" rx="2" />
    <path d="M8 11V7.5a4 4 0 018 0V11" />
  </Base>
);

export const IconInfo = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

export const IconKey = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="16" r="4" />
    <path d="M10.9 13.1L20 4" />
    <path d="M16 8l3 3" />
    <path d="M13 11l2 2" />
  </Base>
);

export const IconGamepad = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 7h11a4.5 4.5 0 014.4 5.4l-.8 4A3 3 0 0116 18.4L14.5 17h-5L8 18.4a3 3 0 01-5.1-2l-.8-4A4.5 4.5 0 016.5 7z" />
    <path d="M8.2 10.2v3.2M6.6 11.8h3.2" />
    <circle cx="15.3" cy="11" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="17.6" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
  </Base>
);

/* ---------- Фазы запуска ---------- */

export const IconCompass = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-1.7 4.3L9 15l1.7-4.3z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconFlask = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 2.5h4" />
    <path d="M11 2.5v6L5.2 18a2 2 0 001.8 3h10a2 2 0 001.8-3L13 8.5v-6" />
    <path d="M8 15h8" />
  </Base>
);

export const IconZap = (p: IconProps) => (
  <Base {...p}>
    <path d="M13 2L3.5 14H11l-1 8L19.5 10H13l0-8z" fill="currentColor" stroke="none" />
  </Base>
);

/* ---------- Издания ---------- */

export const IconJava = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 9.5h11V14a5 5 0 01-5 5h-1a5 5 0 01-5-5V9.5z" />
    <path d="M16 10.5h1.5a2.5 2.5 0 010 5H16" />
    <path d="M8.5 3.5c-.9 1 .9 1.8 0 2.8" />
    <path d="M12.5 3.5c-.9 1 .9 1.8 0 2.8" />
  </Base>
);

/* ---------- Платформы ---------- */

export const IconWindows = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 4.5L11 3.4v7.6H3.5zM12.5 3.2L20.5 2v9h-8zM3.5 12.5H11V20l-7.5-1.1zM12.5 13h8v9l-8-1.2z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconApple = (p: IconProps) => (
  <Base {...p}>
    <path
      d="M12 7.6c1-.8 2.2-1 3.3-.6 1.9.7 2.9 2.9 2.3 5.6-.6 2.9-2.3 5.4-3.9 5.4-.6 0-1-.3-1.7-.3s-1.1.3-1.7.3c-1.6 0-3.3-2.5-3.9-5.4-.6-2.7.4-4.9 2.3-5.6 1.1-.4 2.3-.2 3.3.6z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M12 7V4.8c0-1 .5-1.9 1.5-2.4" />
  </Base>
);

export const IconLinux = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3c-2.6 0-3.8 2-3.8 4.4 0 1.9-.5 3.3-1.4 4.8C5.6 14 5 15.6 5 17.1 5 19.9 6.6 21 8 21c.9 0 1.6-.7 2.5-.7h3c.9 0 1.6.7 2.5.7 1.4 0 3-1.1 3-3.9 0-1.5-.6-3.1-1.8-4.9-.9-1.5-1.4-2.9-1.4-4.8C15.8 5 14.6 3 12 3z" />
    <circle cx="10.3" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="13.7" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    <path d="M10.8 10.2h2.4L12 11.8z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconAndroid = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 14a5.5 5.5 0 0111 0v.5h-11V14z" />
    <path d="M8.6 9.6L7.4 7.2M15.4 9.6l1.2-2.4" />
    <circle cx="9.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    <path d="M6.5 17.5h11" />
  </Base>
);

export const IconGlobe = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c3 3.5 3 14.5 0 18" />
    <path d="M12 3c-3 3.5-3 14.5 0 18" />
  </Base>
);

/** Иконка платформы (вместо эмодзи) */
export function PlatformIcon({ platform, size = 20 }: { platform: PlatformId; size?: number }) {
  switch (platform) {
    case 'windows': return <IconWindows size={size} />;
    case 'macos': return <IconApple size={size} />;
    case 'ios': return <IconApple size={size} />;
    case 'linux': return <IconLinux size={size} />;
    case 'android': return <IconAndroid size={size} />;
    default: return <IconGlobe size={size} />;
  }
}
