import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024;

function isValidImage(image) {
  if (typeof image !== "string" || !image.trim()) return false;
  if (/^https?:\/\/\S+$/i.test(image)) return true;
  const match = image.match(/^data:image\/(?:png|jpe?g|gif|webp);base64,([a-z0-9+/]+=*)$/i);
  return Boolean(match && Buffer.from(match[1], "base64").length <= MAX_IMAGE_BYTES);
}

function validateProductImages(images) {
  return Array.isArray(images) &&
    images.length > 0 &&
    images.length <= MAX_IMAGES &&
    images.every(isValidImage) &&
    images.reduce((total, image) => {
      if (!image.startsWith("data:image/")) return total;
      return total + Buffer.from(image.slice(image.indexOf(",") + 1), "base64").length;
    }, 0) <= MAX_TOTAL_IMAGE_BYTES;
}

async function findCategory(category) {
  const categoryQuery = String(category || "").toLowerCase().trim();
  return db.findOnePersisted("categories", (item) =>
    item.id.toLowerCase() === categoryQuery || (item.name || "").toLowerCase() === categoryQuery
  );
}

// GET /api/products - Get all products with search, filtering & sorting
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, onlyAvailable, badge } = req.query;
    let products = await db.findPersisted("products", (p) => !p.hidden);

    if (category && category !== "all") {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.desc && p.desc.toLowerCase().includes(q))
      );
    }

    if (minPrice) {
      products = products.filter((p) => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      products = products.filter((p) => p.price <= Number(maxPrice));
    }

    if (onlyAvailable === "true") {
      products = products.filter((p) => p.stock > 0);
    }

    if (badge) {
      products = products.filter((p) => p.badges && p.badges.includes(badge));
    }

    // Sorting
    if (sort === "price-low") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "new") {
      products.sort((a, b) => (b.badges?.includes("new") ? 1 : 0) - (a.badges?.includes("new") ? 1 : 0));
    } else {
      // Default: popularity / bestsellers
      products.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/admin/all - Get all products including hidden (Admin only)
router.get("/admin/all", protectAdmin, async (req, res) => {
  try {
    const products = await db.findPersisted("products");
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id - Single product
router.get("/:id", async (req, res) => {
  try {
    const product = await db.findByIdPersisted("products", req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products - Create product (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, category, price, mrp, discountPrice, stock, desc, description, images, variants, badges, hidden } = req.body;
    const numericPrice = Number(price);
    const numericMrp = mrp === undefined || mrp === "" ? numericPrice : Number(mrp);
    const numericDiscountPrice = discountPrice === undefined || discountPrice === null || discountPrice === ""
      ? null
      : Number(discountPrice);
    const numericStock = Number(stock);

    if (typeof name !== "string" || !name.trim() || !category ||
      !Number.isFinite(numericPrice) || numericPrice <= 0 ||
      !Number.isFinite(numericMrp) || numericMrp < numericPrice ||
      (numericDiscountPrice !== null && (!Number.isFinite(numericDiscountPrice) ||
        numericDiscountPrice <= 0 || numericDiscountPrice >= numericMrp || numericDiscountPrice !== numericPrice)) ||
      !Number.isInteger(numericStock) || numericStock < 0 ||
      typeof (desc ?? description ?? "") !== "string") {
      return res.status(400).json({ success: false, message: "Enter a product name, valid category, price, discount price, description, and non-negative whole-number stock quantity." });
    }
    const matchedCategory = await findCategory(category);
    if (!matchedCategory) {
      return res.status(400).json({ success: false, message: "Select an existing product category." });
    }
    if (!validateProductImages(images)) {
      return res.status(400).json({ success: false, message: `Upload between 1 and ${MAX_IMAGES} valid product images. Each image must be 2 MB or smaller.` });
    }
    if (badges !== undefined && (!Array.isArray(badges) || badges.some((badge) => typeof badge !== "string"))) {
      return res.status(400).json({ success: false, message: "Product badges must be a list of text values." });
    }

    const newProduct = await db.insertPersisted("products", {
      name: name.trim(),
      category: matchedCategory.id,
      price: numericPrice,
      mrp: numericMrp,
      discountPrice: numericDiscountPrice,
      stock: numericStock,
      desc: (desc ?? description ?? "").trim(),
      description: (desc ?? description ?? "").trim(),
      images,
      variants: variants || { size: [], color: [] },
      badges: badges || [],
      rating: 4.5,
      ratingCount: 1,
      hidden: Boolean(hidden),
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully!",
      product: newProduct,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/admin/all/clear - Clear all products (Admin)
router.delete("/admin/all/clear", protectAdmin, async (req, res) => {
  try {
    await db.clearPersisted("products");
    res.json({ success: true, message: "All products cleared successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id - Update product (Admin)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const product = await db.findByIdPersisted("products", req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const updates = { ...req.body };
    const allowedFields = new Set([
      "name", "category", "price", "mrp", "discountPrice", "stock",
      "desc", "description", "images", "variants", "badges", "hidden",
    ]);
    const unsupportedField = Object.keys(updates).find((field) => !allowedFields.has(field));
    if (unsupportedField) {
      return res.status(400).json({ success: false, message: `Unsupported product field: ${unsupportedField}.` });
    }
    for (const field of ["name", "desc", "description"]) {
      if (updates[field] !== undefined && typeof updates[field] !== "string") {
        return res.status(400).json({ success: false, message: `${field} must be text.` });
      }
    }
    if (updates.name !== undefined) {
      updates.name = updates.name.trim();
      if (!updates.name) return res.status(400).json({ success: false, message: "Product name is required." });
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (!Number.isFinite(updates.price) || updates.price <= 0) {
        return res.status(400).json({ success: false, message: "Product price must be greater than zero." });
      }
    }
    if (updates.mrp !== undefined) {
      updates.mrp = Number(updates.mrp);
      if (!Number.isFinite(updates.mrp) || updates.mrp <= 0) {
        return res.status(400).json({ success: false, message: "Product price must be greater than zero." });
      }
    }
    if (updates.discountPrice !== undefined && updates.discountPrice !== null && updates.discountPrice !== "") {
      updates.discountPrice = Number(updates.discountPrice);
      if (updates.price === undefined) updates.price = updates.discountPrice;
      if (!Number.isFinite(updates.discountPrice) || updates.discountPrice <= 0 ||
        updates.discountPrice >= (updates.mrp ?? product.mrp) ||
        (updates.price !== undefined && updates.discountPrice !== updates.price)) {
        return res.status(400).json({ success: false, message: "Discount price must be lower than the product price and match the selling price." });
      }
    } else if (updates.discountPrice === "" || updates.discountPrice === null) {
      updates.discountPrice = null;
      const productPrice = updates.mrp ?? product.mrp;
      if (updates.price !== undefined && Number(updates.price) !== Number(productPrice)) {
        return res.status(400).json({ success: false, message: "A product without a discount must use its product price." });
      }
      updates.price = Number(productPrice);
    }
    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        return res.status(400).json({ success: false, message: "Stock quantity must be a non-negative whole number." });
      }
    }
    if ((updates.mrp ?? product.mrp) < (updates.price ?? product.price)) {
      return res.status(400).json({ success: false, message: "Discount price cannot be lower than the selling price." });
    }
    if (updates.images !== undefined && !validateProductImages(updates.images)) {
      return res.status(400).json({ success: false, message: `Upload between 1 and ${MAX_IMAGES} valid product images. Each image must be 2 MB or smaller.` });
    }
    if (updates.badges !== undefined && (!Array.isArray(updates.badges) || updates.badges.some((badge) => typeof badge !== "string"))) {
      return res.status(400).json({ success: false, message: "Product badges must be a list of text values." });
    }
    if (updates.hidden !== undefined && typeof updates.hidden !== "boolean") {
      return res.status(400).json({ success: false, message: "Product visibility must be true or false." });
    }
    if (updates.category !== undefined) {
      const matchedCategory = await findCategory(updates.category);
      if (!matchedCategory) {
        return res.status(400).json({ success: false, message: "Select an existing product category." });
      }
      updates.category = matchedCategory.id;
    }

    if (updates.desc !== undefined) updates.description = updates.desc;
    if (updates.description !== undefined && updates.desc === undefined) updates.desc = updates.description;
    const updated = await db.updatePersisted("products", req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({
      success: true,
      message: "Product updated successfully!",
      product: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deleted = await db.removePersisted("products", req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id/stock - Adjust stock (Admin)
router.patch("/:id/stock", protectAdmin, async (req, res) => {
  try {
    const { stock } = req.body;
    const quantity = Number(stock);
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: "Stock quantity must be a non-negative whole number." });
    }

    const updated = await db.updatePersisted("products", req.params.id, { stock: quantity });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Stock updated successfully!", product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
