"use server";

import { eq } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type CollectionActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
} | null;

function validateCollection(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sortOrderStr = String(formData.get("sortOrder") || "0").trim();

  const fieldErrors: Record<string, string> = {};

  if (!name || name.length > 255) {
    fieldErrors.name = "กรุณาระบุชื่อแหล่งเรียนรู้ (ไม่เกิน 255 ตัวอักษร)";
  }
  if (!description) {
    fieldErrors.description = "กรุณาระบุรายละเอียดแหล่งเรียนรู้";
  }

  const sortOrder = parseInt(sortOrderStr, 10);
  if (isNaN(sortOrder) || sortOrder < 0) {
    fieldErrors.sortOrder = "ลำดับต้องเป็นตัวเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      description,
      sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
    },
  };
}

export async function createCollectionAction(
  communityId: string,
  _prevState: CollectionActionState,
  formData: FormData
): Promise<CollectionActionState> {
  const admin = await requireAdmin();

  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.id, communityId))
    .limit(1);

  if (!community) {
    return { error: "ไม่พบข้อมูลชุมชน" };
  }

  const validation = validateCollection(formData);
  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;
  const imageFile = formData.get("image");
  let imagePath: string | null = null;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      imagePath = await saveUpload(imageFile, "image");
    }

    const id = crypto.randomUUID().replaceAll("-", "");

    await db.insert(collections).values({
      id,
      communityId,
      name: data.name,
      description: data.description,
      imagePath,
      sortOrder: data.sortOrder,
    });

    await audit(admin.id, "create", "collection", id, { name: data.name, communityId });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
    return { success: true };
  } catch (error) {
    if (imagePath) {
      await deleteUpload(imagePath).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Create collection error:", error);
    return { error: "เกิดข้อผิดพลาดในการสร้างแหล่งเรียนรู้" };
  }
}

export async function updateCollectionAction(
  id: string,
  _prevState: CollectionActionState,
  formData: FormData
): Promise<CollectionActionState> {
  const admin = await requireAdmin();

  const [existing] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลแหล่งเรียนรู้ที่ต้องการแก้ไข" };
  }

  const validation = validateCollection(formData);
  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;
  const imageFile = formData.get("image");
  let imagePath = existing.imagePath;
  let newUploadedPath: string | null = null;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      newUploadedPath = await saveUpload(imageFile, "image");
      imagePath = newUploadedPath;
    }

    await db
      .update(collections)
      .set({
        name: data.name,
        description: data.description,
        imagePath,
        sortOrder: data.sortOrder,
      })
      .where(eq(collections.id, id));

    if (newUploadedPath && existing.imagePath && existing.imagePath !== newUploadedPath) {
      await deleteUpload(existing.imagePath).catch(() => {});
    }

    await audit(admin.id, "update", "collection", id, { name: data.name });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
    return { success: true };
  } catch (error) {
    if (newUploadedPath) {
      await deleteUpload(newUploadedPath).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Update collection error:", error);
    return { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function deleteCollectionAction(id: string): Promise<{ error?: string; success?: boolean }> {
  const admin = await requireAdmin();

  const [existing] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลแหล่งเรียนรู้ที่ต้องการลบ" };
  }

  try {
    // Find all items of this collection
    const itemRows = await db
      .select({
        modelPath: items.modelPath,
        usdzPath: items.usdzPath,
        thumbnailPath: items.thumbnailPath,
        audioPath: items.audioPath,
      })
      .from(items)
      .where(eq(items.collectionId, id));

    const filesToDelete: string[] = [];
    if (existing.imagePath) filesToDelete.push(existing.imagePath);
    for (const it of itemRows) {
      if (it.modelPath) filesToDelete.push(it.modelPath);
      if (it.usdzPath) filesToDelete.push(it.usdzPath);
      if (it.thumbnailPath) filesToDelete.push(it.thumbnailPath);
      if (it.audioPath) filesToDelete.push(it.audioPath);
    }

    // Delete collection from DB (cascades to items)
    await db.delete(collections).where(eq(collections.id, id));

    // Delete files after DB delete succeeds
    for (const filePath of filesToDelete) {
      await deleteUpload(filePath).catch(() => {});
    }

    await audit(admin.id, "delete", "collection", id, { name: existing.name });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
    return { success: true };
  } catch (error) {
    console.error("Delete collection error:", error);
    return { error: "เกิดข้อผิดพลาดในการลบแหล่งเรียนรู้" };
  }
}
