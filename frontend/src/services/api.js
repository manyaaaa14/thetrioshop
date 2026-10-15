// API Service Layer for BLORA
// Robust backend base URL and Authorization header handling

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
  return "https://thetrioshopp.onrender.com/api";
}

const API_BASE = getApiBase();
const PROD_API_FALLBACK = "https://thetrioshopp.onrender.com/api";

function getToken() {
  try { return localStorage.getItem('trio_jwt_token') || null; } catch (e) { return null; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('trio_jwt_token', token);
    else localStorage.removeItem('trio_jwt_token');
  } catch (e) { /* ignore */ }
}

async function request(
  endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = { ...options, headers };
  const target = `${API_BASE}${endpoint}`;

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
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    async register(payload) { const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async login(payload) { const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async adminLogin(payload) { const data = await request('/auth/admin-login', { method: 'POST', body: JSON.stringify(payload) }); if (data.token) setToken(data.token); return data; },
    async me() { return await request('/auth/me'); },
    async updateProfile(updates) { return await request('/auth/profile', { method: 'PUT', body: JSON.stringify(updates) }); },
    logout() { setToken(null); },
  },
  // ─── PAYMENTS ────────────────────────────────────────────────────────────
  // GET /api/payments/config  POST /api/payments/create-order  POST /api/payments/verify
  payments: {
    async getConfig() { return await request("/payments/config"); },
    async createOrder(payload) { return await request("/payments/create-order", { method: "POST", body: JSON.stringify(payload) }); },
    async verify(payload) { return await request("/payments/verify", { method: "POST", body: JSON.stringify(payload) }); },
  },
};
