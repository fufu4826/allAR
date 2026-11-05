// แปลงข้อมูล ARModel (ศูนย์ศึกษาการพัฒนาภูพาน) เป็นข้อมูลชุมชนที่ 1 ของเว็บรวม
// ใช้: node scripts/import-armodel.mjs <โฟลเดอร์ ARModel>
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) throw new Error("ระบุโฟลเดอร์ ARModel");
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, "data", f), "utf8"));

// ไฟล์ทั้งหมดอยู่บน R2 สาธารณะ → เรียกผ่าน /r2/* (rewrite ใน next.config) เพื่อเลี่ยง CORS
const R2 = "https://pub-b7cd49a1aa5b4bb1ba339dfd78d4ec75.r2.dev/";
const local = (u) => (u ? u.replace(R2, "/r2/") : null);

const projects = read("projects.json");
const models = read("models.json").filter((m) => m.visible !== false);
const settings = read("site_settings.json");

const out = {
  settings: {
    headline: settings.landing_headline,
    subheadline: settings.landing_subheadline,
    description: settings.landing_description,
    cover: local(settings.landing_cover),
    logo: local(settings.site_logo),
    recommended: (settings.recommended_model_ids || "").split(",").filter(Boolean),
  },
  collections: projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description.trim(),
    image: local(p.image_url),
  })),
  items: models.map((m) => ({
    id: m.id,
    collectionId: m.project_id,
    name: m.name.trim(),
    description: m.description.trim(),
    model: local(m.model_url),
    thumbnail: local(m.thumbnail_url),
    audio: local(m.narration_audio),
  })),
};

const dest = path.resolve(import.meta.dirname, "../src/data/phuphan.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`${out.collections.length} แหล่งเรียนรู้, ${out.items.length} ชิ้นงาน → ${dest}`);
