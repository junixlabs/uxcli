// Minimal PNG decode (8-bit RGB/RGBA, non-interlaced) and pixel diff for screenshot crops.
import zlib from 'node:zlib';
function decode(buf) {
  let p = 8; const chunks = []; let w, h, ct, bd;
  while (p < buf.length) { const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8); const data = buf.subarray(p + 8, p + 8 + len); if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; } if (type === 'IDAT') chunks.push(data); p += 12 + len; }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 1; const raw = zlib.inflateSync(Buffer.concat(chunks)); const stride = w * bpp; const px = Buffer.alloc(w * h * bpp);
  let prev = Buffer.alloc(stride); for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) { const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } line[i] = v & 255; }
    line.copy(px, y * stride); prev = line; }
  return { w, h, bpp, px };
}
export const PNG = { diff(a, b) { const A = decode(a), B = decode(b); if (A.w !== B.w || A.h !== B.h) return -1; let n = 0; for (let i = 0; i < A.w * A.h; i++) { for (let k = 0; k < Math.min(3, A.bpp); k++) if (Math.abs(A.px[i * A.bpp + k] - B.px[i * B.bpp + k]) > 8) { n++; break; } } return n; } };
