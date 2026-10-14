import express from "express";
import { db } from "../db/db.js";
import { optionalUser } from "../middleware/auth.js";
import { getStandardShipping } from "../services/shipping.js";

const router = express.Router();

function validateOrderDraft(orderDraft) {
  if (!orderDraft || !Array.isArray(orderDraft.items) || orderDraft.items.length === 0) {
    throw new Error("No items in order.");
  }
  if (!orderDraft.address || !orderDraft.address.name || !orderDraft.address.phone || !orderDraft.address.address || !orderDraft.address.city || !orderDraft.address.state || !orderDraft.address.pincode) {
    throw new Error("Complete the delivery address before paying.");
  }
  if (!/^\d{10}$/.test(String(orderDraft.address.phone))) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }
  if (!/^\d{6}$/.test(String(orderDraft.address.pincode))) {
    throw new Error("Enter a valid 6-digit pincode.");
  }
}

function getOrderQuote(orderDraft) {
  validateOrderDraft(orderDraft);
  const validatedItems = [];
  let subtotal = 0;

  for (const item of orderDraft.items) {
    if (!item || typeof item !== "object") {
      throw new Error("Order contains an invalid item.");
    }
    const quantity = Number(item.qty);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error("Order quantities must be positive whole numbers.");
    }
    const product = db.findById("products", item.id);
    if (!product) {
      throw new Error(`Product ${item.id} not found.`);
    }
    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} left in stock for "${product.name}".`);
    }

    subtotal += product.price * quantity;
    validatedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      qty: quantity,
      color: item.color || (product.variants?.color?.[0] || null),
      image: product.images?.[0] || "",
      category: product.category,
    });
  }

  let discount = 0;
  let appliedCouponCode = null;
  if (orderDraft.couponCode) {
    const couponCode = String(orderDraft.couponCode).toUpperCase();
    const coupon = db.findOne("coupons", (entry) => entry.code.toUpperCase() === couponCode && entry.active);
    if (coupon && subtotal >= (coupon.minOrder || 0)) {
      if (coupon.type === "flat") {
        discount = Math.min(coupon.value, subtotal);
      } else if (coupon.type === "pct") {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      }
      appliedCouponCode = coupon.code;
    }
  }

  const { shippingMethod, delivery } = getStandardShipping(orderDraft.shippingMethod);
  const total = Math.max(0, subtotal - discount) + delivery;
  return { items: validatedItems, subtotal, discount, appliedCoupon: appliedCouponCode, delivery, total, shippingMethod };
}

router.get("/config", (req, res) => {
  res.json({ success: true, directUpiId: process.env.PAYMENT_UPI_ID || null });
});

router.post("/direct-quote", (req, res) => {
  try {
    const upiId = process.env.PAYMENT_UPI_ID;
    if (!upiId) {
      return res.status(503).json({ success: false, message: "Direct UPI QR payment is not configured." });
    }
    const { orderDraft } = req.body || {};
    const quote = getOrderQuote(orderDraft);
    const upiUri = `upi://pay?${new URLSearchParams({
      pa: upiId,
      pn: "BLORA",
      am: quote.total.toFixed(2),
      cu: "INR",
      tn: "BLORA order payment",
    })}`;
    return res.json({ success: true, upiId, total: quote.total, upiUri });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to prepare UPI QR payment." });
  }
});

router.post("/direct-order", optionalUser, async (req, res) => {
  try {
    if (!process.env.PAYMENT_UPI_ID) {
      return res.status(503).json({ success: false, message: "Direct UPI payment is not configured." });
    }
    const { orderDraft, paymentReference, expectedTotal } = req.body || {};
    const reference = String(paymentReference || "").trim();
    if (!/^[A-Za-z0-9-]{6,64}$/.test(reference)) {
      return res.status(400).json({ success: false, message: "Enter a valid UPI transaction reference (6–64 letters or numbers)." });
    }
    const duplicateReference = db.findOne("orders", (order) =>
      order.payment === "upi-direct" && String(order.paymentReference || "").toLowerCase() === reference.toLowerCase()
    );
    if (duplicateReference) {
      return res.status(409).json({ success: false, message: "That transaction reference has already been submitted." });
    }
    const quote = getOrderQuote(orderDraft);
    if (!Number.isFinite(Number(expectedTotal)) || Math.round(Number(expectedTotal) * 100) !== Math.round(quote.total * 100)) {
      return res.status(409).json({ success: false, message: "The checkout total changed. Generate a new payment QR and try again." });
    }
    for (const item of quote.items) {
      const product = db.findById("products", item.id);
      if (!product || product.stock < item.qty) {
        return res.status(409).json({ success: false, message: `Stock changed for "${item.name}". Refresh checkout before submitting payment.` });
      }
    }

    for (const item of quote.items) {
      const product = db.findById("products", item.id);
      db.update("products", product.id, { stock: product.stock - item.qty });
    }

    const now = new Date().toISOString();
    const order = await db.insertPersisted("orders", {
      id: `BLORA${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...quote,
      userId: req.user?.id || null,
      userEmail: req.user?.email || orderDraft.address.email || "guest@trioshop.in",
      status: "Confirmed",
      payment: "upi-direct",
      paymentStatus: "Pending",
      paymentVerifiedAt: null,
      paymentReference: reference,
      upiId: process.env.PAYMENT_UPI_ID,
      address: orderDraft.address,
      cancelled: false,
      date: now,
      timeline: [{ status: "Confirmed", time: now, note: "Direct UPI payment reference submitted; awaiting manual verification." }],
    });
    return res.status(201).json({
      success: true,
      message: "Order received. Payment will remain pending until an admin verifies the transaction.",
      order,
    });
  } catch (error) {
    console.error("Direct UPI order submission failed:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to submit direct UPI order." });
  }
});

export default router;
