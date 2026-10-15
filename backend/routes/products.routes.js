import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/products - Get all products with search, filtering & sorting
router.get("/", (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, onlyAvailable, badge } = req.query;
    let products = db.find("products", (p) => !p.hidden);

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
router.get("/admin/all", protectAdmin, (req, res) => {
  try {
    const products = db.find("products");
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id - Single product
router.get("/:id", (req, res) => {
  try {
    const product = db.findById("products", req.params.id);
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
    const { name, category, price, mrp, stock, desc, images, variants, badges } = req.body;

    if (typeof name !== "string" || !name.trim() || price === undefined || !category) {
      return res.status(400).json({ success: false, message: "Name, category, and price are required." });
    }
    const categoryId = String(category).toLowerCase().trim();
    if (!db.findById("categories", categoryId)) {
      return res.status(400).json({ success: false, message: "Select an existing product category." });
    }

    const newProduct = await db.insertPersisted("products", {
      name: name.trim(),
      category: categoryId,
      price: Number(price),
      mrp: Number(mrp) || Number(price),
      stock: Number(stock) || 0,
      desc: desc || "",
      images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"],
      variants: variants || { size: [], color: [] },
      badges: badges || [],
      rating: 4.5,
      ratingCount: 1,
      hidden: false,
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

// PUT /api/products/:id - Update product (Admin)
router.put("/:id", protectAdmin, (req, res) => {
  try {
    const product = db.findById("products", req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.mrp !== undefined) updates.mrp = Number(updates.mrp);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.category !== undefined) {
      updates.category = String(updates.category).toLowerCase().trim();
      if (!db.findById("categories", updates.category)) {
        return res.status(400).json({ success: false, message: "Select an existing product category." });
      }
    }

    const updated = db.update("products", req.params.id, updates);

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
router.patch("/:id/stock", protectAdmin, (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ success: false, message: "Stock quantity required." });
    }

    const updated = db.update("products", req.params.id, { stock: Math.max(0, Number(stock)) });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Stock updated successfully!", product: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
