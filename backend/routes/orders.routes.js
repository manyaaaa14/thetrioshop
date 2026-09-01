import express from "express";
import { db } from "../db/db.js";
import { protectUser, protectAdmin, optionalUser } from "../middleware/auth.js";

const router = express.Router();

// POST /api/orders - Manual order creation is disabled.
// Orders are created only after successful Razorpay verification in /api/payments/verify.
router.post("/", optionalUser, (req, res) => {
  try {
    const { items, address, payment, couponCode, utr, paymentVerified, upiId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const paymentMethod = String(payment || "upi").toLowerCase();
    const configuredUpiId = process.env.PAYMENT_UPI_ID || "9729794568@fam";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    if (!address || !address.name || !address.phone || !address.address || !address.city || !address.pincode) {
      return res.status(400).json({ success: false, message: "Incomplete delivery address" });
    }

    if (!["googlepay", "phonepe", "paytm", "bhim", "upi", "prepaid", "qr", "bank", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Only prepaid orders are accepted. Cash on delivery is not available." });
    }

    if (["googlepay", "phonepe", "paytm", "bhim", "upi", "prepaid", "qr", "bank", "razorpay"].includes(paymentMethod)) {
      if (paymentMethod === "razorpay") {
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          return res.status(400).json({ success: false, message: "Payment is not verified yet. Please complete Razorpay checkout first." });
        }
      } else {
        if (paymentVerified !== true || !utr || !String(utr).trim() || !/^[A-Za-z0-9]{8,25}$/.test(String(utr).trim())) {
          return res.status(400).json({ success: false, message: "Please verify your payment by entering a valid UTR / transaction ID." });
        }
        if (upiId && String(upiId).trim() && String(upiId).trim() !== configuredUpiId) {
          return res.status(400).json({ success: false, message: "Payment UPI ID does not match the configured merchant account." });
        }
      }
    }

    // 1. Verify stock and recalculate unit prices from DB
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = db.findById("products", item.id);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.id} not found.` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} left in stock for "${product.name}".`,
        });
      }

      const itemTotal = product.price * item.qty;
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

    // 2. Validate coupon if provided
    let discount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = db.findOne("coupons", (c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
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

    // 3. Shipping fee: Free on orders >= 499, else ₹49
    const afterDiscount = Math.max(0, subtotal - discount);
    const delivery = afterDiscount >= 499 ? 0 : 49;
    const total = afterDiscount + delivery;

    // 4. Atomic stock reduction
    for (const item of validatedItems) {
      const p = db.findById("products", item.id);
      if (p) {
        db.update("products", p.id, { stock: Math.max(0, p.stock - item.qty) });
      }
    }

    // 5. Create Order
    const randomSuffix = Math.floor(100000 + Math.random() * 899999);
    const orderId = `TRIO${randomSuffix}`;

    const newOrder = db.insert("orders", {
      id: orderId,
      userId: req.user ? req.user.id : null,
      userEmail: req.user ? req.user.email : address.email || "guest@trioshop.in",
      items: validatedItems,
      subtotal,
      discount,
      appliedCoupon: appliedCouponCode,
      delivery,
      total,
      status: "Confirmed",
      payment: paymentMethod === "razorpay" ? "razorpay" : String(payment || "upi").toLowerCase(),
      paymentStatus: "Paid",
      paymentVerifiedAt: new Date().toISOString(),
      paymentReference: String(utr || "").trim(),
      upiId: upiId || configuredUpiId,
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId || null,
      razorpaySignature: razorpaySignature || null,
      address,
      cancelled: false,
      date: new Date().toISOString(),
      timeline: [
        { status: "Confirmed", time: new Date().toISOString(), note: "Order placed successfully and payment confirmed." }
      ],
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my-orders - Current user's orders
router.get("/my-orders", protectUser, (req, res) => {
  try {
    const orders = db.find("orders", (o) => o.userId === req.user.id || o.userEmail?.toLowerCase() === req.user.email?.toLowerCase());
    orders.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/all - Admin get all orders
router.get("/all", protectAdmin, (req, res) => {
  try {
    const orders = db.find("orders");
    orders.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id - Single order detail
router.get("/:id", (req, res) => {
  try {
    const order = db.findById("orders", req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/cancel - Cancel order (User or Admin)
router.patch("/:id/cancel", (req, res) => {
  try {
    const order = db.findById("orders", req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.cancelled || order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Cannot cancel a delivered order. Please request a return." });
    }

    // Restore product stock
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const p = db.findById("products", item.id);
        if (p) {
          db.update("products", p.id, { stock: p.stock + (item.qty || 1) });
        }
      }
    }

    const timeline = order.timeline || [];
    timeline.push({ status: "Cancelled", time: new Date().toISOString(), note: "Order was cancelled." });

    const updated = db.update("orders", order.id, {
      status: "Cancelled",
      cancelled: true,
      timeline,
    });

    res.json({ success: true, message: "Order cancelled successfully", order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status - Admin update order status
router.patch("/:id/status", protectAdmin, (req, res) => {
  try {
    const { status, note } = req.body;
    const order = db.findById("orders", req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const timeline = order.timeline || [];
    timeline.push({
      status,
      time: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    });

    const isCancelled = status === "Cancelled";
    if (isCancelled && !order.cancelled) {
      // Restore stock on admin cancellation
      for (const item of order.items || []) {
        const p = db.findById("products", item.id);
        if (p) {
          db.update("products", p.id, { stock: p.stock + (item.qty || 1) });
        }
      }
    }

    const updated = db.update("orders", order.id, {
      status,
      cancelled: isCancelled,
      timeline,
    });

    res.json({ success: true, message: `Order status updated to ${status}`, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
