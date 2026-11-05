import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '..');
const phuphanPath = path.resolve(webRoot, 'src/data/phuphan.json');
const bundleDir = path.resolve(repoRoot, 'data-bundle');
const originalsDir = path.resolve(bundleDir, 'originals');
const uploadsDir = path.resolve(bundleDir, 'uploads');
const reportPath = path.resolve(bundleDir, 'media-report.json');

const R2_ORIGIN = 'https://pub-b7cd49a1aa5b4bb1ba339dfd78d4ec75.r2.dev/';

async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 200) {
        return res;
      }
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      if (attempt === retries) {
        throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${err.message}`);
      }
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function runConcurrent(items, concurrency, fn) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      await fn(current);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
}

function normalizePosix(p) {
  return p.split(path.sep).join('/');
}

async function main() {
  const startTime = Date.now();
  console.log('--- Starting media import ---');

  if (!fs.existsSync(phuphanPath)) {
    throw new Error(`phuphan.json not found at ${phuphanPath}`);
  }

  const rawPhuphan = fs.readFileSync(phuphanPath, 'utf8');
  const phuphanData = JSON.parse(rawPhuphan);

  let existingReport = null;
  if (fs.existsSync(reportPath)) {
    try {
      existingReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch {
      existingReport = null;
    }
  }

  // Collect media items
  const mediaItems = [];
  const pathToItemMap = new Map();

  function registerItem(fieldPath, currentVal) {
    if (!currentVal || typeof currentVal !== 'string') return;

    let originalRelPath = null;
    let uploadRelPath = null;
    let thumbRelPath = null;
    let type = null;

    if (currentVal.startsWith('/r2/')) {
      originalRelPath = currentVal.replace('/r2/', '');
    } else if (currentVal.startsWith('/uploads/')) {
      const candidateRel = currentVal.replace('/uploads/', '');
      if (existingReport?.files) {
        const found = existingReport.files.find(
          (f) => f.optimizedPath === candidateRel || f.originalPath === candidateRel
        );
        if (found) {
          originalRelPath = found.originalPath;
        }
      }
      if (!originalRelPath) {
        // Fallback: check originals folder
        if (candidateRel.endsWith('.webp')) {
          const base = candidateRel.slice(0, -5);
          for (const ext of ['.jpg', '.png', '.jpeg']) {
            if (fs.existsSync(path.join(originalsDir, base + ext))) {
              originalRelPath = base + ext;
              break;
            }
          }
          if (!originalRelPath) {
            originalRelPath = base + '.png'; // default fallback
          }
        } else {
          originalRelPath = candidateRel;
        }
      }
    } else {
      return;
    }

    const ext = path.extname(originalRelPath).toLowerCase();
    const parsed = path.parse(originalRelPath);
    const dirPosix = normalizePosix(parsed.dir);

    if (ext === '.glb') {
      type = 'model';
      uploadRelPath = originalRelPath;
    } else if (ext === '.wav') {
      type = 'audio';
      uploadRelPath = originalRelPath;
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      type = 'image';
      uploadRelPath = dirPosix ? `${dirPosix}/${parsed.name}.webp` : `${parsed.name}.webp`;
      thumbRelPath = dirPosix ? `${dirPosix}/${parsed.name}.thumb.webp` : `${parsed.name}.thumb.webp`;
    } else {
      console.warn(`Unrecognized extension ${ext} for ${originalRelPath}`);
      type = 'other';
      uploadRelPath = originalRelPath;
    }

    const item = {
      fieldPath,
      currentVal,
      originalRelPath,
      uploadRelPath,
      thumbRelPath,
      type,
    };

    if (!pathToItemMap.has(originalRelPath)) {
      pathToItemMap.set(originalRelPath, item);
      mediaItems.push(item);
    }
  }

  // Collect from settings
  if (phuphanData.settings?.cover) registerItem('settings.cover', phuphanData.settings.cover);
  if (phuphanData.settings?.logo) registerItem('settings.logo', phuphanData.settings.logo);

  // Collect from collections
  (phuphanData.collections || []).forEach((col, idx) => {
    if (col.image) registerItem(`collections[${idx}].image`, col.image);
  });

  // Collect from items
  (phuphanData.items || []).forEach((item, idx) => {
    if (item.model) registerItem(`items[${idx}].model`, item.model);
    if (item.thumbnail) registerItem(`items[${idx}].thumbnail`, item.thumbnail);
    if (item.audio) registerItem(`items[${idx}].audio`, item.audio);
  });

  console.log(`Found ${mediaItems.length} media files across phuphan.json.`);

  // 1. Download phase
  console.log('\n[1/4] Checking and downloading original files (max 4 parallel)...');
  let downloadedCount = 0;
  let skippedDownloadCount = 0;

  fs.mkdirSync(originalsDir, { recursive: true });

  await runConcurrent(mediaItems, 4, async (item) => {
    const origPath = path.join(originalsDir, item.originalRelPath);
    const url = `${R2_ORIGIN}${item.originalRelPath}`;
    fs.mkdirSync(path.dirname(origPath), { recursive: true });

    if (fs.existsSync(origPath)) {
      const headRes = await fetchWithRetry(url, { method: 'HEAD' });
      const cl = headRes.headers.get('content-length');
      if (cl && fs.statSync(origPath).size === parseInt(cl, 10)) {
        skippedDownloadCount++;
        return;
      }
    }

    const res = await fetchWithRetry(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const expectedLen = res.headers.get('content-length');
    if (expectedLen && buffer.byteLength !== parseInt(expectedLen, 10)) {
      throw new Error(
        `Downloaded size ${buffer.byteLength} != Content-Length ${expectedLen} for ${url}`
      );
    }

    const tmpPath = `${origPath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, origPath);
    downloadedCount++;
  });

  console.log(
    `Download phase complete: ${downloadedCount} downloaded, ${skippedDownloadCount} skipped (already up to date).`
  );

  // 2. Optimization phase
  console.log('\n[2/4] Optimizing media files...');
  fs.mkdirSync(uploadsDir, { recursive: true });

  await MeshoptEncoder.ready;
  const gltfIO = new NodeIO()
    .registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression])
    .registerDependencies({
      'meshopt.encoder': MeshoptEncoder,
      'meshopt.decoder': MeshoptDecoder,
    });

  const warnings = [];
  let skippedOptCount = 0;
  let processedOptCount = 0;

  // Process images
  const imageItems = mediaItems.filter((m) => m.type === 'image');
  console.log(`Processing ${imageItems.length} images...`);
  await runConcurrent(imageItems, 4, async (item) => {
    const origPath = path.join(originalsDir, item.originalRelPath);
    const uploadPath = path.join(uploadsDir, item.uploadRelPath);
    const thumbPath = path.join(uploadsDir, item.thumbRelPath);

    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    const origMtime = fs.statSync(origPath).mtimeMs;
    const uploadExists = fs.existsSync(uploadPath);
    const thumbExists = fs.existsSync(thumbPath);

    if (
      uploadExists &&
      thumbExists &&
      fs.statSync(uploadPath).mtimeMs >= origMtime &&
      fs.statSync(thumbPath).mtimeMs >= origMtime
    ) {
      skippedOptCount++;
      return;
    }

    try {
      // Main image: max width 1600 (no upscaling), quality 80
      await sharp(origPath)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(uploadPath);

      // Thumbnail: max width 480 (no upscaling), quality 80
      await sharp(origPath)
        .rotate()
        .resize({ width: 480, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(thumbPath);

      processedOptCount++;
    } catch (err) {
      warnings.push({
        file: item.originalRelPath,
        reason: `Image error: ${err.message}`,
      });
      console.warn(`[WARN] Image failed ${item.originalRelPath}: ${err.message}`);
    }
  });

  // Process models (.glb)
  const modelItems = mediaItems.filter((m) => m.type === 'model');
  console.log(`Processing ${modelItems.length} 3D models...`);
  for (const item of modelItems) {
    const origPath = path.join(originalsDir, item.originalRelPath);
    const uploadPath = path.join(uploadsDir, item.uploadRelPath);

    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    const origMtime = fs.statSync(origPath).mtimeMs;
    if (fs.existsSync(uploadPath) && fs.statSync(uploadPath).mtimeMs >= origMtime) {
      skippedOptCount++;
      continue;
    }

    try {
      const doc = await gltfIO.read(origPath);
      await doc.transform(
        dedup(),
        prune(),
        textureCompress({
          encoder: sharp,
          targetFormat: 'webp',
          resize: [2048, 2048],
          quality: 85,
        }),
        meshopt({
          encoder: MeshoptEncoder,
        })
      );
      const glbBuffer = await gltfIO.writeBinary(doc);
      const tmpGlb = `${uploadPath}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpGlb, Buffer.from(glbBuffer));
      fs.renameSync(tmpGlb, uploadPath);
      processedOptCount++;
    } catch (err) {
      warnings.push({
        file: item.originalRelPath,
        reason: `GLB optimization failed: ${err.message}`,
      });
      console.warn(
        `[WARN] GLB optimization failed for ${item.originalRelPath}: ${err.message}. Copying original unchanged.`
      );
      fs.copyFileSync(origPath, uploadPath);
      processedOptCount++;
    }
  }

  // Process audio (.wav)
  const audioItems = mediaItems.filter((m) => m.type === 'audio');
  console.log(`Processing ${audioItems.length} audio files...`);
  for (const item of audioItems) {
    const origPath = path.join(originalsDir, item.originalRelPath);
    const uploadPath = path.join(uploadsDir, item.uploadRelPath);

    fs.mkdirSync(path.dirname(uploadPath), { recursive: true });

    const origMtime = fs.statSync(origPath).mtimeMs;
    if (fs.existsSync(uploadPath) && fs.statSync(uploadPath).mtimeMs >= origMtime) {
      skippedOptCount++;
      continue;
    }

    fs.copyFileSync(origPath, uploadPath);
    processedOptCount++;
  }

  console.log(
    `Optimization phase complete: ${processedOptCount} processed, ${skippedOptCount} skipped (already up to date).`
  );

  // 3. Rewrite phuphan.json
  console.log('\n[3/4] Rewriting phuphan.json...');
  const urlMapping = new Map();
  for (const item of mediaItems) {
    urlMapping.set(`/r2/${item.originalRelPath}`, `/uploads/${item.uploadRelPath}`);
    urlMapping.set(`/uploads/${item.uploadRelPath}`, `/uploads/${item.uploadRelPath}`);
  }

  function updateField(val) {
    if (typeof val === 'string' && urlMapping.has(val)) {
      return urlMapping.get(val);
    }
    return val;
  }

  if (phuphanData.settings?.cover) phuphanData.settings.cover = updateField(phuphanData.settings.cover);
  if (phuphanData.settings?.logo) phuphanData.settings.logo = updateField(phuphanData.settings.logo);

  (phuphanData.collections || []).forEach((col) => {
    if (col.image) col.image = updateField(col.image);
  });

  (phuphanData.items || []).forEach((item) => {
    if (item.model) item.model = updateField(item.model);
    if (item.thumbnail) item.thumbnail = updateField(item.thumbnail);
    if (item.audio) item.audio = updateField(item.audio);
  });

  const tmpPhuphan = `${phuphanPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmpPhuphan, JSON.stringify(phuphanData, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPhuphan, phuphanPath);
  console.log('phuphan.json updated atomically.');

  // 4. Report and summary
  console.log('\n[4/4] Writing media-report.json and calculating summary...');
  const reportFiles = [];
  const stats = {
    image: { count: 0, origBytes: 0, optBytes: 0 },
    model: { count: 0, origBytes: 0, optBytes: 0 },
    audio: { count: 0, origBytes: 0, optBytes: 0 },
    total: { count: 0, origBytes: 0, optBytes: 0 },
  };

  for (const item of mediaItems) {
    const origPath = path.join(originalsDir, item.originalRelPath);
    const uploadPath = path.join(uploadsDir, item.uploadRelPath);

    const origBytes = fs.existsSync(origPath) ? fs.statSync(origPath).size : 0;
    const optBytes = fs.existsSync(uploadPath) ? fs.statSync(uploadPath).size : 0;

    const warn = warnings.find((w) => w.file === item.originalRelPath) || null;

    reportFiles.push({
      originalPath: item.originalRelPath,
      optimizedPath: item.uploadRelPath,
      thumbnailPath: item.thumbRelPath || null,
      type: item.type,
      originalBytes: origBytes,
      optimizedBytes: optBytes,
      warning: warn ? warn.reason : null,
    });

    const targetStat = stats[item.type] || stats.image;
    targetStat.count++;
    targetStat.origBytes += origBytes;
    targetStat.optBytes += optBytes;

    stats.total.count++;
    stats.total.origBytes += origBytes;
    stats.total.optBytes += optBytes;
  }

  const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
  const toPct = (orig, opt) => (orig > 0 ? ((opt / orig) * 100).toFixed(1) + '%' : '0%');

  const reportData = {
    generatedAt: new Date().toISOString(),
    summary: {
      images: {
        count: stats.image.count,
        originalMB: parseFloat(toMB(stats.image.origBytes)),
        optimizedMB: parseFloat(toMB(stats.image.optBytes)),
        ratio: toPct(stats.image.origBytes, stats.image.optBytes),
      },
      models: {
        count: stats.model.count,
        originalMB: parseFloat(toMB(stats.model.origBytes)),
        optimizedMB: parseFloat(toMB(stats.model.optBytes)),
        ratio: toPct(stats.model.origBytes, stats.model.optBytes),
      },
      audio: {
        count: stats.audio.count,
        originalMB: parseFloat(toMB(stats.audio.origBytes)),
        optimizedMB: parseFloat(toMB(stats.audio.optBytes)),
        ratio: toPct(stats.audio.origBytes, stats.audio.optBytes),
      },
      total: {
        count: stats.total.count,
        originalMB: parseFloat(toMB(stats.total.origBytes)),
        optimizedMB: parseFloat(toMB(stats.total.optBytes)),
        ratio: toPct(stats.total.origBytes, stats.total.optBytes),
      },
    },
    warnings,
    files: reportFiles,
  };

  const tmpReport = `${reportPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmpReport, JSON.stringify(reportData, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpReport, reportPath);

  // Print Summary Table
  console.log('\n================ MEDIA REPORT SUMMARY ================');
  console.log(
    'Type       | Count | Before (MB) | After (MB) | Ratio (% of orig)'
  );
  console.log('-----------+-------+-------------+------------+-------------------');
  console.log(
    `Images     | ${String(stats.image.count).padStart(5)} | ${String(toMB(stats.image.origBytes)).padStart(11)} | ${String(toMB(stats.image.optBytes)).padStart(10)} | ${String(toPct(stats.image.origBytes, stats.image.optBytes)).padStart(17)}`
  );
  console.log(
    `Models     | ${String(stats.model.count).padStart(5)} | ${String(toMB(stats.model.origBytes)).padStart(11)} | ${String(toMB(stats.model.optBytes)).padStart(10)} | ${String(toPct(stats.model.origBytes, stats.model.optBytes)).padStart(17)}`
  );
  console.log(
    `Audio      | ${String(stats.audio.count).padStart(5)} | ${String(toMB(stats.audio.origBytes)).padStart(11)} | ${String(toMB(stats.audio.optBytes)).padStart(10)} | ${String(toPct(stats.audio.origBytes, stats.audio.optBytes)).padStart(17)}`
  );
  console.log('-----------+-------+-------------+------------+-------------------');
  console.log(
    `Total      | ${String(stats.total.count).padStart(5)} | ${String(toMB(stats.total.origBytes)).padStart(11)} | ${String(toMB(stats.total.optBytes)).padStart(10)} | ${String(toPct(stats.total.origBytes, stats.total.optBytes)).padStart(17)}`
  );
  console.log('======================================================');

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(` - ${w.file}: ${w.reason}`));
  } else {
    console.log('\nNo warnings (all files optimized successfully).');
  }

  // Verifications
  const writtenJson = fs.readFileSync(phuphanPath, 'utf8');
  if (writtenJson.includes('/r2/')) {
    throw new Error('Verification failed: phuphan.json still contains /r2/ paths!');
  }

  for (const item of mediaItems) {
    const uploadFilePath = path.join(uploadsDir, item.uploadRelPath);
    if (!fs.existsSync(uploadFilePath)) {
      throw new Error(`Verification failed: missing upload file ${uploadFilePath}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nFinished in ${durationSec}s`);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err);
  process.exit(1);
});
