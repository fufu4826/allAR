"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type ItemActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function validateItemFields(formData: FormData) {
  const collectionId = String(formData.get("collectionId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sortOrderStr = String(formData.get("sortOrder") || "0").trim();
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const fieldErrors: Record<string, string> = {};

  if (!collectionId) {
    fieldErrors.collectionId = "กรุณาเลือกแหล่งเรียนรู้";
  }
  if (!name || name.length > 255) {
    fieldErrors.name = "กรุณาระบุชื่อชิ้นงาน (ไม่เกิน 255 ตัวอักษร)";
  }
  if (!description) {
    fieldErrors.description = "กรุณาระบุรายละเอียดชิ้นงาน";
  }

  const sortOrder = parseInt(sortOrderStr, 10);
  if (isNaN(sortOrder) || sortOrder < 0) {
    fieldErrors.sortOrder = "ลำดับต้องเป็นตัวเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      collectionId,
      name,
      description,
      isFeatured,
      isPublished,
      sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
    },
  };
}

export async function createItemAction(
  _prevState: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const admin = await requireAdmin();
  const validation = validateItemFields(formData);

  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;

  // Verify collection exists
  const [col] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, data.collectionId))
    .limit(1);

  if (!col) {
    return {
      fieldErrors: { collectionId: "ไม่พบแหล่งเรียนรู้ที่เลือก" },
      error: "แหล่งเรียนรู้ไม่ถูกต้อง",
    };
  }

  const modelFile = formData.get("modelFile");
  if (!(modelFile instanceof File) || modelFile.size === 0) {
    return {
      fieldErrors: { modelFile: "กรุณาเลือกไฟล์โมเดล 3D (.glb)" },
      error: "จำเป็นต้องอัปโหลดไฟล์โมเดล 3D (.glb)",
    };
  }

  const usdzFile = formData.get("usdzFile");
  const thumbnailFile = formData.get("thumbnailFile");
  const audioFile = formData.get("audioFile");

  const newlyUploaded: string[] = [];
  let modelPath: string | null = null;
  let usdzPath: string | null = null;
  let thumbnailPath: string | null = null;
  let audioPath: string | null = null;

  try {
    modelPath = await saveUpload(modelFile, "model");
    newlyUploaded.push(modelPath);

    if (usdzFile instanceof File && usdzFile.size > 0) {
      usdzPath = await saveUpload(usdzFile, "usdz");
      newlyUploaded.push(usdzPath);
    }
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      thumbnailPath = await saveUpload(thumbnailFile, "image");
      newlyUploaded.push(thumbnailPath);
    }
    if (audioFile instanceof File && audioFile.size > 0) {
      audioPath = await saveUpload(audioFile, "audio");
      newlyUploaded.push(audioPath);
    }

    const id = crypto.randomUUID().replaceAll("-", "");

    await db.insert(items).values({
      id,
      collectionId: data.collectionId,
      name: data.name,
      description: data.description,
      modelPath,
      usdzPath,
      thumbnailPath,
      audioPath,
      isFeatured: data.isFeatured,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    });

    await audit(admin.id, "create", "item", id, { name: data.name, collectionId: data.collectionId });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    for (const f of newlyUploaded) {
      await deleteUpload(f).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Create item error:", error);
    return { error: "เกิดข้อผิดพลาดในการสร้างชิ้นงาน กรุณาลองใหม่อีกครั้ง" };
  }

  redirect("/admin/items");
}

export async function updateItemAction(
  id: string,
  _prevState: ItemActionState,
  formData: FormData
): Promise<ItemActionState> {
  const admin = await requireAdmin();
  const validation = validateItemFields(formData);

  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;

  const [existing] = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลชิ้นงานที่ต้องการแก้ไข" };
  }

  const [col] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, data.collectionId))
    .limit(1);

  if (!col) {
    return {
      fieldErrors: { collectionId: "ไม่พบแหล่งเรียนรู้ที่เลือก" },
      error: "แหล่งเรียนรู้ไม่ถูกต้อง",
    };
  }

  const modelFile = formData.get("modelFile");
  const usdzFile = formData.get("usdzFile");
  const thumbnailFile = formData.get("thumbnailFile");
  const audioFile = formData.get("audioFile");

  let modelPath = existing.modelPath;
  let usdzPath = existing.usdzPath;
  let thumbnailPath = existing.thumbnailPath;
  let audioPath = existing.audioPath;

  const newlyUploaded: string[] = [];
  const oldToDelete: string[] = [];

  try {
    if (modelFile instanceof File && modelFile.size > 0) {
      const newModel = await saveUpload(modelFile, "model");
      newlyUploaded.push(newModel);
      if (existing.modelPath) oldToDelete.push(existing.modelPath);
      modelPath = newModel;
    }

    if (usdzFile instanceof File && usdzFile.size > 0) {
      const newUsdz = await saveUpload(usdzFile, "usdz");
      newlyUploaded.push(newUsdz);
      if (existing.usdzPath) oldToDelete.push(existing.usdzPath);
      usdzPath = newUsdz;
    } else if (formData.get("removeUsdz") === "true") {
      if (existing.usdzPath) oldToDelete.push(existing.usdzPath);
      usdzPath = null;
    }

    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const newThumb = await saveUpload(thumbnailFile, "image");
      newlyUploaded.push(newThumb);
      if (existing.thumbnailPath) oldToDelete.push(existing.thumbnailPath);
      thumbnailPath = newThumb;
    } else if (formData.get("removeThumbnail") === "true") {
      if (existing.thumbnailPath) oldToDelete.push(existing.thumbnailPath);
      thumbnailPath = null;
    }

    if (audioFile instanceof File && audioFile.size > 0) {
      const newAudio = await saveUpload(audioFile, "audio");
      newlyUploaded.push(newAudio);
      if (existing.audioPath) oldToDelete.push(existing.audioPath);
      audioPath = newAudio;
    } else if (formData.get("removeAudio") === "true") {
      if (existing.audioPath) oldToDelete.push(existing.audioPath);
      audioPath = null;
    }

    await db
      .update(items)
      .set({
        collectionId: data.collectionId,
        name: data.name,
        description: data.description,
        modelPath,
        usdzPath,
        thumbnailPath,
        audioPath,
        isFeatured: data.isFeatured,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
      })
      .where(eq(items.id, id));

    // Delete old files after successful DB update
    for (const f of oldToDelete) {
      await deleteUpload(f).catch(() => {});
    }

    await audit(admin.id, "update", "item", id, { name: data.name });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    for (const f of newlyUploaded) {
      await deleteUpload(f).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Update item error:", error);
    return { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง" };
  }

  redirect("/admin/items");
}

export async function deleteItemAction(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const [existing] = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลชิ้นงานที่ต้องการลบ" };
  }

  try {
    const filesToDelete = [
      existing.modelPath,
      existing.usdzPath,
      existing.thumbnailPath,
      existing.audioPath,
    ].filter(Boolean) as string[];

    await db.delete(items).where(eq(items.id, id));

    for (const f of filesToDelete) {
      await deleteUpload(f).catch(() => {});
    }

    await audit(admin.id, "delete", "item", id, { name: existing.name });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    console.error("Delete item error:", error);
    return { error: "เกิดข้อผิดพลาดในการลบชิ้นงาน" };
  }

  redirect("/admin/items");
}
