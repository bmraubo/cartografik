const fs = require("fs");
const path = require("path");
const https = require("https");

const BASE = "https://protomaps.github.io/basemaps-assets/fonts";
const FONTS = ["Noto Sans Regular", "Noto Sans Italic", "Noto Sans Medium"];
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

(async () => {
  for (const fontName of FONTS) {
    const outDir = path.join(OUT_DIR, fontName);
    fs.mkdirSync(outDir, { recursive: true });
    for (let start = 0; start < 65536; start += 256) {
      const range = `${start}-${start + 255}`;
      const url = `${BASE}/${encodeURIComponent(fontName)}/${range}.pbf`;
      try {
        const data = await download(url);
        fs.writeFileSync(path.join(outDir, `${range}.pbf`), data);
      } catch {
        // Range may not exist for this font, write empty PBF
      }
    }
    console.log(`Downloaded: ${fontName}`);
  }
  console.log("Done!");
})();
