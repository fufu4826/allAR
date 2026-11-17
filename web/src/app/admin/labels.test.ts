import { test } from "node:test";
import assert from "node:assert/strict";
import { changedFields, describeDetail, describeTarget } from "./labels";
import { checkUploadSize, formatBytes } from "@/lib/uploadLimits";

const log = (over: Partial<Parameters<typeof describeTarget>[0]>) => ({
  action: "update", entity: "item", entityId: "abc123def456", detail: null, adminUsername: "devadmin", ...over,
});

test("audit target: stored name first, then the current name, then a short id", () => {
  assert.equal(describeTarget(log({ detail: { name: "พระพุทธรูป" } })), "ชิ้นงาน 3D: พระพุทธรูป");
  assert.equal(describeTarget(log({}), new Map([["abc123def456", "ไก่ดำ"]])), "ชิ้นงาน 3D: ไก่ดำ");
  assert.equal(describeTarget(log({})), "ชิ้นงาน 3D: รหัส abc123de");
  assert.equal(describeTarget(log({ entity: "community", detail: { name: "ภูพาน" } })), "แหล่งเรียนรู้: ภูพาน");
  assert.equal(describeTarget(log({ entity: "admin", detail: { username: "somchai" } })), "บัญชีผู้ดูแล: @somchai");
  assert.equal(describeTarget(log({ action: "login", entity: "admin" })), "@devadmin");
});

test("audit detail lists the changed fields", () => {
  assert.equal(describeDetail(log({ detail: { name: "x", changed: ["ชื่อ", "ภาพปก"] } })), "แก้: ชื่อ, ภาพปก");
  assert.equal(describeDetail(log({ detail: { name: "x", changed: [] } })), null);
});

test("changedFields compares as text, so 1.5 and '1.5' or null and '' are equal", () => {
  const labels = { name: "ชื่อ", lat: "ละติจูด", tagline: "คำโปรย", isPublished: "การเผยแพร่" };
  assert.deepEqual(changedFields({ name: "a", lat: "17.050000", tagline: null, isPublished: true }, { name: "a", lat: "17.050000", tagline: "", isPublished: true }, labels), []);
  assert.deepEqual(changedFields({ name: "a", lat: "17.0", isPublished: true }, { name: "b", lat: "17.0", isPublished: false }, labels), ["ชื่อ", "การเผยแพร่"]);
});

test("upload size check warns before the upload", () => {
  assert.equal(checkUploadSize(5 * 1024 * 1024, "model"), null);
  assert.match(checkUploadSize(101 * 1024 * 1024, "model") ?? "", /เกินขนาดสูงสุด 100 MB/);
  assert.match(checkUploadSize(16 * 1024 * 1024, "image") ?? "", /15 MB/);
  assert.equal(checkUploadSize(0, "audio"), "ไฟล์นี้ว่างเปล่า");
  assert.equal(formatBytes(1536), "2 KB");
  assert.equal(formatBytes(12.34 * 1024 * 1024), "12.3 MB");
});
