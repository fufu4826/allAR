"use server";

import { eq } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { galleryImages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveUpload, deleteUpload } from "@/lib/uploads";

export async function saveContent(form: FormData) {
  const admin = await requireAdmin();
  const kind = String(form.get("kind") || "");
  const id = String(form.get("id") || "") || crypto.randomUUID().replaceAll("-", "");
  const communityId = String(form.get("communityId") || "") || null;
  const sortOrder = Number(form.get("sortOrder") || 0);
  const isPublished = form.get("isPublished") === "on";

  if (!/^[a-z0-9-]{1,32}$/.test(id) || !Number.isInteger(sortOrder) || sortOrder < 0 || kind !== "gallery") {
    throw new Error("ข้อมูลไม่ถูกต้อง");
  }

  const file = form.get("image");
  const uploaded = file instanceof File && file.size ? await saveUpload(file, "image") : null;

  try {
    const caption = String(form.get("caption") || "").trim();
    const category = String(form.get("category") || "");

    const [existing] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    const imagePath = uploaded || existing?.imagePath;

    if (!caption || !imagePath || !["fieldwork", "modeling", "testing"].includes(category)) {
      throw new Error("กรุณากรอกข้อมูลภาพแกลเลอรีให้ครบถ้วน");
    }

    const values = {
      communityId,
      caption,
      category,
      imagePath,
      sortOrder,
      isPublished,
    };

    if (existing) {
      await db.update(galleryImages).set(values).where(eq(galleryImages.id, id));
    } else {
      await db.insert(galleryImages).values({ id, ...values });
    }

    if (uploaded && existing?.imagePath) await deleteUpload(existing.imagePath).catch(() => {});
    await audit(admin.id, existing ? "update" : "create", "gallery", id, { caption });
  } catch (error) {
    if (uploaded) await deleteUpload(uploaded).catch(() => {});
    throw error;
  }

  revalidateTag("content", { expire: 0 });
  updateTag("content");
}

export async function deleteContent(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") || "");
  const kind = String(form.get("kind") || "");

  if (kind === "gallery") {
    const [row] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
    if (row?.imagePath) await deleteUpload(row.imagePath).catch(() => {});
  } else {
    throw new Error("ไม่พบประเภทเนื้อหาที่ต้องการลบ");
  }

  await audit(admin.id, "delete", kind, id);
  revalidateTag("content", { expire: 0 });
  updateTag("content");
}
