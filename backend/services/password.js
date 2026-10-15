import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

export async function verifyAndUpgradePassword(password, storedPassword) {
  if (typeof password !== "string" || typeof storedPassword !== "string") {
    return { valid: false, upgradedHash: null };
  }

  if (BCRYPT_HASH_PATTERN.test(storedPassword)) {
    return {
      valid: await bcrypt.compare(password, storedPassword),
      upgradedHash: null,
    };
  }

  const provided = Buffer.from(password, "utf8");
  const stored = Buffer.from(storedPassword, "utf8");
  if (provided.length !== stored.length || !timingSafeEqual(provided, stored)) {
    return { valid: false, upgradedHash: null };
  }

  return {
    valid: true,
    upgradedHash: await bcrypt.hash(password, 10),
  };
}
