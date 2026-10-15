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
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const normalizedName = name.trim();
    const id = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id) {
      return res.status(400).json({ success: false, message: "Category name must contain letters or numbers." });
    }
    const existing = db.findOne("categories", (category) =>
      category.id === id || (category.name || "").toLowerCase() === normalizedName.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const newCategory = await db.insertPersisted("categories", {
      id,
      name: normalizedName,
      emoji: emoji || "✨",
      color: color || "#F3E8FF",
    });

    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const linkedProduct = db.findOne("products", (product) => product.category?.toLowerCase() === req.params.id.toLowerCase());
    if (linkedProduct) {
      return res.status(409).json({
        success: false,
        message: "Move or delete products in this category before deleting it.",
      });
    }
    const removed = await db.removePersisted("categories", req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
