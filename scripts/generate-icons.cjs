const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, '..', 'assets');
const size = 256;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filePath) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc((width * 4 + 1) * height);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const row = y * (width * 4 + 1);
    const index = row + 1 + x * 4;
    pixels[index] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = a;
  }

  function roundedRect(x, y, w, h, radius, color) {
    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        const dx = Math.max(x - px, 0, px - (x + w - 1));
        const dy = Math.max(y - py, 0, py - (y + h - 1));
        const nearLeft = px < x + radius;
        const nearRight = px >= x + w - radius;
        const nearTop = py < y + radius;
        const nearBottom = py >= y + h - radius;

        if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
          const cx = nearLeft ? x + radius : x + w - radius - 1;
          const cy = nearTop ? y + radius : y + h - radius - 1;
          if ((px - cx) ** 2 + (py - cy) ** 2 > radius ** 2) continue;
        }

        setPixel(px, py, ...color);
      }
    }
  }

  function rect(x, y, w, h, color) {
    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) {
        setPixel(px, py, ...color);
      }
    }
  }

  roundedRect(0, 0, width, height, 42, [29, 78, 216, 255]);
  roundedRect(102, 58, 52, 140, 9, [255, 255, 255, 255]);
  roundedRect(58, 102, 140, 52, 9, [255, 255, 255, 255]);
  roundedRect(159, 169, 11, 33, 2, [147, 197, 253, 230]);
  roundedRect(176, 157, 11, 45, 2, [147, 197, 253, 230]);
  roundedRect(193, 177, 11, 25, 2, [147, 197, 253, 230]);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
  return png;
}

function writeIco(filePath, png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory[0] = 0;
  directory[1] = 0;
  directory[2] = 0;
  directory[3] = 0;
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(png.length, 8);
  directory.writeUInt32LE(header.length + directory.length, 12);

  fs.writeFileSync(filePath, Buffer.concat([header, directory, png]));
}

function writeSvg(filePath) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#1d4ed8"/>
  <rect x="206" y="120" width="100" height="272" rx="18" fill="white"/>
  <rect x="120" y="206" width="272" height="100" rx="18" fill="white"/>
  <rect x="310" y="330" width="22" height="60" rx="4" fill="#93c5fd" opacity="0.9"/>
  <rect x="342" y="310" width="22" height="80" rx="4" fill="#93c5fd" opacity="0.9"/>
  <rect x="374" y="345" width="22" height="45" rx="4" fill="#93c5fd" opacity="0.9"/>
</svg>
`;
  fs.writeFileSync(filePath, svg);
}

fs.mkdirSync(assetsDir, { recursive: true });
writeSvg(path.join(assetsDir, 'icon.svg'));
const png = writePng(path.join(assetsDir, 'icon.png'));
writeIco(path.join(assetsDir, 'icon.ico'), png);

console.log('Generated desktop icons in assets/.');
