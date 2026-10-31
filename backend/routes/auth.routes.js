import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { db } from "../db/db.js";
import { protectUser } from "../middleware/auth.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/auth.js";
import {
  loginAttemptTracker,
  loginRequestLimiter,
  passwordResetLimiter,
  recordFailedLogin,
  recordSuccessfulLogin,
  rejectBusyLogin,
  rejectLoginDuringCooldown,
  runLoginAttempt,
} from "../middleware/authProtection.js";
import { getFirebaseAdminAuth } from "../services/firebaseAdmin.js";
import { verifyAndUpgradePassword } from "../services/password.js";

const router = express.Router();

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return db.findOne("users", (user) => typeof user?.email === "string" && user.email.toLowerCase() === normalizedEmail);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/firebase-session
router.post("/firebase-session", loginRequestLimiter, async (req, res, next) => {
  try {
    const { idToken, name, phone } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "Firebase ID token is required." });
    }

    let firebaseAuth;
    try {
      firebaseAuth = await getFirebaseAdminAuth();
    } catch (err) {
      console.error("Firebase Admin configuration error:", err.message);
      return res.status(503).json({
        success: false,
        message: "Firebase Admin configuration is invalid. Check the server service-account credentials.",
      });
    }

    if (!firebaseAuth) {
      return res.status(503).json({ success: false, message: "Firebase Admin is not configured on the server." });
    }

    let identity;
    try {
      identity = await firebaseAuth.verifyIdToken(idToken);
    } catch (err) {
      if (["auth/argument-error", "auth/id-token-expired", "auth/invalid-id-token"].includes(err.code)) {
        return res.status(401).json({ success: false, message: "Invalid or expired Firebase ID token." });
      }

      console.error("Firebase ID token verification failed:", err.message);
      return res.status(503).json({
        success: false,
        message: "Firebase could not verify the sign-in token. Check the server Firebase project configuration and connectivity.",
      });
    }

    if (!identity.uid || !identity.email) {
      return res.status(401).json({ success: false, message: "Firebase account must have an email address." });
    }

    const email = normalizeEmail(identity.email);
    let user = db.findOne("users", (entry) => entry.firebaseUid === identity.uid);
    const emailUser = findUserByEmail(email);
    if (user?.role === "admin" || emailUser?.role === "admin") {
      return res.status(403).json({ success: false, message: "Please use the admin sign-in portal." });
    }

    if (!user && emailUser) {
      if (emailUser.firebaseUid && emailUser.firebaseUid !== identity.uid) {
        return res.status(409).json({ success: false, message: "This email is linked to a different Firebase account." });
      }
      if (!identity.email_verified) {
        return res.status(403).json({ success: false, message: "Verify your email with Firebase before linking this existing account." });
      }
      user = db.update("users", emailUser.id, {
        firebaseUid: identity.uid,
        password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        isVerified: true,
      });
    }

    if (!user) {
      const requestedName = typeof name === "string" ? name.trim() : "";
      const identityName = typeof identity.name === "string" ? identity.name.trim() : "";
      user = db.insert("users", {
        name: requestedName || identityName || email.split("@")[0],
        email,
        password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        firebaseUid: identity.uid,
        phone: typeof phone === "string" ? phone : "",
        role: "user",
        address: null,
        isVerified: Boolean(identity.email_verified),
      });
    }

    const { password: _, ...safeUser } = user;
    recordSuccessfulLogin(email);
    res.json({
      success: true,
      token: generateToken(user),
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.insert("users", {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "user",
      address: null,
    });

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login/check", loginRequestLimiter, (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    return res.status(400).json({ success: false, message: "Please provide an email address." });
  }
  if (rejectLoginDuringCooldown(email, res)) return;
  return res.json({ success: true });
});

router.post("/login", loginRequestLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const normalizedEmail = normalizeEmail(email);
    const result = await runLoginAttempt(normalizedEmail, async () => {
      if (rejectLoginDuringCooldown(normalizedEmail, res)) return;

      const user = findUserByEmail(normalizedEmail);
      if (!user || user.role === "admin") {
        if (recordFailedLogin(normalizedEmail, res)) return;
        const remainingAttempts = loginAttemptTracker.getRemainingAttempts(normalizedEmail);
        const warning = remainingAttempts <= 3
          ? ` (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining)`
          : "";
        return res.status(401).json({
          success: false,
          message: `Invalid email or password.${warning}`,
          remainingAttempts,
          maxAttempts: loginAttemptTracker.getMaxAttempts(),
        });
      }

      const passwordCheck = await verifyAndUpgradePassword(password, user.password);
      if (!passwordCheck.valid) {
        if (recordFailedLogin(normalizedEmail, res)) return;
        const remainingAttempts = loginAttemptTracker.getRemainingAttempts(normalizedEmail);
        const warning = remainingAttempts <= 3
          ? ` (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining)`
          : "";
        return res.status(401).json({
          success: false,
          message: `Invalid email or password.${warning}`,
          remainingAttempts,
          maxAttempts: loginAttemptTracker.getMaxAttempts(),
        });
      }

      if (passwordCheck.upgradedHash) {
        db.update("users", user.id, { password: passwordCheck.upgradedHash });
      }

      recordSuccessfulLogin(normalizedEmail);
      const token = generateToken(user);
      const { password: _, ...safeUser } = user;

      return res.json({
        success: true,
        message: "Logged in successfully!",
        token,
        user: safeUser,
      });
    });
    if (result?.busy) rejectBusyLogin(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/admin-login
router.post("/admin-login", loginRequestLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide admin credentials." });
    }

    const normalizedEmail = normalizeEmail(email);
    const result = await runLoginAttempt(normalizedEmail, async () => {
      if (rejectLoginDuringCooldown(normalizedEmail, res)) return;

      const user = findUserByEmail(normalizedEmail);
      if (!user || user.role !== "admin") {
        if (recordFailedLogin(normalizedEmail, res)) return;
        const remainingAttempts = loginAttemptTracker.getRemainingAttempts(normalizedEmail);
        const warning = remainingAttempts <= 3
          ? ` (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining)`
          : "";
        return res.status(401).json({
          success: false,
          message: `Invalid admin credentials or unauthorized.${warning}`,
          remainingAttempts,
          maxAttempts: loginAttemptTracker.getMaxAttempts(),
        });
      }

      const passwordCheck = await verifyAndUpgradePassword(password, user.password);
      if (!passwordCheck.valid) {
        if (recordFailedLogin(normalizedEmail, res)) return;
        const remainingAttempts = loginAttemptTracker.getRemainingAttempts(normalizedEmail);
        const warning = remainingAttempts <= 3
          ? ` (${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining)`
          : "";
        return res.status(401).json({
          success: false,
          message: `Invalid admin credentials.${warning}`,
          remainingAttempts,
          maxAttempts: loginAttemptTracker.getMaxAttempts(),
        });
      }

      if (passwordCheck.upgradedHash) {
        db.update("users", user.id, { password: passwordCheck.upgradedHash });
      }

      recordSuccessfulLogin(normalizedEmail);
      const token = generateToken(user);
      const { password: _, ...safeUser } = user;

      return res.json({
        success: true,
        message: "Admin authenticated successfully!",
        token,
        user: safeUser,
      });
    });
    if (result?.busy) rejectBusyLogin(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/password-reset/request - Rate-limit reset requests & generate secure reset code
router.post("/password-reset/request", passwordResetLimiter, async (req, res, next) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const email = normalizeEmail(rawEmail);
    const user = findUserByEmail(email);

    let resetCode = null;
    if (user) {
      resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      db.update("users", user.id, {
        resetPasswordCode: resetCode,
        resetPasswordExpires: expiresAt,
      });
      console.log(`[AUTH] Generated password reset code for ${email}: ${resetCode} (valid 15m)`);
    }

    const payload = {
      success: true,
      message: "If an account exists for this email, a 6-digit reset code has been sent.",
    };

    if (resetCode) {
      payload.devResetCode = resetCode;
    }

    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/password-reset/verify - Verify reset code before setting new password
router.post("/password-reset/verify", passwordResetLimiter, (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();

  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Please provide email and the 6-digit reset code." });
  }

  const user = findUserByEmail(email);
  if (!user || !user.resetPasswordCode) {
    return res.status(400).json({ success: false, message: "Invalid or expired reset code." });
  }

  if (user.resetPasswordCode !== code) {
    return res.status(400).json({ success: false, message: "Incorrect reset code. Please check and try again." });
  }

  if (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: "Reset code has expired. Please request a new one." });
  }

  return res.json({ success: true, message: "Reset code verified." });
});

// POST /api/auth/password-reset/confirm - Set new password with verified reset code
router.post("/password-reset/confirm", passwordResetLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "").trim();

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, reset code, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    const user = findUserByEmail(email);
    if (!user || !user.resetPasswordCode) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset request. Please request a new code." });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ success: false, message: "Incorrect reset code. Please check and try again." });
    }

    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Reset code has expired. Please request a new code." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = db.update("users", user.id, {
      password: hashedPassword,
      resetPasswordCode: null,
      resetPasswordExpires: null,
    });

    recordSuccessfulLogin(email);

    if (user.firebaseUid) {
      try {
        const firebaseAuth = await getFirebaseAdminAuth();
        if (firebaseAuth) {
          await firebaseAuth.updateUser(user.firebaseUid, { password: newPassword });
        }
      } catch (fbErr) {
        console.warn("Could not sync updated password to Firebase Admin:", fbErr.message);
      }
    }

    const token = generateToken(updatedUser);
    const { password: _, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      message: "Password reset successfully! You are now signed in.",
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", protectUser, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// PUT /api/auth/profile
router.put("/profile", protectUser, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const updated = db.update("users", req.user.id, updates);
    const { password: _, ...safeUser } = updated;

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
