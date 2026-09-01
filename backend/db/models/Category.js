import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String },
    icon: { type: String, default: "🛍️" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    itemCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const CategoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);
