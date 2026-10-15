import "dotenv/config";
import { randomBytes } from "node:crypto";

const configuredJwtSecret = process.env.JWT_SECRET?.trim();
if (process.env.NODE_ENV === "production" && (!configuredJwtSecret || configuredJwtSecret.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}

export const JWT_SECRET = configuredJwtSecret || randomBytes(32).toString("hex");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
