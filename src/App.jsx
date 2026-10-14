import React, { useState, useEffect } from "react";
import { PRODUCTS, CATEGORIES, BANNERS, DEFAULT_ANNOUNCEMENT } from "./data/products";
import { loadState, saveState } from "./lib/storage";
import { uid } from "./lib/format";
import { GLOBAL_CSS } from "./styles/globalStyles";
import { api } from "./services/api";
import { signOutFirebase } from "./lib/firebase";

import Header from "./components/layout/Header";
import MobileMenu from "./components/layout/MobileMenu";
import Footer from "./components/layout/Footer";
import WhatsAppFloat from "./components/layout/WhatsAppFloat";
import Toast from "./components/layout/Toast";
import AuthModal from "./components/AuthModal";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

import AdminApp from "./admin/AdminApp";

/* -----------------------------------------------------------------------
   ROOT APP (Full-Stack Integrated)
   Owns shared state and synchronizes with the Express/Database Backend.
   ----------------------------------------------------------------------- */

export default function TrioShopApp() {
  const [view, setView] = useState({ page: "home" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [banners, setBanners] = useState(BANNERS);
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [cart, setCart] = useState({}); // id -> {qty, color}
  const [wishlist, setWishlist] = useState({}); // id -> true
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModal, setAuthModal] = useState(null); // "user" | "admin" | null
  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ category: null, sort: "popular", maxPrice: 2000, onlyAvail: false });

  // 1. Initial Load: Local state + Backend Data Fetch
  useEffect(() => {
    (async () => {
      try {
        // Load initial offline cached state first
        const [c, w, o, u, a] = await Promise.all([
          loadState("trio-cart", {}),
          loadState("trio-wishlist", {}),
          loadState("trio-orders", []),
          loadState("trio-user", null),
          loadState("trio-isadmin", false),
        ]);
        setCart(c); setWishlist(w); setOrders(o); setUser(u); setIsAdmin(a);

        // Fetch live catalog and session from backend API
        await refreshCatalog();
        await refreshAuthSession();
      } catch (err) {
        console.warn("Using offline catalog fallback:", err.message);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function refreshCatalog() {
    try {
      const [prodRes, catRes, banRes, announcementRes] = await Promise.allSettled([
        api.products.getAll(),
        api.categories.getAll(),
        api.banners.getAll(),
        api.announcement.get(),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value?.products)) {
        setProducts(prodRes.value.products);
      }
      if (catRes.status === "fulfilled" && Array.isArray(catRes.value?.categories)) {
        setCategories(catRes.value.categories);
      }
      if (banRes.status === "fulfilled" && Array.isArray(banRes.value?.banners)) {
        setBanners(banRes.value.banners);
      }
      if (announcementRes.status === "fulfilled" && announcementRes.value?.announcement) {
        setAnnouncement({ ...DEFAULT_ANNOUNCEMENT, ...announcementRes.value.announcement });
      }
    } catch (err) {
      console.error("Error refreshing catalog:", err);
    }
  }

  async function refreshAuthSession() {
    if (!api.auth.hasToken()) {
      setUser(null);
      setIsAdmin(false);
      return;
    }

    try {
      const meRes = await api.auth.me();
      if (meRes?.user) {
        setUser(meRes.user);
        setIsAdmin(meRes.user.role === "admin");

        // Sync orders
        if (meRes.user.role === "admin") {
          const ordRes = await api.orders.getAllAdmin().catch(() => null);
          if (ordRes?.orders) setOrders(ordRes.orders);
        } else {
          const ordRes = await api.orders.getMyOrders().catch(() => null);
          if (ordRes?.orders) setOrders(ordRes.orders);
        }

        // Sync cart and wishlist from server
        const [serverCart, serverWishlist] = await Promise.allSettled([
          api.cart.get(),
          api.wishlist.get(),
        ]);
        if (serverCart.status === "fulfilled" && Object.keys(serverCart.value?.cart || {}).length > 0) {
          setCart(serverCart.value.cart);
        }
        if (serverWishlist.status === "fulfilled" && Object.keys(serverWishlist.value?.wishlist || {}).length > 0) {
          setWishlist(serverWishlist.value.wishlist);
        }
      }
    } catch (err) {
      if (err.status === 401) {
        api.auth.logout();
        setUser(null);
        setIsAdmin(false);
      } else {
        console.error("Unable to restore backend session:", err);
      }
    }
  }

  async function refreshOrders() {
    try {
      if (isAdmin) {
        const ordRes = await api.orders.getAllAdmin();
        if (ordRes?.orders) setOrders(ordRes.orders);
      } else {
        const ordRes = await api.orders.getMyOrders();
        if (ordRes?.orders) setOrders(ordRes.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }

  // Hidden admin entry point via URL hash: e.g. /#admin
  useEffect(() => {
    if (ready && !isAdmin && window.location.hash === "#admin") {
      setAuthModal("admin");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [ready, isAdmin]);

  // Persist locally for instant loading
  useEffect(() => { if (ready) saveState("trio-cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) saveState("trio-wishlist", wishlist); }, [wishlist, ready]);
  useEffect(() => { if (ready) saveState("trio-orders", orders); }, [orders, ready]);
  useEffect(() => { if (ready) saveState("trio-user", user); }, [user, ready]);
  useEffect(() => { if (ready) saveState("trio-isadmin", isAdmin); }, [isAdmin, ready]);

  function showToast(msg, icon) {
    setToast({ msg, icon, id: uid() });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 2500);
  }

  function goto(page, extra = {}) {
    setView({ page, ...extra });
    setMenuOpen(false);
    setSearchOpen(false);
    window.scrollTo?.(0, 0);
  }

  const cartCount = Object.values(cart).reduce((s, i) => s + (i.qty || 0), 0);
  const wishlistCount = Object.keys(wishlist).length;

  function addToCart(product, opts = {}) {
    if (!product || !product.id) return;

    const safeStock = Number(product.stock) || 0;
    const addQty = Number(opts.qty) > 0 ? Number(opts.qty) : 1;

    if (safeStock <= 0) {
      showToast("Out of stock", "warn");
      return;
    }

    setCart((prev) => {
      const existing = prev[product.id] || {};
      const currentQty = Number(existing.qty) || 0;
      const newQty = currentQty + addQty;

      if (newQty > safeStock) {
        showToast(`Only ${safeStock} left in stock`, "warn");
        return prev;
      }

      const newCart = {
        ...prev,
        [product.id]: {
          qty: newQty,
          color: opts.color || existing.color || product.variants?.color?.[0] || null,
        },
      };

      if (user) api.cart.sync(newCart).catch(() => {});
      showToast(`Added to cart (${newQty})`, "cart");
      return newCart;
    });
  }

  function updateCartQty(id, qty) {
    const product = products.find((p) => p.id === id);
    if (qty <= 0) { removeFromCart(id); return; }
    if (product && qty > product.stock) { showToast(`Only ${product.stock} left in stock`, "warn"); return; }
    setCart((prev) => {
      const newCart = { ...prev, [id]: { ...prev[id], qty } };
      if (user) api.cart.sync(newCart).catch(() => {});
      return newCart;
    });
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const n = { ...prev };
      delete n[id];
      if (user) api.cart.sync(n).catch(() => {});
      return n;
    });
    showToast("Item removed from cart", "cart");
  }

  function toggleWishlist(id) {
    setWishlist((prev) => {
      const n = { ...prev };
      if (n[id]) {
        delete n[id];
        showToast("Removed from wishlist", "heart");
      } else {
        n[id] = true;
        showToast("Added to wishlist", "heart");
      }
      if (user) api.wishlist.sync(n).catch(() => {});
      return n;
    });
  }

  async function placeOrder(orderDraft) {
    setLoading(true);
    try {
      let order = orderDraft.directOrder || null;
      if (!order) {
        throw new Error("Payment must be verified before an order is created.");
      }

      if (order) {
        setOrders((prev) => [order, ...prev]);
        setCart({});
        if (user) api.cart.sync({}).catch(() => {});

        // Refresh live product catalog to show updated stock
        await refreshCatalog();

        showToast(order.paymentStatus === "Paid" ? "Order placed successfully! 🎉" : "Order submitted. Payment verification is pending.", order.paymentStatus === "Paid" ? "check" : "warn");
        goto("confirmation", { orderId: order.id, order });
      }
    } catch (err) {
      showToast(err.message || "Failed to place order. Please try again.", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, status, note = "") {
    try {
      const res = await api.orders.updateStatus(orderId, status, note);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
        showToast(`Order marked as ${status}`, "check");
      }
    } catch (err) {
      // Fallback local update
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, cancelled: status === "Cancelled" } : o)));
      showToast(`Status updated to ${status}`, "check");
    }
  }

  async function cancelOrder(orderId) {
    try {
      const res = await api.orders.cancel(orderId);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
        await refreshCatalog();
        showToast("Order cancelled successfully", "check");
      }
    } catch (err) {
      showToast(err.message || "Failed to cancel order", "warn");
    }
  }

  function logout() {
    api.auth.logout();
    signOutFirebase().catch((err) => console.error("Firebase sign-out failed:", err));
    setUser(null);
    setIsAdmin(false);
    showToast("Logged out successfully", "check");
    goto("home");
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F9FAFB", color: "#7C3AED", fontFamily: "sans-serif" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #E9D5FF", borderTopColor: "#7C3AED", animation: "spin 1s linear infinite", marginBottom: 16 }} />
        <img src="/blora-logo.png" alt="BLORA" style={{ width: 120, height: 86, objectFit: "contain" }} />
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Connecting catalog & server…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const ctx = {
    view, goto, products, setProducts, categories, banners, announcement, cart, wishlist, orders, setOrders,
    user, setUser, isAdmin, setIsAdmin, addToCart, updateCartQty, removeFromCart, toggleWishlist,
    placeOrder, updateOrderStatus, cancelOrder, refreshCatalog, refreshOrders, refreshAuthSession, logout,
    showToast, filters, setFilters, searchQuery, setSearchQuery, loading, setLoading,
  };

  if (isAdmin && view.page.startsWith("admin")) {
    return <AdminApp ctx={ctx} />;
  }

  return (
    <div className="blora-app" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F1F3F6", minHeight: "100vh", color: "#212121", width: "100%", overflowX: "hidden" }}>
      <style>{GLOBAL_CSS}</style>
      <Header ctx={ctx} menuOpen={menuOpen} setMenuOpen={setMenuOpen} setAuthModal={setAuthModal} cartCount={cartCount} wishlistCount={wishlistCount} />
      {menuOpen && <MobileMenu ctx={ctx} setMenuOpen={setMenuOpen} setAuthModal={setAuthModal} />}

      <main>
        {view.page === "home" && <HomePage ctx={ctx} />}
        {view.page === "shop" && <ShopPage ctx={ctx} />}
        {view.page === "category" && <ShopPage ctx={ctx} presetCategory={view.categoryId} />}
        {view.page === "product" && <ProductPage ctx={ctx} />}
        {view.page === "cart" && <CartPage ctx={ctx} />}
        {view.page === "wishlist" && <WishlistPage ctx={ctx} />}
        {view.page === "checkout" && <CheckoutPage ctx={ctx} setAuthModal={setAuthModal} />}
        {view.page === "confirmation" && <ConfirmationPage ctx={ctx} />}
        {view.page === "orders" && <OrdersPage ctx={ctx} />}
        {view.page === "orderdetail" && <OrderDetailPage ctx={ctx} />}
        {view.page === "profile" && <ProfilePage ctx={ctx} setAuthModal={setAuthModal} />}
        {view.page === "about" && <AboutPage />}
        {view.page === "contact" && <ContactPage ctx={ctx} />}
      </main>

      <Footer goto={goto} setAuthModal={setAuthModal} />
      <WhatsAppFloat />
      {toast && <Toast toast={toast} />}
      {authModal && <AuthModal type={authModal} onClose={() => setAuthModal(null)} ctx={ctx} />}
    </div>
  );
}
