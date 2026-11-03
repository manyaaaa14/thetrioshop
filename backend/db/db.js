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
const STORE_PATH = process.env.TRIO_STORE_PATH
  ? path.resolve(process.env.TRIO_STORE_PATH)
  : path.join(__dirname, "..", "data", "store.json");
const DATA_DIR = path.dirname(STORE_PATH);

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

    // 2. Connect to MongoDB if URI is present. A configured database failure
    // must stop startup rather than silently switching to ephemeral storage.
    const connected = await connectMongoDB();
    if (connected) {
      this.isMongoActive = true;
      await this.syncToMongoDB();
    }
  }

  assertMongoAvailable() {
    if (this.isMongoActive && !isMongoConnected()) {
      throw new Error("MongoDB is unavailable. The change was not saved; please retry when the database reconnects.");
    }
  }

  normalizeRecord(collection, record) {
    const { _id, __v, ...normalized } = record;
    if (collection === "categories") {
      return { ...normalized, emoji: normalized.emoji || normalized.icon || "✨" };
    }
    if (collection === "products") {
      return {
        ...normalized,
        desc: normalized.desc || normalized.description || "",
        badges: Array.isArray(normalized.badges) ? normalized.badges : normalized.badge ? [normalized.badge] : [],
        ratingCount: normalized.ratingCount ?? normalized.reviewsCount ?? 0,
      };
    }
    return normalized;
  }

  async findPersisted(collection, filterFn = null) {
    const model = modelMap[collection];
    if (this.isMongoActive && model) {
      this.assertMongoAvailable();
      const records = await model.find().lean();
      this.data[collection] = records.map((record) => this.normalizeRecord(collection, record));
    }
    const records = this.find(collection);
    return filterFn ? records.filter(filterFn) : records;
  }

  async findOnePersisted(collection, filterFn) {
    return (await this.findPersisted(collection, filterFn))[0] || null;
  }

  async findByIdPersisted(collection, id) {
    const model = modelMap[collection];
    if (!this.isMongoActive || !model) return this.findById(collection, id);

    this.assertMongoAvailable();
    const record = await model.findOne({ id: String(id) }).lean();
    const records = this.getCollection(collection);
    const index = records.findIndex((item) => String(item.id) === String(id));
    if (!record) {
      if (index !== -1) records.splice(index, 1);
      return null;
    }

    const normalized = this.normalizeRecord(collection, record);
    if (index === -1) records.unshift(normalized);
    else records[index] = normalized;
    return normalized;
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
        this.data[collection] = records.map((record) => this.normalizeRecord(collection, record));
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
      const serialized = JSON.stringify(this.data, null, 2);
      const tempPath = STORE_PATH + ".tmp";
      try {
        fs.writeFileSync(tempPath, serialized, "utf-8");
        fs.renameSync(tempPath, STORE_PATH);
      } catch (renameErr) {
        fs.writeFileSync(STORE_PATH, serialized, "utf-8");
        try { fs.unlinkSync(tempPath); } catch {}
      }
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
    const model = modelMap[collection];
    if (this.isMongoActive && model) {
      this.assertMongoAvailable();
      const saved = await model.create(newItem);
      const persistedItem = this.normalizeRecord(collection, saved.toObject());
      const records = this.getCollection(collection);
      const existingIndex = records.findIndex((record) => String(record.id) === String(persistedItem.id));
      if (existingIndex === -1) records.unshift(persistedItem);
      else records[existingIndex] = persistedItem;
      this.persist();
      return persistedItem;
    }
    const records = this.getCollection(collection);
    records.unshift(newItem);
    if (!this.persist()) {
      records.shift();
      throw new Error("Unable to save the record to persistent storage.");
    }
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

  async updatePersisted(collection, id, updates) {
    const col = this.getCollection(collection);
    const model = modelMap[collection];
    if (this.isMongoActive && model) {
      this.assertMongoAvailable();
      const saved = await model.findOneAndUpdate(
        { id: String(id) },
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();
      if (!saved) return null;
      const updated = this.normalizeRecord(collection, saved);
      const index = col.findIndex((item) => String(item.id) === String(id));
      if (index === -1) col.unshift(updated);
      else col[index] = updated;
      this.persist();
      return updated;
    }

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
    if (!this.persist()) {
      col[index] = existing;
      throw new Error("Unable to save the record to persistent storage.");
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
    const model = modelMap[collection];
    if (this.isMongoActive && model) {
      this.assertMongoAvailable();
      const removed = await model.findOneAndDelete({ id: String(id) });
      if (!removed) return false;
      if (index !== -1) col.splice(index, 1);
      this.persist();
      return true;
    }

    if (index === -1) return false;
    const [removed] = col.splice(index, 1);
    if (!this.persist()) {
      col.splice(index, 0, removed);
      throw new Error("Unable to save the record deletion to persistent storage.");
    }
    return true;
  }

  async clearPersisted(collection) {
    const col = this.getCollection(collection);
    const model = modelMap[collection];
    if (this.isMongoActive && model) {
      this.assertMongoAvailable();
      await model.deleteMany({});
      col.length = 0;
      this.persist();
      return;
    }

    const previous = [...col];
    col.length = 0;
    if (!this.persist()) {
      this.data[collection] = previous;
      throw new Error("Unable to save the collection deletion to persistent storage.");
    }
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
db.ready = db.init();
