import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    userName: { type: String, required: true },
    userEmail: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    title: { type: String, default: "" },
    verified: { type: Boolean, default: true },
    date: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
  }
);

export const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);
