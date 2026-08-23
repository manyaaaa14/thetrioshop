import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "../db/db.js";

const router = express.Router();
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;

const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

function validateOrderDraft(orderDraft) {
  if (!orderDraft || !Array.isArray(orderDraft.items) || orderDraft.items.length === 0) {
    throw new Error("No items in order");
  }

  if (!orderDraft.address || !orderDraft.address.name || !orderDraft.address.phone || !orderDraft.address.address || !orderDraft.address.city || !orderDraft.address.pincode) {
    throw new Error("Incomplete delivery address");
  }

  if (!/^\d{10}$/.test(String(orderDraft.address.phone))) {
    throw new Error("Enter a valid 10-digit mobile number");
  }

  if (!/^\d{6}$/.test(String(orderDraft.address.pincode))) {
    throw new Error("Enter a valid 6-digit pincode");
  }
}

function createValidatedOrder(orderDraft) {
  validateOrderDraft(orderDraft);

  const validatedItems = [];
  let subtotal = 0;

  for (const item of orderDraft.items) {
    const product = db.findById("products", item.id);
    if (!product) {
      throw new Error(`Product ${item.id} not found.`);
    }

    if (product.stock < Number(item.qty || 0)) {
      throw new Error(`Only ${product.stock} left in stock for "${product.name}".`);
    }

    const itemTotal = product.price * Number(item.qty || 0);
    subtotal += itemTotal;

    validatedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      qty: Number(item.qty),
      color: item.color || (product.variants?.color?.[0] || null),
      image: product.images?.[0] || "",
      category: product.category,
    });
  }

  let discount = 0;
  let appliedCouponCode = null;
  const couponCode = orderDraft.couponCode;

  if (couponCode) {
    const coupon = db.findOne("coupons", (c) => c.code.toUpperCase() === String(couponCode).toUpperCase() && c.active);
    if (coupon) {
      if (subtotal >= (coupon.minOrder || 0)) {
        if (coupon.type === "flat") {
          discount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === "pct") {
          discount = Math.round((subtotal * coupon.value) / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        }
        appliedCouponCode = coupon.code;
      }
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const delivery = afterDiscount >= 499 ? 0 : 49;
  const total = afterDiscount + delivery;

  for (const item of validatedItems) {
    const product = db.findById("products", item.id);
    if (product) {
      db.update("products", product.id, { stock: Math.max(0, product.stock - item.qty) });
    }
  }

  const randomSuffix = Math.floor(100000 + Math.random() * 899999);
  const orderId = `TRIO${randomSuffix}`;

  return {
    id: orderId,
    items: validatedItems,
    subtotal,
    discount,
    appliedCoupon: appliedCouponCode,
    delivery,
    total,
    orderId,
  };
}

router.post("/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ success: false, message: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment." });
    }

    const { amount, currency = "INR", receipt } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount" });
    }

    const paymentOrder = await razorpay.orders.create({
      amount: Number(amount),
      currency,
      receipt: String(receipt || `trio_${Date.now()}`),
    });

    return res.json({ success: true, order: paymentOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to create Razorpay order" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDraft } = req.body || {};

    if (!razorpay || !keySecret) {
      return res.status(500).json({ success: false, message: "Razorpay is not configured." });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Incomplete Razorpay payment payload" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature. Payment rejected." });
    }

    const validated = createValidatedOrder(orderDraft);
    const newOrder = db.insert("orders", {
      id: validated.id,
      userId: req.user ? req.user.id : null,
      userEmail: req.user ? req.user.email : orderDraft.address.email || "guest@trioshop.in",
      items: validated.items,
      subtotal: validated.subtotal,
      discount: validated.discount,
      appliedCoupon: validated.appliedCoupon,
      delivery: validated.delivery,
      total: validated.total,
      status: "Confirmed",
      payment: "razorpay",
      paymentStatus: "Paid",
      paymentVerifiedAt: new Date().toISOString(),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      address: orderDraft.address,
      cancelled: false,
      date: new Date().toISOString(),
      timeline: [
        { status: "Confirmed", time: new Date().toISOString(), note: "Order placed successfully after Razorpay payment verification." },
      ],
    });

    return res.status(201).json({ success: true, message: "Order placed successfully!", order: newOrder });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Payment verification failed" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    if (!webhookSecret) {
      return res.status(500).send("Webhook secret not configured");
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body?.toString ? req.body.toString() : "";

    if (!signature) {
      return res.status(400).send("Missing Razorpay signature");
    }

    const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
    if (expected !== signature) {
      return res.status(400).send("Invalid Razorpay webhook signature");
    }

    const event = JSON.parse(body || "{}");
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;

    if (paymentEntity && orderEntity) {
      const order = db.findOne("orders", (o) => o.razorpayOrderId === orderEntity.id);
      if (order) {
        const status = paymentEntity.status === "captured" ? "Paid" : paymentEntity.status === "failed" ? "Failed" : paymentEntity.status === "pending" ? "Pending" : "Paid";
        db.update("orders", order.id, {
          paymentStatus: status,
          razorpayPaymentId: paymentEntity.id,
          razorpayOrderId: orderEntity.id,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return res.json({ success: true, received: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || "Webhook verification failed" });
  }
});

export default router;
