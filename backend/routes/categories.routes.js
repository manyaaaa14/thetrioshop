import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function isValidCategoryImage(image) {
  if (image === undefined || image === "") return true;
  if (typeof image !== "string") return false;
  if (/^https?:\/\/\S+$/i.test(image)) return true;
  const match = image.match(/^data:image\/(?:png|jpe?g|gif|webp);base64,([a-z0-9+/]+=*)$/i);
  return Boolean(match && Buffer.from(match[1], "base64").length <= MAX_IMAGE_BYTES);
}

function isValidCategoryMetadata({ emoji, color }) {
  return (emoji === undefined || (typeof emoji === "string" && emoji.length <= 8)) &&
    (color === undefined || (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)));
}

// GET /api/categories - All categories
router.get("/", async (req, res) => {
  try {
    const categories = await db.findPersisted("categories");
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories - Create category (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, emoji, color, image } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    if (name.trim().length > 80 || !isValidCategoryImage(image) || !isValidCategoryMetadata({ emoji, color })) {
      return res.status(400).json({ success: false, message: "Category name must be 80 characters or fewer and its image must be a valid image up to 2 MB." });
    }

    const normalizedName = name.trim();
    const id = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id) {
      return res.status(400).json({ success: false, message: "Category name must contain letters or numbers." });
    }
    const existing = await db.findOnePersisted("categories", (category) =>
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
      image: image || "",
    });

    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id - Update category (Admin)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const category = await db.findByIdPersisted("categories", req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const { name, emoji, color, image } = req.body;
    const updates = {};
    if (!isValidCategoryMetadata({ emoji, color })) {
      return res.status(400).json({ success: false, message: "Category icon or color is invalid." });
    }
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        return res.status(400).json({ success: false, message: "Category name must be between 1 and 80 characters." });
      }
      const duplicate = await db.findOnePersisted("categories", (item) =>
        item.id !== req.params.id && (item.name || "").toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) return res.status(409).json({ success: false, message: "A category with this name already exists." });
      updates.name = name.trim();
    }
    if (emoji) updates.emoji = emoji;
    if (color) updates.color = color;
    if (image !== undefined) {
      if (!isValidCategoryImage(image)) {
        return res.status(400).json({ success: false, message: "Category image must be a valid image up to 2 MB." });
      }
      updates.image = image;
    }

    const updated = await db.updatePersisted("categories", req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, message: "Category updated successfully!", category: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id.toLowerCase();
    const category = await db.findByIdPersisted("categories", req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    const linkedProduct = await db.findOnePersisted("products", (product) =>
      product.category?.toLowerCase() === categoryId ||
      product.category?.toLowerCase() === category.name.toLowerCase()
    );
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
