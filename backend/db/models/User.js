import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    firebaseUid: { type: String, unique: true, sparse: true },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    address: { type: addressSchema, default: null },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
