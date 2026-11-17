import { test } from "node:test";
import assert from "node:assert/strict";
import { ANON_BODY_LIMIT, guardAnonymousRequest as guard } from "./requestGuard";

test("requests without a session: large bodies refused, admin pages sent to sign-in", () => {
  assert.equal(guard("GET", "/", null, false), "pass");
  assert.equal(guard("GET", "/c/tharae", null, false), "pass");
  assert.equal(guard("GET", "/admin", null, false), "to-login");
  assert.equal(guard("GET", "/admin/items/", null, false), "to-login");
  assert.equal(guard("GET", "/admin/login", null, false), "pass");
  assert.equal(guard("GET", "/administrator", null, false), "pass");
  // The sign-in form and the visit beacon.
  assert.equal(guard("POST", "/admin/login", "412", true), "pass");
  assert.equal(guard("POST", "/api/stats", "60", true), "pass");
  assert.equal(guard("POST", "/admin/login", String(ANON_BODY_LIMIT), true), "pass");
  // A server action can be posted to any path, so the limit applies everywhere.
  assert.equal(guard("POST", "/", String(ANON_BODY_LIMIT + 1), true), "too-large");
  assert.equal(guard("POST", "/admin/login", "272629760", true), "too-large");
  assert.equal(guard("PUT", "/api/stats", "999999999999999999999", true), "too-large");
  assert.equal(guard("POST", "/admin/login", "abc", true), "too-large");
  // No length given: chunked upload of unknown size.
  assert.equal(guard("POST", "/admin/login", null, true), "too-large");
  assert.equal(guard("POST", "/admin/login", null, false), "pass");
});
