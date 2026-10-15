import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// POST /api/coupons/validate - Check coupon validity & calculate discount
router.post("/validate", (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Please provide a coupon code" });
    }

    const coupon = db.findOne("coupons", (c) => c.code.toUpperCase() === code.toUpperCase().trim());
    if (!coupon || !coupon.active) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon code" });
    }

    const amount = Number(subtotal) || 0;
    if (amount < (coupon.minOrder || 0)) {
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${coupon.minOrder - amount} more to use code "${coupon.code}" (Min order ₹${coupon.minOrder})`,
      });
    }

    let discount = 0;
    if (coupon.type === "flat") {
      discount = Math.min(coupon.value, amount);
    } else if (coupon.type === "pct") {
      discount = Math.round((amount * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    }

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied! You save ₹${discount}`,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coupons - Get all coupons (Admin)
router.get("/", protectAdmin, (req, res) => {
  try {
    const coupons = db.find("coupons");
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coupons - Create coupon (Admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount } = req.body;
    if (typeof code !== "string" || !code.trim() || !type || value === undefined) {
      return res.status(400).json({ success: false, message: "Code, type, and value are required." });
    }

    const upperCode = code.toUpperCase().trim();
    const numericValue = Number(value);
    const numericMinOrder = Number(minOrder) || 0;
    const numericMaxDiscount = maxDiscount == null || maxDiscount === "" ? null : Number(maxDiscount);
    if (!upperCode || !["flat", "pct"].includes(type) || !Number.isFinite(numericValue) ||
      numericValue <= 0 || (type === "pct" && numericValue > 100) ||
      !Number.isFinite(numericMinOrder) || numericMinOrder < 0 ||
      (numericMaxDiscount !== null && (!Number.isFinite(numericMaxDiscount) || numericMaxDiscount <= 0))) {
      return res.status(400).json({ success: false, message: "Enter a valid coupon code, discount, and minimum order." });
    }
    const existing = db.findOne("coupons", (c) => c.code === upperCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon ${upperCode} already exists.` });
    }

    const newCoupon = await db.insertPersisted("coupons", {
      code: upperCode,
      type, // "flat" | "pct"
      value: numericValue,
      minOrder: numericMinOrder,
      maxDiscount: numericMaxDiscount,
      active: true,
    });

    res.status(201).json({ success: true, coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coupons/:id - Delete coupon (Admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const removed = await db.removePersisted("coupons", req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
