// Generates a small dot pattern PNG for the retro map overlay.
// Uses raw PNG encoding to avoid native canvas dependencies.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SIZE = 32;
// Guide: "deliberately distorting perfectly symmetrical dots randomly"
const DOTS = [
  [4, 5], [15, 3], [27, 6],
  [8, 14], [20, 12], [30, 15],
  [3, 22], [13, 25], [25, 23],
  [10, 30], [22, 29], [17, 18],
  [6, 9], [28, 20], [1, 28],
];
const DOT_RADIUS = 1.2;
const DOT_ALPHA = 255; // fully opaque — layer opacity controls visibility

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Build RGBA pixel data
const pixels = Buffer.alloc(SIZE * SIZE * 4, 0);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4;
    for (const [dx, dy] of DOTS) {
      if (dist(x, y, dx, dy) <= DOT_RADIUS) {
        pixels[idx] = 90;     // R
        pixels[idx + 1] = 70; // G
        pixels[idx + 2] = 50; // B
        pixels[idx + 3] = DOT_ALPHA; // A
        break;
      }
    }
  }
}

// Encode as PNG manually (minimal valid PNG)
function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// IDAT — raw pixel rows with filter byte 0
const rawRows = [];
for (let y = 0; y < SIZE; y++) {
  rawRows.push(Buffer.from([0])); // filter: none
  rawRows.push(pixels.subarray(y * SIZE * 4, (y + 1) * SIZE * 4));
}
const compressed = zlib.deflateSync(Buffer.concat(rawRows));

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = path.join(__dirname, "..", "public", "patterns");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "dots.png"), png);

// Also output as base64 for native use
const b64 = png.toString("base64");
const tsOut = `// Auto-generated dot pattern\nexport const DOT_PATTERN_BASE64 = "data:image/png;base64,${b64}";\nexport const DOT_PATTERN_SIZE = ${SIZE};\n`;
const srcDir = path.join(__dirname, "..", "src", "utils");
fs.writeFileSync(path.join(srcDir, "dotPattern.ts"), tsOut);

console.log(`Generated dots.png (${png.length} bytes) and dotPattern.ts`);
