"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/db";
import { communities } from "@/db/schema";
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
  const englishName = String(formData.get("englishName") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const tags = String(formData.get("tags") || "").trim();
  const theme = String(formData.get("theme") || "default");
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const location = String(formData.get("location") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const latStr = String(formData.get("lat") || "").trim();
  const lngStr = String(formData.get("lng") || "").trim();
  const color = String(formData.get("color") || "").trim();
  const sortOrderStr = String(formData.get("sortOrder") || "0").trim();
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";

  const fieldErrors: Record<string, string> = {};

  if (englishName.length > 120) fieldErrors.englishName = "English name is too long";
  if (tagline.length > 255) fieldErrors.tagline = "Tagline is too long";
  if (tags.length > 255) fieldErrors.tags = "Tags are too long";
  if (!["default", "phuphan", "nonhom", "tharae", "watklang", "watnuea"].includes(theme)) fieldErrors.theme = "Invalid theme";

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
      englishName: englishName || null,
      tagline: tagline || null,
      tags: tags || null,
      theme,
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

// The site is fixed at the five learning sites of the project: there is no action to add or
// delete one, and a site's slug (its public URL, theme and map pin key) cannot be changed.
export async function updateCommunityAction(
  id: string,
  _prevState: CommunityActionState,
  formData: FormData
): Promise<CommunityActionState> {
  const admin = await requireAdmin();

  const [existing] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, id))
    .limit(1);

  if (!existing) {
    return { error: "ไม่พบข้อมูลชุมชนที่ต้องการแก้ไข" };
  }

  // The slug is fixed: whatever the form sends, keep the stored one.
  formData.set("slug", existing.slug);
  const validation = validateCommunityData(formData);

  if (!validation.isValid) {
    return { fieldErrors: validation.fieldErrors, error: "กรุณาตรวจสอบข้อมูลที่กรอก" };
  }

  const { data } = validation;

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
        englishName: data.englishName,
        tagline: data.tagline,
        tags: data.tags,
        theme: data.theme,
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
