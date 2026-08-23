import jwt from "jsonwebtoken";
import { db } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "the_trio_shop_super_secret_jwt_key_2026_secure";

export function protectUser(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized. Please login." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById("users", decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or session expired" });
    }

    // Exclude password hash from req.user
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function protectAdmin(req, res, next) {
  protectUser(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
  });
}

export function optionalUser(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.findById("users", decoded.id);
      if (user) {
        const { password, ...safeUser } = user;
        req.user = safeUser;
      }
    } catch (e) {
      // ignore token error for optional auth
    }
  }
  next();
}
