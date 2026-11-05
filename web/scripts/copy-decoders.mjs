// Copies the 3D decoders that <model-viewer> needs into public/decoders/ so the site
// never loads them from Google's CDN. Runs as predev/prebuild.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("public/decoders", { recursive: true });
await cp("node_modules/three/examples/jsm/libs/basis", "public/decoders/basis", { recursive: true });

// model-viewer loads the meshopt decoder with a classic <script> and then reads the
// global `MeshoptDecoder`, so strip the ES-module export to make it a classic script.
const meshopt = await readFile("node_modules/three/examples/jsm/libs/meshopt_decoder.module.js", "utf8");
const classic = meshopt.replace(/^export\s*\{\s*MeshoptDecoder\s*\};?\s*$/m, "");
if (classic === meshopt) throw new Error("meshopt decoder: export line not found, check three.js version");
await writeFile("public/decoders/meshopt_decoder.js", classic);
