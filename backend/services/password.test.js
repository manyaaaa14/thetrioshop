import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { verifyAndUpgradePassword } from "./password.js";

test("accepts and upgrades a legacy plaintext password", async () => {
  const result = await verifyAndUpgradePassword("legacy-password", "legacy-password");

  assert.equal(result.valid, true);
  assert.ok(result.upgradedHash);
  assert.notEqual(result.upgradedHash, "legacy-password");
  assert.equal(await bcrypt.compare("legacy-password", result.upgradedHash), true);
});

test("rejects an incorrect legacy plaintext password", async () => {
  const result = await verifyAndUpgradePassword("wrong-password", "legacy-password");

  assert.deepEqual(result, { valid: false, upgradedHash: null });
});

test("verifies an existing bcrypt password without upgrading it", async () => {
  const hash = await bcrypt.hash("current-password", 10);
  const result = await verifyAndUpgradePassword("current-password", hash);

  assert.deepEqual(result, { valid: true, upgradedHash: null });
});

test("rejects an incorrect password for an existing bcrypt hash", async () => {
  const hash = await bcrypt.hash("current-password", 10);
  const result = await verifyAndUpgradePassword("wrong-password", hash);

  assert.deepEqual(result, { valid: false, upgradedHash: null });
});
