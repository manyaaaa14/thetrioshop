import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    desc: { type: String, default: "" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    stock: { type: Number, default: 10 },
    rating: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    badges: [{ type: String }],
    badge: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    variants: {
      color: [{ type: String }],
      size: [{ type: String }],
    },
    hidden: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
