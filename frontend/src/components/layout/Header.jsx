import React, { useState, useMemo } from "react";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import { CATEGORIES } from "../../data/products";

export default function Header({ ctx, menuOpen, setMenuOpen, setAuthModal, cartCount, wishlistCount }) {
  const { goto, user, isAdmin, searchQuery, setSearchQuery, products, categories } = ctx;
  const [localQ, setLocalQ] = useState(searchQuery);
  const activeCategories = categories || CATEGORIES;
  const suggestions = useMemo(() => {
    if (!localQ || localQ.length < 2) return [];
    const q = localQ.toLowerCase();
    return products.filter((p) => !p.hidden && (p.name.toLowerCase().includes(q) || p.category.includes(q))).slice(0, 6);
  }, [localQ, products]);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", fontSize: 12, padding: "6px 14px", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div className="ticker" style={{ display: "inline-block" }}>
          ✨ BLORA SALE — Up to 70% OFF &nbsp;&nbsp;•&nbsp;&nbsp; 🚚 FREE delivery above ₹499 &nbsp;&nbsp;•&nbsp;&nbsp; 🎁 Use code TRIO50 for flat ₹50 OFF &nbsp;&nbsp;•&nbsp;&nbsp; ⚡ Express Shipping across India &nbsp;&nbsp;•&nbsp;&nbsp;
          ✨ BLORA SALE — Up to 70% OFF &nbsp;&nbsp;•&nbsp;&nbsp; 🚚 FREE delivery above ₹499 &nbsp;&nbsp;•&nbsp;&nbsp; 🎁 Use code TRIO50 for flat ₹50 OFF &nbsp;&nbsp;•&nbsp;&nbsp; ⚡ Express Shipping across India &nbsp;&nbsp;•&nbsp;&nbsp;
        </div>
      </div>
      <div style={{ background: "white", borderBottom: "1px solid #eee", boxShadow: "0 2px 6px rgba(0,0,0,.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 14px", display: "flex", alignItems: "center", gap: 14 }}>
          <div className="mobile-toggle" onClick={() => setMenuOpen(true)} style={{ border: "none", background: "none", padding: 4, cursor: "pointer" }}>
            <Menu size={22} />
          </div>
          
          <a onClick={() => goto("home")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#EC4899,#F97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15, boxShadow: "0 2px 8px rgba(124,58,237,.3)" }}>B</div>
            <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: -0.5, color: "#111827" }}>BLORA</div>
          </a>

          <div style={{ flex: 1, position: "relative", maxWidth: 600 }} className="desktop-search">
            <div style={{ display: "flex", alignItems: "center", background: "#F1F3F6", borderRadius: 8, padding: "8px 14px", gap: 8, border: "1px solid #E5E7EB" }}>
              <Search size={17} color="#6B7280" />
              <input
                value={localQ}
                onChange={(e) => {
                  setLocalQ(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && localQ.trim()) {
                    goto("shop");
                  }
                }}
                placeholder="Search jewellery, bags, stickers, gifts…"
                style={{ border: "none", outline: "none", background: "none", flex: 1, fontSize: 13.5 }}
              />
              {localQ && (
                <X
                  size={15}
                  color="#888"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setLocalQ("");
                    setSearchQuery("");
                  }}
                />
              )}
            </div>
            
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "115%", left: 0, right: 0, background: "white", borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,.15)", overflow: "hidden", zIndex: 50, border: "1px solid #E5E7EB" }}>
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      goto("product", { productId: p.id });
                      setLocalQ("");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #F3F4F6", cursor: "pointer", transition: "background .15s" }}
                    className="suggestion-row"
                  >
                    <img src={p.images?.[0]} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", textTransform: "capitalize" }}>{p.category}</div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#16A34A" }}>₹{p.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginLeft: "auto" }}>
            <IconBtn
              onClick={() => (user ? goto("profile") : setAuthModal("user"))}
              icon={<User size={21} />}
              label={user ? user.name.split(" ")[0] : "Login"}
            />
            <IconBtn
              onClick={() => goto("wishlist")}
              icon={<Heart size={21} />}
              label="Wishlist"
              count={wishlistCount}
            />
            <IconBtn
              onClick={() => goto("cart")}
              icon={<ShoppingCart size={21} />}
              label="Cart"
              count={cartCount}
              accent
            />
          </div>
        </div>

        {/* Storefront Category Navbar */}
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 14px 10px", display: "flex", gap: 22, fontSize: 13.5, fontWeight: 600, overflowX: "auto" }} className="scrollbar-none">
          {["home", "shop"].map((p) => (
            <a
              key={p}
              onClick={() => goto(p)}
              style={{ color: ctx.view.page === p ? "#7C3AED" : "#374151", whiteSpace: "nowrap", padding: "4px 0", borderBottom: ctx.view.page === p ? "2px solid #7C3AED" : "2px solid transparent", cursor: "pointer" }}
            >
              {p === "home" ? "Home" : "Shop All Catalog"}
            </a>
          ))}
          {activeCategories.slice(0, 6).map((c) => (
            <a
              key={c.id}
              onClick={() => goto("category", { categoryId: c.id })}
              style={{ color: "#4B5563", whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <span>{c.name}</span>
            </a>
          ))}
          <a onClick={() => goto("about")} style={{ color: "#4B5563", whiteSpace: "nowrap", cursor: "pointer" }}>About Us</a>
          <a onClick={() => goto("contact")} style={{ color: "#4B5563", whiteSpace: "nowrap", cursor: "pointer" }}>Help & Contact</a>
        </nav>
      </div>
      <style>{`
        .mobile-toggle{ display:none; }
        @media (max-width: 820px){
          .desktop-search{ display:none; }
          .mobile-toggle{ display:flex; }
        }
      `}</style>
    </header>
  );
}

function IconBtn({ icon, label, count, onClick, accent }) {
  return (
    <button onClick={onClick} style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative", color: "#1F2937", cursor: "pointer" }}>
      <div style={{ position: "relative" }}>
        {icon}
        {count > 0 && (
          <span style={{ position: "absolute", top: -8, right: -9, background: accent ? "#EC4899" : "#7C3AED", color: "white", fontSize: 10, fontWeight: 700, borderRadius: 10, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{count}</span>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600 }} className="icon-label">{label}</span>
    </button>
  );
}
