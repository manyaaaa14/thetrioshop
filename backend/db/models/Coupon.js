import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discount: { type: String },
    type: { type: String, enum: ["pct", "flat"], default: "flat" },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    expiry: { type: String, default: "2030-12-31" },
    active: { type: Boolean, default: true },
    description: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
