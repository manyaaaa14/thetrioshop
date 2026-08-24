
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Wrapper entry that forwards execution to backend/server.js regardless of CWD.
// This prevents ERR_MODULE_NOT_FOUND when the host runs `node server.js` from
// a different working directory (e.g., Render using /opt/render/project/src).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the backend entry relative to this file's directory.
const backendEntry = path.join(__dirname, "backend", "server.js");
const backendUrl = pathToFileURL(backendEntry).href;

console.log(`Wrapper: delegating to backend at ${backendEntry}`);

import(backendUrl)
  .then(() => console.log("Backend started via wrapper"))
  .catch((err) => {
    console.error("Failed to start backend via wrapper:", err);
    process.exit(1);
  });
=======
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
import { seedDatabase } from "./seed.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import couponRoutes from "./routes/coupons.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Auto-seed database if empty on startup
seedDatabase().catch((err) => console.error("Seed check error:", err));

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "THE TRIO SHOP API Server is running smoothly 🚀",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🛍️  THE TRIO SHOP Backend API`);
  console.log(`🌐  Server running on http://localhost:${PORT}`);
  console.log(`📡  Health check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
});


