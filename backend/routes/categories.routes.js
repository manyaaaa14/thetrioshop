import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/categories - All categories
router.get("/", (req, res) => {
  try {
    const categories = db.find("categories");
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories - Create category (Admin)
router.post("/", protectAdmin, (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = db.findById("categories", id);
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const newCategory = db.insert("categories", {
      id,
      name: name.trim(),
      emoji: emoji || "✨",
      color: color || "#F3E8FF",
    });

    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin)
router.delete("/:id", protectAdmin, (req, res) => {
  try {
    const removed = db.remove("categories", req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
