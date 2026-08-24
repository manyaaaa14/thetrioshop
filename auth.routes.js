import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { protectUser } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "the_trio_shop_super_secret_jwt_key_2026_secure";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Please provide name, email, and password." });
    }

    const existing = db.findOne("users", (u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.insert("users", {
      name: name.trim(),
      email: email.toLowerCase().trim(),
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
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const user = db.findOne("users", (u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: "Logged in successfully!",
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/admin-login
router.post("/admin-login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide admin credentials." });
    }

    const user = db.findOne("users", (u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Invalid admin credentials or unauthorized." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: "Admin authenticated successfully!",
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
