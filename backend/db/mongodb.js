import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
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
    console.log("⚠️  Falling back to local data store for continuity.");
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
