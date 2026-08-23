import React from "react";
import { X, User, ShoppingBag, Heart, Package, Info, PhoneCall } from "lucide-react";
import { CATEGORIES } from "../../data/products";

export default function MobileMenu({ ctx, setMenuOpen, setAuthModal }) {
  const { goto, user, isAdmin, setIsAdmin, setUser, categories } = ctx;
  const activeCategories = categories || CATEGORIES;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
      <div style={{ background: "white", width: 290, height: "100%", padding: 20, overflowY: "auto", boxShadow: "4px 0 20px rgba(0,0,0,.15)" }} className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13 }}>T3</div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#111827" }}>THE TRIO SHOP</div>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{ border: "none", background: "#F3F4F6", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 12, padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#7C3AED", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
            {user ? user.name[0].toUpperCase() : <User size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{user ? user.name : "Welcome Shopper!"}</div>
            <a
              onClick={() => {
                setMenuOpen(false);
                user ? goto("profile") : setAuthModal("user");
              }}
              style={{ fontSize: 12.5, color: "#7C3AED", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
            >
              {user ? "Manage Profile →" : "Sign In / Register"}
            </a>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            ["home", "Home"],
            ["shop", "Shop All Catalog"],
            ["wishlist", "My Wishlist"],
            ["cart", "Shopping Cart"],
            ["orders", "Track My Orders"],
            ["about", "About THE TRIO SHOP"],
            ["contact", "Customer Support"],
          ].map(([p, l]) => (
            <a
              key={p}
              onClick={() => goto(p)}
              style={{ display: "block", padding: "12px 6px", fontSize: 14, fontWeight: 600, color: "#374151", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
            >
              {l}
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "#9CA3AF", margin: "20px 6px 10px", letterSpacing: 0.5 }}>SHOP BY CATEGORY</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {activeCategories.map((c) => (
            <a
              key={c.id}
              onClick={() => goto("category", { categoryId: c.id })}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", fontSize: 13.5, color: "#4B5563", cursor: "pointer", borderRadius: 8 }}
            >
              <span style={{ fontSize: 18 }}>{c.emoji}</span> {c.name}
            </a>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, background: "rgba(0,0,0,.45)" }} onClick={() => setMenuOpen(false)} />
    </div>
  );
}
