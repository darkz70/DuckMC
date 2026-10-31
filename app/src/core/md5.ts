// Компактная реализация MD5 (нужна для offline-UUID как в Minecraft:
// UUID.nameUUIDFromBytes("OfflinePlayer:"+nick) — MD5-based v3 UUID)
// Источник алгоритма: RFC 1321. Написано без зависимостей.

function toUtf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return out;
}

function rol(n: number, c: number): number {
  return ((n << c) | (n >>> (32 - c))) | 0;
}

function add32(a: number, b: number): number {
  return (a + b) | 0;
}

const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = new Array<number>(64);
for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

export function md5Hex(input: string): string {
  const bytes = toUtf8Bytes(input);
  const origLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bitLen = origLen * 8;
  bytes.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff, 0, 0, 0, 0);

  let a0 = 0x67452301 | 0, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476 | 0;

  for (let off = 0; off < bytes.length; off += 64) {
    const M = new Array<number>(16);
    for (let i = 0; i < 16; i++) {
      M[i] = (bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24)) | 0;
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = add32(add32(F, M[g]), K[i]);
      const tmp = D; D = C; C = B;
      B = add32(B, rol(F, S[i]));
      A = tmp;
    }
    a0 = add32(a0, A); b0 = add32(b0, B); c0 = add32(c0, C); d0 = add32(d0, D);
  }

  const hex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const b = (n >>> (i * 8)) & 0xff;
      s += b.toString(16).padStart(2, '0');
    }
    return s;
  };
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

/** Offline-UUID, точно как в Minecraft: md5("OfflinePlayer:"+name), версия 3 */
export function offlineUuid(nickname: string): string {
  const h = md5Hex('OfflinePlayer:' + nickname);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    // версия 3
    ((parseInt(h.slice(12, 14), 16) & 0x0f) | 0x30).toString(16).padStart(2, '0') + h.slice(14, 16),
    ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + h.slice(18, 20),
    h.slice(20, 32),
  ].join('-');
}
