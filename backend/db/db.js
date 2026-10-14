import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectMongoDB, isMongoConnected } from "./mongodb.js";
import { UserModel } from "./models/User.js";
import { ProductModel } from "./models/Product.js";
import { OrderModel } from "./models/Order.js";
import { CategoryModel } from "./models/Category.js";
import { CouponModel } from "./models/Coupon.js";
import { ReviewModel } from "./models/Review.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

// In-memory data store structure
const defaultState = {
  users: [],
  products: [],
  categories: [],
  orders: [],
  coupons: [],
  reviews: [],
  banners: [],
  carts: {},      // userId -> { [productId]: { qty, color } }
  wishlists: {},  // userId -> { [productId]: true }
};

const modelMap = {
  users: UserModel,
  products: ProductModel,
  orders: OrderModel,
  categories: CategoryModel,
  coupons: CouponModel,
  reviews: ReviewModel,
};

class UnifiedDatabase {
  constructor() {
    this.data = { ...defaultState };
    this.isLoaded = false;
    this.isMongoActive = false;
  }

  async init() {
    // 1. Initialize local JSON store
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8").replace(/^\uFEFF/, "");
        this.data = JSON.parse(raw);
      } else {
        this.data = { ...defaultState };
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error("Failed to initialize local database:", err);
      this.data = { ...defaultState };
    }

    // 2. Connect to MongoDB if URI is present
    try {
      const connected = await connectMongoDB();
      if (connected) {
        this.isMongoActive = true;
        await this.syncToMongoDB();
      }
    } catch (err) {
      console.error("MongoDB init check error:", err.message);
    }
  }

  async syncToMongoDB() {
    if (!isMongoConnected()) return;
    try {
      const models = Object.entries(modelMap);
      const counts = await Promise.all(models.map(([, model]) => model.countDocuments()));
      if (counts.every((count) => count === 0)) {
        console.log("🌱 Initializing MongoDB Atlas from the local store...");
        for (const [collection, model] of models) {
          const records = this.data[collection] || [];
          if (records.length > 0) {
            await model.insertMany(records);
          }
        }
      }

      for (const [collection, model] of models) {
        const records = await model.find().lean();
        this.data[collection] = records.map(({ _id, __v, ...record }) => {
          if (collection === "categories") {
            return { ...record, emoji: record.emoji || record.icon || "✨" };
          }
          if (collection === "products") {
            return {
              ...record,
              desc: record.desc || record.description || "",
              badges: Array.isArray(record.badges) ? record.badges : record.badge ? [record.badge] : [],
              ratingCount: record.ratingCount ?? record.reviewsCount ?? 0,
            };
          }
          return record;
        });
      }
      this.persist();
      console.log("✅ MongoDB data loaded into the application store.");
    } catch (err) {
      console.error("MongoDB data initialization failed:", err.message);
      throw err;
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = STORE_PATH + ".tmp";
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, STORE_PATH);
      return true;
    } catch (err) {
      console.error("Error saving database to disk:", err);
      return false;
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collection, filterFn = null) {
    const col = this.getCollection(collection);
    if (!filterFn) return [...col];
    return col.filter(filterFn);
  }

  findOne(collection, filterFn) {
    const col = this.getCollection(collection);
    return col.find(filterFn) || null;
  }

  findById(collection, id) {
    const col = this.getCollection(collection);
    return col.find((item) => String(item.id) === String(id)) || null;
  }

  insert(collection, item) {
    const newItem = this.createRecord(item);
    this.addRecord(collection, newItem);

    // Async write to MongoDB
    if (isMongoConnected() && modelMap[collection]) {
      modelMap[collection].create(newItem).catch((err) => {
        console.error(`MongoDB insert error in ${collection}:`, err.message);
      });
    }

    return newItem;
  }

  async insertPersisted(collection, item) {
    const newItem = this.createRecord(item);
    if (isMongoConnected() && modelMap[collection]) {
      await modelMap[collection].create(newItem);
    }
    this.addRecord(collection, newItem);
    return newItem;
  }

  createRecord(item) {
    return {
      ...item,
      id: item.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  addRecord(collection, newItem) {
    const col = this.getCollection(collection);
    col.unshift(newItem);
    this.persist();
  }

  update(collection, id, updates) {
    const col = this.getCollection(collection);
    const index = col.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;

    const existing = col[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    col[index] = updated;
    this.persist();

    // Async update to MongoDB
    if (isMongoConnected() && modelMap[collection]) {
      modelMap[collection].findOneAndUpdate({ id: String(id) }, { $set: updates }, { new: true }).catch((err) => {
        console.error(`MongoDB update error in ${collection}:`, err.message);
      });
    }

    return updated;
  }

  remove(collection, id) {
    const col = this.getCollection(collection);
    const index = col.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return false;

    col.splice(index, 1);
    this.persist();

    // Async delete from MongoDB
    if (isMongoConnected() && modelMap[collection]) {
      modelMap[collection].findOneAndDelete({ id: String(id) }).catch((err) => {
        console.error(`MongoDB remove error in ${collection}:`, err.message);
      });
    }

    return true;
  }

  async removePersisted(collection, id) {
    const col = this.getCollection(collection);
    const index = col.findIndex((item) => String(item.id) === String(id));

    let removedFromMongo = false;
    if (isMongoConnected() && modelMap[collection]) {
      const removed = await modelMap[collection].findOneAndDelete({ id: String(id) });
      removedFromMongo = Boolean(removed);
    }

    if (index === -1 && !removedFromMongo) return false;
    if (index !== -1) col.splice(index, 1);
    this.persist();
    return true;
  }

  // Cart helper
  getUserCart(userId) {
    if (!this.data.carts) this.data.carts = {};
    return this.data.carts[userId] || {};
  }

  saveUserCart(userId, cart) {
    if (!this.data.carts) this.data.carts = {};
    this.data.carts[userId] = cart;
    this.persist();
    return cart;
  }

  // Wishlist helper
  getUserWishlist(userId) {
    if (!this.data.wishlists) this.data.wishlists = {};
    return this.data.wishlists[userId] || {};
  }

  saveUserWishlist(userId, wishlist) {
    if (!this.data.wishlists) this.data.wishlists = {};
    this.data.wishlists[userId] = wishlist;
    this.persist();
    return wishlist;
  }
}

export const db = new UnifiedDatabase();
db.ready = db.init().catch((err) => {
  console.error("Database initialization error:", err);
});
