import express from "express";
import { db } from "../db/db.js";
import { protectUser, protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// Orders may only be created through the verified payment callback.
router.post("/", (req, res) => {
  res.status(405).json({ success: false, message: "Complete payment through checkout before creating an order." });
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

router.patch("/:id/verify-payment", protectAdmin, (req, res) => {
  try {
    const order = db.findById("orders", req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.payment !== "upi-direct" || order.paymentStatus !== "Pending" || !order.paymentReference) {
      return res.status(409).json({ success: false, message: "Only pending direct UPI orders with a submitted reference can be verified." });
    }

    const now = new Date().toISOString();
    const timeline = [...(order.timeline || []), {
      status: "Payment Verified",
      time: now,
      note: `Direct UPI payment reference ${order.paymentReference} manually verified by an administrator.`,
    }];
    const updated = db.update("orders", order.id, {
      paymentStatus: "Paid",
      paymentVerifiedAt: now,
      timeline,
    });
    if (!updated) {
      return res.status(500).json({ success: false, message: "Unable to update payment verification status." });
    }
    return res.json({ success: true, message: "Payment marked as verified.", order: updated });
  } catch (err) {
    console.error("Manual UPI payment verification failed:", err);
    return res.status(500).json({ success: false, message: "Unable to verify payment." });
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
