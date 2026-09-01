import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number },
    qty: { type: Number, required: true, default: 1 },
    color: { type: String, default: null },
    image: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    time: { type: String, default: () => new Date().toISOString() },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    userEmail: { type: String, required: true, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    appliedCoupon: { type: String, default: null },
    delivery: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Confirmed",
      index: true,
    },
    payment: { type: String, default: "upi" },
    paymentStatus: { type: String, enum: ["Paid", "Pending", "Failed", "Refunded"], default: "Paid" },
    paymentVerifiedAt: { type: String, default: () => new Date().toISOString() },
    paymentReference: { type: String, default: "" },
    upiId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    address: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    cancelled: { type: Boolean, default: false },
    date: { type: String, default: () => new Date().toISOString() },
    timeline: [timelineSchema],
  },
  {
    timestamps: true,
  }
);

export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
