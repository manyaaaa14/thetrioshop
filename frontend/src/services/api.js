// API Service Layer for THE TRIO SHOP
// Robust backend base URL and Authorization header handling

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://thetrioshopp.onrender.com/api";

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

  const res = await fetch(target, config);
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
};
