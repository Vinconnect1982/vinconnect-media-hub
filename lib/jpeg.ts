export function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 255 || bytes[1] !== 216) return null;
  for (let i = 2; i + 8 < bytes.length; ) {
    if (bytes[i] !== 255) return null;
    const marker = bytes[i + 1];
    i += 2;
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 0xff) {
      i--;
      continue;
    }
    const len = (bytes[i] << 8) | bytes[i + 1];
    if (len < 2 || i + len > bytes.length) return null;
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { height: (bytes[i + 3] << 8) | bytes[i + 4], width: (bytes[i + 5] << 8) | bytes[i + 6] };
    }
    i += len;
  }
  return null;
}
