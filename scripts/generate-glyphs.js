const fontnik = require("fontnik");
const fs = require("fs");
const path = require("path");

const FONTS = [
  {
    name: "IM Fell English Regular",
    file: "IMFellEnglish-Regular.ttf",
  },
  {
    name: "IM Fell English Italic",
    file: "IMFellEnglish-Italic.ttf",
  },
];

const SRC_DIR = path.join(__dirname, "..", "fonts-src");
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");

async function generateGlyphs(fontName, fontFile) {
  const fontPath = path.join(SRC_DIR, fontFile);
  const fontBuffer = fs.readFileSync(fontPath);
  const outDir = path.join(OUT_DIR, fontName);
  fs.mkdirSync(outDir, { recursive: true });

  for (let start = 0; start < 65536; start += 256) {
    const end = start + 255;
    const range = `${start}-${end}`;
    const pbf = await new Promise((resolve, reject) => {
      fontnik.range(
        { font: fontBuffer, start, end },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });
    fs.writeFileSync(path.join(outDir, `${range}.pbf`), pbf);
  }
  console.log(`Generated glyphs for: ${fontName}`);
}

(async () => {
  for (const { name, file } of FONTS) {
    await generateGlyphs(name, file);
  }
  console.log("Done!");
})();
