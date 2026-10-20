import assert from "node:assert/strict";
import test from "node:test";
import { applicationAccess } from "../lib/application-access.js";

test("active application assignment grants access without evaluating its role", () => {
  assert.equal(applicationAccess(true, [{ key: "APP_LOCAL_ROLE" }]), true);
  assert.equal(applicationAccess(true, [{}]), true);
});

test("inactive accounts and users without application assignments have no access", () => {
  assert.equal(applicationAccess(false, [{ key: "ADMIN" }]), false);
  assert.equal(applicationAccess(true, []), false);
  assert.equal(applicationAccess(true, null), false);
});
