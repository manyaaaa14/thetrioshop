// API Service Layer for THE TRIO SHOP
// Manages HTTP requests to the backend with automated JWT token handling

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("trio_jwt_token") || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("trio_jwt_token", token);
  } else {
    localStorage.removeItem("trio_jwt_token");
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const target = `${API_BASE}${endpoint}`;
    const res = await fetch(target, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) {
      console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, err.message);
    }
    throw err;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    async register({ name, email, password, phone }) {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      });
      if (data.token) setToken(data.token);
      return data;
    },

    async login({ email, password }) {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setToken(data.token);
      return data;
    },

    async adminLogin({ email, password }) {
      const data = await request("/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) setToken(data.token);
      return data;
    },

    async me() {
      return await request("/auth/me");
    },

    async updateProfile(updates) {
      return await request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },

    logout() {
      setToken(null);
    },
  },

  // Products endpoints
  products: {
    async getAll(params = {}) {
      const query = new URLSearchParams();
      if (params.category && params.category !== "all") query.append("category", params.category);
      if (params.search) query.append("search", params.search);
      if (params.minPrice) query.append("minPrice", params.minPrice);
      if (params.maxPrice) query.append("maxPrice", params.maxPrice);
      if (params.sort) query.append("sort", params.sort);
      if (params.onlyAvailable) query.append("onlyAvailable", "true");
      if (params.badge) query.append("badge", params.badge);

      const qs = query.toString() ? `?${query.toString()}` : "";
      return await request(`/products${qs}`);
    },

    async getById(id) {
      return await request(`/products/${id}`);
    },

    async create(productData) {
      return await request("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
    },

    async update(id, updates) {
      return await request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },

    async delete(id) {
      return await request(`/products/${id}`, {
        method: "DELETE",
      });
    },

    async updateStock(id, stock) {
      return await request(`/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ stock }),
      });
    },
  },

  // Categories endpoints
  categories: {
    async getAll() {
      return await request("/categories");
    },

    async create(data) {
      return await request("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async delete(id) {
      return await request(`/categories/${id}`, {
        method: "DELETE",
      });
    },
  },

  // Orders endpoints
  orders: {
    async create(orderDraft) {
      return await request("/orders", {
        method: "POST",
        body: JSON.stringify(orderDraft),
      });
    },

    async getMyOrders() {
      return await request("/orders/my-orders");
    },

    async getAllAdmin() {
      return await request("/orders/all");
    },

    async getById(id) {
      return await request(`/orders/${id}`);
    },

    async cancel(id) {
      return await request(`/orders/${id}/cancel`, {
        method: "PATCH",
      });
    },

    async updateStatus(id, status, note) {
      return await request(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, note }),
      });
    },
  },

  // Coupons endpoints
  coupons: {
    async validate(code, subtotal) {
      return await request("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal }),
      });
    },

    async getAll() {
      return await request("/coupons");
    },

    async create(couponData) {
      return await request("/coupons", {
        method: "POST",
        body: JSON.stringify(couponData),
      });
    },

    async delete(id) {
      return await request(`/coupons/${id}`, {
        method: "DELETE",
      });
    },
  },

  // Reviews endpoints
  reviews: {
    async getByProduct(productId) {
      return await request(`/reviews/product/${productId}`);
    },

    async submit(reviewData) {
      return await request("/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },

    async getAllAdmin() {
      return await request("/reviews/all");
    },

    async delete(id) {
      return await request(`/reviews/${id}`, {
        method: "DELETE",
      });
    },
  },

  // Razorpay checkout endpoints
  payments: {
    async createOrder(payload) {
      return await request("/payments/create-order", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async verify(payload) {
      return await request("/payments/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  },

  // Cart & Wishlist sync endpoints
  cart: {
    async get() {
      return await request("/cart");
    },
    async sync(cart) {
      return await request("/cart/sync", {
        method: "POST",
        body: JSON.stringify({ cart }),
      });
    },
  },

  wishlist: {
    async get() {
      return await request("/wishlist");
    },
    async sync(wishlist) {
      return await request("/wishlist/sync", {
        method: "POST",
        body: JSON.stringify({ wishlist }),
      });
    },
  },

  // Admin Analytics & Banner endpoints
  admin: {
    async getStats() {
      return await request("/admin/stats");
    },

    async getCustomers() {
      return await request("/admin/customers");
    },

    async getBanners() {
      return await request("/admin/banners");
    },

    async updateBanners(banners) {
      return await request("/admin/banners", {
        method: "PUT",
        body: JSON.stringify({ banners }),
      });
    },
  },
};

