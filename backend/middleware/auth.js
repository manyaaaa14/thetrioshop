import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { JWT_SECRET } from "../config/auth.js";

function getBearerToken(authHeader) {
  if (typeof authHeader !== "string") return null;

  const match = authHeader.match(/^\s*Bearer\s+([^\s]+)\s*$/i);
  return match ? match[1] : null;
}

export function protectUser(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized. Please login." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = db.findById("users", decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or session expired" });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function protectAdmin(req, res, next) {
  return protectUser(req, res, () => {
    if (req.user && req.user.role === "admin") {
      return next();
    }

    return res.status(403).json({ success: false, message: "Admin access required" });
  });
}

export function optionalUser(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && typeof decoded === "object" && decoded.id) {
        const user = db.findById("users", decoded.id);
        if (user) {
          const { password, ...safeUser } = user;
          req.user = safeUser;
        }
      }
    } catch (e) {
      // ignore token error for optional auth
    }
  }

  return next();
}
