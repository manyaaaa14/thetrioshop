import express from "express";
import { db } from "../db/db.js";
import { protectUser } from "../middleware/auth.js";

const router = express.Router();

// GET /api/wishlist - Get user's server-synced wishlist
router.get("/", protectUser, (req, res) => {
  try {
    const wishlist = db.getUserWishlist(req.user.id);
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wishlist/sync - Sync wishlist state
router.post("/sync", protectUser, (req, res) => {
  try {
    const { wishlist } = req.body;
    db.saveUserWishlist(req.user.id, wishlist || {});
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
