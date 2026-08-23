import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

class JSONDatabase {
  constructor() {
    this.data = { ...defaultState };
    this.isLoaded = false;
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.data = { ...defaultState };
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error("Failed to initialize database:", err);
      this.data = { ...defaultState };
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write: write to temp file then rename
      const tempPath = STORE_PATH + ".tmp";
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, STORE_PATH);
    } catch (err) {
      console.error("Error saving database to disk:", err);
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
    const col = this.getCollection(collection);
    const newItem = {
      ...item,
      id: item.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    col.unshift(newItem);
    this.persist();
    return newItem;
  }

  update(collection, id, updates) {
    const col = this.getCollection(collection);
    const index = col.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;

    const existing = col[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // preserve ID
      updatedAt: new Date().toISOString(),
    };
    col[index] = updated;
    this.persist();
    return updated;
  }

  remove(collection, id) {
    const col = this.getCollection(collection);
    const index = col.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return false;

    col.splice(index, 1);
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

export const db = new JSONDatabase();
db.init();
