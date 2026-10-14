import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { db } from "./db/db.js";
import { connectMongoDB } from "./db/mongodb.js";
import { seedDatabase } from "./db/seed.js";

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

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connections & seeding
async function initializeServer() {
  await connectMongoDB().catch((err) => console.error("MongoDB connect error:", err.message));
  await seedDatabase().catch((err) => console.error("Seed check error:", err.message));
}

initializeServer();

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json({ limit: "4mb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check (supports both /api/health and /health)
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "ok",
    message: "BLORA API Server is running smoothly 🚀",
    database: process.env.MONGODB_URI ? "MongoDB Atlas" : "Local JSON Store",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount Routes (accessible via /api/* and /*)
const routeList = [
  ["/auth", authRoutes],
  ["/products", productRoutes],
  ["/categories", categoryRoutes],
  ["/orders", orderRoutes],
  ["/coupons", couponRoutes],
  ["/reviews", reviewRoutes],
  ["/cart", cartRoutes],
  ["/wishlist", wishlistRoutes],
  ["/payments", paymentRoutes],
  ["/admin", adminRoutes],
];

for (const [routePath, router] of routeList) {
  app.use(`/api${routePath}`, router);
  app.use(routePath, router);
}

// Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🛍️  BLORA Backend API`);
  console.log(`🌐  Server running on http://localhost:${PORT}`);
  console.log(`📡  Health check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use by another running process.`);
    console.log(`💡 Either stop the other process on port ${PORT} or set a different PORT in .env (e.g. PORT=5001).`);
  } else {
    console.error("Server error:", err);
  }
});
