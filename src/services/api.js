// API Service Layer for BLORA
// Paths verified against actual backend route definitions

function getApiBase() {
  const envUrl = (import.meta?.env?.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local") ||
      host.endsWith(".netlify.app")
    ) {
      return "/api";
    }
  }
  return "https://bloraa.onrender.com/api";
}

const API_BASE = getApiBase();
const PROD_API_FALLBACK = "https://bloraa.onrender.com/api";

function getToken() {
  try { return localStorage.getItem("trio_jwt_token") || null; } catch (e) { return null; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem("trio_jwt_token", token);
    else localStorage.removeItem("trio_jwt_token");
  } catch (e) { /* ignore */ }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...(options.headers || {}),
  };
  const config = { ...options, headers };
  const target = API_BASE + endpoint;

  let res;
  try {
    res = await fetch(target, config);
  } catch (networkErr) {
    if (API_BASE.startsWith("/") && typeof window !== "undefined") {
      try {
        res = await fetch(PROD_API_FALLBACK + endpoint, config);
      } catch {
        throw new Error("Unable to connect to the server. Please check your internet connection.");
      }
    } else {
      throw new Error("Unable to connect to the server. Please check your internet connection.");
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || "Request failed with status " + res.status;
    const err = new Error(errorMsg);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // ─── AUTH ────────────────────────────────────────────────────────────────
  // POST /api/auth/register  POST /api/auth/login  POST /api/auth/admin-login
  // GET  /api/auth/me        PUT  /api/auth/profile
  auth: {
    hasToken() { return Boolean(getToken()); },
    async register(payload) { const data = await request("/auth/register", { method: "POST", body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async checkLogin(email) { return await request("/auth/login/check", { method: "POST", body: JSON.stringify({ email }) }); },
    async login(payload) { const data = await request("/auth/login", { method: "POST", body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async requestPasswordReset(email) { return await request("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); },
    async firebaseSession(payload) { const data = await request("/auth/firebase-session", { method: "POST", body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async adminLogin(payload) { const data = await request("/auth/admin-login", { method: "POST", body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async me() { return await request("/auth/me"); },
    async updateProfile(updates) { return await request("/auth/profile", { method: "PUT", body: JSON.stringify(updates) }); },
    logout() { setToken(null); },
  },

  // ─── PRODUCTS ────────────────────────────────────────────────────────────
  // GET  /api/products         GET  /api/products/admin/all
  // GET  /api/products/:id     POST /api/products
  // PUT  /api/products/:id     DELETE /api/products/:id
  // PATCH /api/products/:id/stock
  products: {
    async getAll(params) { const qs = new URLSearchParams(params || {}).toString(); return await request("/products" + (qs ? "?" + qs : "")); },
    async getAllAdmin() { return await request("/products/admin/all"); },
    async getById(id) { return await request("/products/" + id); },
    async create(payload) { return await request("/products", { method: "POST", body: JSON.stringify(payload) }); },
    async update(id, payload) { return await request("/products/" + id, { method: "PUT", body: JSON.stringify(payload) }); },
    async remove(id) { return await request("/products/" + id, { method: "DELETE" }); },
    async updateStock(id, stock) { return await request("/products/" + id + "/stock", { method: "PATCH", body: JSON.stringify({ stock }) }); },
  },

  // ─── CATEGORIES ──────────────────────────────────────────────────────────
  // GET    /api/categories
  // POST   /api/categories
  // DELETE /api/categories/:id
  categories: {
    async getAll() { return await request("/categories"); },
    async create(payload) { return await request("/categories", { method: "POST", body: JSON.stringify(payload) }); },
    async remove(id) { return await request("/categories/" + id, { method: "DELETE" }); },
  },

  // ─── HOMEPAGE BANNERS ───────────────────────────────────────────────────
  banners: {
    async getAll() { return await request("/admin/banners"); },
  },

  announcement: {
    async get() { return await request("/admin/announcement"); },
  },

  // ─── ORDERS ──────────────────────────────────────────────────────────────
  // POST  /api/orders              GET  /api/orders/my-orders
  // GET   /api/orders/all          GET  /api/orders/:id
  // PATCH /api/orders/:id/cancel   PATCH /api/orders/:id/status
  orders: {
    async getMyOrders() { return await request("/orders/my-orders"); },
    async getAllAdmin() { return await request("/orders/all"); },
    async getById(id) { return await request("/orders/" + id); },
    async create(payload) { return await request("/orders", { method: "POST", body: JSON.stringify(payload) }); },
    async verifyPayment(id) { return await request("/orders/" + id + "/verify-payment", { method: "PATCH" }); },
    async updateStatus(id, status, note) { return await request("/orders/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status, note: note || "" }) }); },
    async cancel(id) { return await request("/orders/" + id + "/cancel", { method: "PATCH" }); },
  },

  // ─── CART ────────────────────────────────────────────────────────────────
  // GET  /api/cart
  // POST /api/cart/sync  (body: { cart })
  cart: {
    async get() { return await request("/cart"); },
    async sync(cart) { return await request("/cart/sync", { method: "POST", body: JSON.stringify({ cart }) }); },
  },

  // ─── WISHLIST ────────────────────────────────────────────────────────────
  // GET  /api/wishlist
  // POST /api/wishlist/sync  (body: { wishlist })
  wishlist: {
    async get() { return await request("/wishlist"); },
    async sync(wishlist) { return await request("/wishlist/sync", { method: "POST", body: JSON.stringify({ wishlist }) }); },
  },

  // ─── COUPONS ─────────────────────────────────────────────────────────────
  // POST   /api/coupons/validate  GET    /api/coupons
  // POST   /api/coupons           DELETE /api/coupons/:id
  coupons: {
    async getAll() { return await request("/coupons"); },
    async validate(code, subtotal) { return await request("/coupons/validate", { method: "POST", body: JSON.stringify({ code, subtotal }) }); },
    async create(payload) { return await request("/coupons", { method: "POST", body: JSON.stringify(payload) }); },
    async remove(id) { return await request("/coupons/" + id, { method: "DELETE" }); },
  },

  // ─── REVIEWS ─────────────────────────────────────────────────────────────
  // GET    /api/reviews/product/:productId  GET  /api/reviews/all
  // POST   /api/reviews                     DELETE /api/reviews/:id
  reviews: {
    async getByProduct(productId) { return await request("/reviews/product/" + productId); },
    async getAll() { return await request("/reviews/all"); },
    async create(payload) { return await request("/reviews", { method: "POST", body: JSON.stringify(payload) }); },
    async remove(id) { return await request("/reviews/" + id, { method: "DELETE" }); },
  },

  // ─── PAYMENTS ────────────────────────────────────────────────────────────
  // GET /api/payments/config
  payments: {
    async getConfig() { return await request("/payments/config"); },
    async getDirectQuote(payload) { return await request("/payments/direct-quote", { method: "POST", body: JSON.stringify(payload) }); },
    async createDirectOrder(payload) { return await request("/payments/direct-order", { method: "POST", body: JSON.stringify(payload) }); },
  },

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  // GET /api/admin/stats      GET /api/admin/customers
  // GET /api/admin/banners    PUT /api/admin/banners
  admin: {
    async getDashboard() { return await request("/admin/stats"); },
    async getBanners() {
      try {
        return await request("/admin/banners/manage");
      } catch (err) {
        if (err.status !== 404) throw err;
        return await request("/admin/banners");
      }
    },
    async getAnnouncement() { return await request("/admin/announcement/manage"); },
    async updateAnnouncement(announcement) {
      return await request("/admin/announcement", { method: "PUT", body: JSON.stringify({ announcement }) });
    },
    async updateBanners(banners) { return await request("/admin/banners", { method: "PUT", body: JSON.stringify({ banners }) }); },
    async getCustomers() { return await request("/admin/customers"); },
  },
};
