import express from "express";
import { db } from "../db/db.js";
import { protectUser } from "../middleware/auth.js";

const router = express.Router();

// GET /api/cart - Get user's server-synced cart
router.get("/", protectUser, (req, res) => {
  try {
    const cart = db.getUserCart(req.user.id);
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/sync - Sync cart state
router.post("/sync", protectUser, (req, res) => {
  try {
    const { cart } = req.body;
    db.saveUserCart(req.user.id, cart || {});
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
