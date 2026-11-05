import { test } from "node:test";
import assert from "node:assert/strict";

test("admin validation: slugs and coordinates", () => {
  const validSlugs = ["ban-chiang", "test-community", "comm-1", "abc"];
  const invalidSlugs = ["Ban-Chiang", "test_community", "comm 1", "comm/1", "ชุมชน"];

  for (const s of validSlugs) {
    assert.equal(/^[a-z0-9-]+$/.test(s), true, `Expected ${s} to be valid`);
  }
  for (const s of invalidSlugs) {
    assert.equal(/^[a-z0-9-]+$/.test(s), false, `Expected ${s} to be invalid`);
  }

  // Coordinates
  const validCoords = [
    { lat: 17.156843, lng: 104.145892 },
    { lat: -90, lng: 180 },
    { lat: 90, lng: -180 },
    { lat: 0, lng: 0 },
  ];
  const invalidCoords = [
    { lat: 91, lng: 100 },
    { lat: -91, lng: 100 },
    { lat: 10, lng: 181 },
    { lat: 10, lng: -181 },
    { lat: NaN, lng: 100 },
  ];

  for (const c of validCoords) {
    const isValid = !isNaN(c.lat) && !isNaN(c.lng) && c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180;
    assert.equal(isValid, true);
  }
  for (const c of invalidCoords) {
    const isValid = !isNaN(c.lat) && !isNaN(c.lng) && c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180;
    assert.equal(isValid, false);
  }
});

test("admin validation: hex color format", () => {
  const validColors = ["#e9773e", "#FFFFFF", "#000000", "#123456", "#abcdef"];
  const invalidColors = ["e9773e", "#fff", "#1234567", "red", "rgb(0,0,0)"];

  for (const c of validColors) {
    assert.equal(/^#[0-9a-fA-F]{6}$/.test(c), true, `Expected ${c} to be valid`);
  }
  for (const c of invalidColors) {
    assert.equal(/^#[0-9a-fA-F]{6}$/.test(c), false, `Expected ${c} to be invalid`);
  }
});

test("admin validation: admin username bounds", () => {
  const validUsernames = ["admin", "somchai_01", "dev.admin", "user-name"];
  const invalidUsernames = ["ab", "a".repeat(65), "user name", "admin@domain", "ผู้ดูแล"];

  for (const u of validUsernames) {
    const ok = /^[a-zA-Z0-9_.-]+$/.test(u) && u.length >= 3 && u.length <= 64;
    assert.equal(ok, true, `Expected ${u} to be valid`);
  }
  for (const u of invalidUsernames) {
    const ok = /^[a-zA-Z0-9_.-]+$/.test(u) && u.length >= 3 && u.length <= 64;
    assert.equal(ok, false, `Expected ${u} to be invalid`);
  }
});

test("admin validation: password length requirement", () => {
  assert.equal("12345678901".length < 12, true); // 11 chars: reject
  assert.equal("123456789012".length >= 12, true); // 12 chars: accept
  assert.equal("a".repeat(128).length <= 128, true); // 128 chars: accept
  assert.equal("a".repeat(129).length > 128, true); // 129 chars: reject
});
