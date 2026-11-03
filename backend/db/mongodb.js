import "dotenv/config";
import mongoose from "mongoose";

let isConnected = false;

function requiresMongoDB() {
  return process.env.NODE_ENV === "production" ||
    process.env.RENDER === "true" ||
    Boolean(process.env.RENDER_SERVICE_ID);
}

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    if (requiresMongoDB()) {
      throw new Error("MONGODB_URI must be configured in production. Local JSON storage is not durable across deployments.");
    }
    console.log("ℹ️  MONGODB_URI not configured in .env. Running on local JSON persistence mode.");
    console.log("👉 To connect MongoDB Atlas, paste your connection URI in backend/.env as MONGODB_URI=mongodb+srv://...");
    return false;
  }

  try {
    if (isConnected) {
      return true;
    }

    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    const dbName = mongoose.connection.name || "trioshop";
    console.log(`===========================================`);
    console.log(`🍃  MongoDB Atlas Connected Successfully!`);
    console.log(`📦  Database: ${dbName}`);
    console.log(`===========================================`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting reconnection...");
      isConnected = false;
    });

    return true;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    throw new Error("Unable to connect to MongoDB. The server will not start with a non-persistent fallback.", { cause: err });
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
