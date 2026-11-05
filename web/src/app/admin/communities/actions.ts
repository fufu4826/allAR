"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { collections, communities, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type CommunityActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function validateCommunityData(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const shortName = String(formData.get("shortName") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const location = String(formData.get("location") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const latStr = String(formData.get("lat") || "").trim();
  const lngStr = String(formData.get("lng") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const sortOrderStr = String(formData.get("sortOrder") || "0").trim();
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const fieldErrors: Record<string, string> = {};

  if (!name || name.length > 255) {
    fieldErrors.name = "กรุณาระบุชื่อชุมชน (ไม่เกิน 255 ตัวอักษร)";
  }
  if (!shortName || shortName.length > 120) {
    fieldErrors.shortName = "กรุณาระบุชื่อย่อ (ไม่เกิน 120 ตัวอักษร)";
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > 64) {
    fieldErrors.slug = "สลัก (Slug) ต้องประกอบด้วย a-z, 0-9 และขีด - เท่านั้น (ไม่เกิน 64 ตัวอักษร)";
  }
  if (!location || location.length > 255) {
    fieldErrors.location = "กรุณาระบุสถานที่ตั้ง (ไม่เกิน 255 ตัวอักษร)";
  }
  if (!description) {
    fieldErrors.description = "กรุณาระบุรายละเอียดชุมชน";
  }

  const lat = parseFloat(latStr);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    fieldErrors.lat = "ละติจูดต้องเป็นตัวเลขระหว่าง -90 ถึง 90";
  }

  const lng = parseFloat(lngStr);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    fieldErrors.lng = "ลองจิจูดต้องเป็นตัวเลขระหว่าง -180 ถึง 180";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    fieldErrors.color = "รหัสสีต้องเป็นรหัสฐานสิบหก 6 หลัก เช่น #e9773e";
  }

  const sortOrder = parseInt(sortOrderStr, 10);
  if (isNaN(sortOrder) || sortOrder < 0) {
    fieldErrors.sortOrder = "ลำดับการแสดงผลต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    data: {
      name,
      shortName,
      slug,
      location,
      description,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      color,
      sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
      isPublished,
    },
  };
}

export async function createCommunityAction(
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const admin = await requireAdmin();
  const validation = validateCommunityData(formData);

  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;

  // Check unique slug
  const [existingSlug] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.slug, data.slug))
    .limit(1);

  if (existingSlug) {
    return {
      fieldErrors: { slug: "สลักนี้ถูกใช้งานแล้ว กรุณาใช้ชื่อสลักอื่น" },
      error: "สลัก (Slug) ซ้ำกับชุมชนอื่น",
    };
  }

  const coverFile = formData.get("coverImage");
  let coverPath: string | null = null;

  try {
    if (coverFile instanceof File && coverFile.size > 0) {
      coverPath = await saveUpload(coverFile, "image");
    }

    const id = crypto.randomUUID().replaceAll("-", "");

    await db.insert(communities).values({
      id,
      name: data.name,
      shortName: data.shortName,
      slug: data.slug,
      location: data.location,
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      color: data.color,
      coverPath,
      sortOrder: data.sortOrder,
      isPublished: data.isPublished,
    });

    await audit(admin.id, "create", "community", id, { name: data.name, slug: data.slug });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    if (coverPath) {
      await deleteUpload(coverPath).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Create community error:", error);
    return { error: "เกิดข้อผิดพลาดในการสร้างชุมชน กรุณาลองใหม่อีกครั้ง" };
  }

  redirect("/admin/communities");
}

export async function updateCommunityAction(
  id: string,
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const admin = await requireAdmin();
  const validation = validateCommunityData(formData);

  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;

  const [existing] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลชุมชนที่ต้องการแก้ไข" };
  }

  // Check slug uniqueness if changed
  if (data.slug !== existing.slug) {
    const [slugConflict] = await db
      .select({ id: communities.id })
      .from(communities)
      .where(and(eq(communities.slug, data.slug), ne(communities.id, id)))
      .limit(1);

    if (slugConflict) {
      return {
        fieldErrors: { slug: "สลักนี้ถูกใช้งานแล้ว กรุณาใช้ชื่อสลักอื่น" },
        error: "สลัก (Slug) ซ้ำกับชุมชนอื่น",
      };
    }
  }

  const coverFile = formData.get("coverImage");
  let coverPath = existing.coverPath;
  let newUploadedPath: string | null = null;

  try {
    if (coverFile instanceof File && coverFile.size > 0) {
      newUploadedPath = await saveUpload(coverFile, "image");
      coverPath = newUploadedPath;
    }

    await db
      .update(communities)
      .set({
        name: data.name,
        shortName: data.shortName,
        slug: data.slug,
        location: data.location,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        color: data.color,
        coverPath,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      })
      .where(eq(communities.id, id));

    // If new cover uploaded successfully and old cover existed, delete old cover
    if (newUploadedPath && existing.coverPath && existing.coverPath !== newUploadedPath) {
      await deleteUpload(existing.coverPath).catch(() => {});
    }

    await audit(admin.id, "update", "community", id, { name: data.name, slug: data.slug });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    if (newUploadedPath) {
      await deleteUpload(newUploadedPath).catch(() => {});
    }
    if (error instanceof UploadError) {
      return { error: error.message };
    }
    console.error("Update community error:", error);
    return { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง" };
  }

  redirect("/admin/communities");
}

export async function deleteCommunityAction(id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const [existing] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลชุมชนที่ต้องการลบ" };
  }

  try {
    // Find all collections
    const colRows = await db
      .select({ id: collections.id, imagePath: collections.imagePath })
      .from(collections)
      .where(eq(collections.communityId, id));

    const colIds = colRows.map((c) => c.id);

    // Find all items
    const itemRows =
      colIds.length > 0
        ? await db
            .select({
              modelPath: items.modelPath,
              usdzPath: items.usdzPath,
              thumbnailPath: items.thumbnailPath,
              audioPath: items.audioPath,
            })
            .from(items)
            .where(inArray(items.collectionId, colIds))
        : [];

    const filesToDelete: string[] = [];
    if (existing.coverPath) filesToDelete.push(existing.coverPath);
    for (const c of colRows) {
      if (c.imagePath) filesToDelete.push(c.imagePath);
    }
    for (const it of itemRows) {
      if (it.modelPath) filesToDelete.push(it.modelPath);
      if (it.usdzPath) filesToDelete.push(it.usdzPath);
      if (it.thumbnailPath) filesToDelete.push(it.thumbnailPath);
      if (it.audioPath) filesToDelete.push(it.audioPath);
    }

    // Delete DB row (cascades in DB to collections and items)
    await db.delete(communities).where(eq(communities.id, id));

    // Delete files after DB delete succeeds
    for (const filePath of filesToDelete) {
      await deleteUpload(filePath).catch(() => {});
    }

    await audit(admin.id, "delete", "community", id, { name: existing.name });
    revalidateTag("content", { expire: 0 });
    updateTag("content");
  } catch (error) {
    console.error("Delete community error:", error);
    return { error: "เกิดข้อผิดพลาดในการลบชุมชน" };
  }

  redirect("/admin/communities");
}
