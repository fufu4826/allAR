import { Suspense } from "react";
import { db } from "@/db";
import { communities, news, galleryImages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { saveContent, deleteContent } from "./actions";

const field = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default function ContentAdmin() {
  return (
    <Suspense fallback={<p className="p-4 text-muted">กำลังโหลดข้อมูล…</p>}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  const [places, articles, images] = await Promise.all([
    db.select().from(communities),
    db.select().from(news),
    db.select().from(galleryImages),
  ]);

  function editor(kind: "news" | "gallery", item?: typeof articles[number] | typeof images[number]) {
    const article = item && "title" in item ? item : undefined;
    const picture = item && "caption" in item ? item : undefined;

    return (
      <form action={saveContent} className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={item?.id || ""} />

        {kind === "news" ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700">หัวข้อข่าว *</label>
              <input className={field} name="title" placeholder="หัวข้อข่าว" required maxLength={255} defaultValue={article?.title} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">หมวดหมู่ *</label>
              <input className={field} name="category" placeholder="เช่น เทคโนโลยีชุมชน, ศิลปวัฒนธรรม" required maxLength={64} defaultValue={article?.category} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">สรุปย่อ *</label>
              <textarea className={field} rows={2} name="summary" placeholder="สรุปสั้น ๆ ของข่าวสาร" required defaultValue={article?.summary} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">เนื้อหาข่าว *</label>
              <textarea className={field} rows={5} name="body" placeholder="เนื้อหาข่าวฉบับเต็ม" required defaultValue={article?.body} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700">คำอธิบายภาพ *</label>
              <input className={field} name="caption" placeholder="คำอธิบายภาพกิจกรรม" required defaultValue={picture?.caption} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">หมวดหมู่แกลเลอรี *</label>
              <select className={field} name="category" defaultValue={picture?.category || "fieldwork"}>
                <option value="fieldwork">ลงพื้นที่ชุมชน</option>
                <option value="modeling">การสร้างโมเดล 3D</option>
                <option value="testing">ทดสอบระบบ AR</option>
              </select>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">ชุมชนที่เกี่ยวข้อง</label>
            <select className={field} name="communityId" defaultValue={item?.communityId || ""}>
              <option value="">ทุกชุมชน / ภาพรวม</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">ลำดับการแสดงผล</label>
            <input className={field} type="number" name="sortOrder" min="0" defaultValue={item?.sortOrder || 0} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">
            {kind === "news" ? "ภาพหน้าปกข่าว (ไม่บังคับ)" : "ไฟล์รูปภาพ *"}
          </label>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block text-sm"
            required={kind === "gallery" && !item}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? false} className="size-4" />
            เผยแพร่สู่สาธารณะ
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            บันทึก
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-bold">จัดการข่าวสาร</h1>
          <p className="text-sm text-muted">เพิ่มและแก้ไขข่าวสารหรือเรื่องราวประชาสัมพันธ์ของ 5 แหล่งอัตลักษณ์</p>
        </div>
        <div className="mb-6">
          <details className="rounded-2xl border border-line bg-white p-4">
            <summary className="cursor-pointer font-semibold text-brand-dark">+ เพิ่มข่าวสารใหม่</summary>
            <div className="mt-4">{editor("news")}</div>
          </details>
        </div>
        <div className="space-y-3">
          {articles.map((article) => (
            <details key={article.id} className="rounded-2xl border border-line bg-white p-4">
              <summary className="cursor-pointer font-medium">
                {article.title} <span className="text-xs text-muted">({article.category} • {article.isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"})</span>
              </summary>
              <div className="mt-4">
                {editor("news", article)}
                <form action={deleteContent} className="mt-3">
                  <input type="hidden" name="id" value={article.id} />
                  <input type="hidden" name="kind" value="news" />
                  <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                    ลบข่าวสารนี้
                  </button>
                </form>
              </div>
            </details>
          ))}
          {articles.length === 0 && <p className="text-sm text-muted">ยังไม่มีข่าวสารในระบบ</p>}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">จัดการแกลเลอรี</h2>
          <p className="text-sm text-muted">เพิ่มและจัดการภาพถ่ายกิจกรรม การลงพื้นที่ และการสแกน 3D</p>
        </div>
        <div className="mb-6">
          <details className="rounded-2xl border border-line bg-white p-4">
            <summary className="cursor-pointer font-semibold text-brand-dark">+ เพิ่มภาพแกลเลอรีใหม่</summary>
            <div className="mt-4">{editor("gallery")}</div>
          </details>
        </div>
        <div className="space-y-3">
          {images.map((image) => (
            <details key={image.id} className="rounded-2xl border border-line bg-white p-4">
              <summary className="cursor-pointer font-medium">
                {image.caption} <span className="text-xs text-muted">({image.category} • {image.isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"})</span>
              </summary>
              <div className="mt-4">
                {editor("gallery", image)}
                <form action={deleteContent} className="mt-3">
                  <input type="hidden" name="id" value={image.id} />
                  <input type="hidden" name="kind" value="gallery" />
                  <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                    ลบภาพนี้
                  </button>
                </form>
              </div>
            </details>
          ))}
          {images.length === 0 && <p className="text-sm text-muted">ยังไม่มีภาพในแกลเลอรี</p>}
        </div>
      </section>
    </div>
  );
}
