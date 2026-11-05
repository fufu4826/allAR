// Optimize models and images listed in a manifest, using the same settings as import-media.mjs.
//
// Usage: node scripts/optimize-media.mjs <manifest.json>
// manifest: [{ "src": "<abs path>", "dest": "<abs path>", "kind": "model" | "image" | "photo" }]
//   model : glTF-Transform dedup + prune + WebP textures (max 2048) + meshopt
//   image : WebP, max 1200 px, quality 82
//   photo : WebP, max 1600 px, quality 80 (cover images)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";

const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

const MB = (n) => (n / 1e6).toFixed(1);
let failed = 0;
for (const { src, dest, kind } of manifest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp-${process.pid}`;
  try {
    if (kind === "model") {
      const doc = await io.read(src);
      await doc.transform(
        dedup(),
        prune(),
        textureCompress({ encoder: sharp, targetFormat: "webp", resize: [2048, 2048], quality: 85 }),
        meshopt({ encoder: MeshoptEncoder }),
      );
      fs.writeFileSync(tmp, Buffer.from(await io.writeBinary(doc)));
    } else {
      const width = kind === "photo" ? 1600 : 1200;
      await sharp(src).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality: kind === "photo" ? 80 : 82 }).toFile(tmp);
    }
    fs.renameSync(tmp, dest);
    console.log(`${kind.padEnd(5)} ${path.basename(src)}  ${MB(fs.statSync(src).size)} MB -> ${MB(fs.statSync(dest).size)} MB`);
  } catch (err) {
    failed++;
    fs.rmSync(tmp, { force: true });
    console.error(`FAIL ${path.basename(src)}: ${err.message}`);
  }
}
console.log(`done: ${manifest.length - failed} ok, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
