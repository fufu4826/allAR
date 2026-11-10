import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { hashPassword, isLockedOut, tokenHash, verifyPassword } from "./auth";
import { deleteUpload, detectUpload, UploadError } from "./uploads";
test("password hashing and bounds", async () => {
  const encoded = await hashPassword("a secure password");
  assert.equal(await verifyPassword(encoded, "a secure password"), true);
  assert.equal(await verifyPassword(encoded, "wrong"), false);
  await assert.rejects(hashPassword("short")); await assert.rejects(hashPassword("x".repeat(129)));
});
test("session token hash", () => { assert.equal(tokenHash("sample"), createHash("sha256").update("sample").digest("hex")); });
test("upload traversal", async () => { process.env.UPLOAD_DIR = process.cwd(); await assert.rejects(deleteUpload("/uploads/../../outside"), UploadError); });
test("upload signatures", async () => {
  assert.equal(await detectUpload(Buffer.from("glTF"), "model", "x"), "glb");
  assert.equal(await detectUpload(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"), "image", "x"), "png");
  await assert.rejects(detectUpload(Buffer.from("MZ executable"), "image", "fake.png"), UploadError);
});
test("login lockout: per username and address, with caps per address and per username", () => {
  const row = (username: string, ip: string, total: number) => ({ username, ip, total });
  assert.equal(isLockedOut([row("admin", "1.1.1.1", 4)], "admin", "1.1.1.1"), false);
  assert.equal(isLockedOut([row("admin", "1.1.1.1", 5)], "admin", "1.1.1.1"), true);
  // Someone else failing on the admin's username does not lock the admin's own address.
  assert.equal(isLockedOut([row("admin", "9.9.9.9", 30)], "admin", "1.1.1.1"), false);
  assert.equal(isLockedOut([row("admin", "9.9.9.9", 50)], "admin", "1.1.1.1"), true);
  // One address trying many usernames.
  assert.equal(isLockedOut([row("a", "1.1.1.1", 4), row("b", "1.1.1.1", 4), row("c", "1.1.1.1", 4), row("d", "1.1.1.1", 4), row("e", "1.1.1.1", 4)], "f", "1.1.1.1"), true);
});
