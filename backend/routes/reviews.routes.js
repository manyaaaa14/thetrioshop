import express from "express";
import { db } from "../db/db.js";
import { protectAdmin, optionalUser } from "../middleware/auth.js";

const router = express.Router();

// GET /api/reviews/product/:productId - Get reviews for product
router.get("/product/:productId", (req, res) => {
  try {
    const reviews = db.find(
      "reviews",
      (r) => r.productId === req.params.productId && (r.status === "approved" || !r.status)
    );
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews - Add customer review
router.post("/", optionalUser, (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "Product, rating, and comment are required." });
    }

    const name = userName || (req.user ? req.user.name : "Verified Customer");

    const newReview = db.insert("reviews", {
      productId,
      userName: name,
      rating: Number(rating),
      comment: comment.trim(),
      date: "Just now",
      verified: true,
      status: "approved",
      userId: req.user ? req.user.id : null,
    });

    // Update product average rating
    const productReviews = db.find("reviews", (r) => r.productId === productId);
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

    db.update("products", productId, {
      rating: Number(avgRating.toFixed(1)),
      ratingCount: productReviews.length,
    });

    res.status(201).json({
      success: true,
      message: "Thank you for your review!",
      review: newReview,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/all - Admin all reviews
router.get("/all", protectAdmin, (req, res) => {
  try {
    const reviews = db.find("reviews");
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:id - Admin delete review
router.delete("/:id", protectAdmin, (req, res) => {
  try {
    const deleted = db.remove("reviews", req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
