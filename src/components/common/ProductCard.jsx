import React, { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { money, pctOff } from "../../lib/format";

// A single product tile used in grids and horizontal scroll rows.

export default function ProductCard({ p, ctx }) {
  const { goto, wishlist, toggleWishlist, addToCart } = ctx;
  const off = pctOff(p.price, p.mrp);
  const isWished = !!wishlist[p.id];
  const [heartPop, setHeartPop] = useState(false);

  return (
    <div className="fade-in product-card" style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #eee", position: "relative", transition: "box-shadow .2s, transform .2s" }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div onClick={() => goto("product", { productId: p.id })} style={{ cursor: "pointer", position: "relative" }}>
        <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} loading="lazy" />
        {p.stock === 0 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.72)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "#333", color: "white", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6 }}>OUT OF STOCK</span>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {p.badges?.includes("bestseller") && <Badge text="BESTSELLER" bg="#F97316" />}
          {p.badges?.includes("new") && <Badge text="NEW" bg="#2563EB" />}
          {p.badges?.includes("sale") && <Badge text="SALE" bg="#DC2626" />}
        </div>
        {off > 0 && <div style={{ position: "absolute", top: 8, right: 8, background: "#16A34A", color: "white", fontSize: 10.5, fontWeight: 700, padding: "3px 6px", borderRadius: 5 }}>{off}% OFF</div>}
      </div>
      <button onClick={() => { toggleWishlist(p.id); setHeartPop(true); setTimeout(() => setHeartPop(false), 400); }}
        style={{ position: "absolute", bottom: 96, right: 8, background: "white", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.15)" }}>
        <Heart size={15} fill={isWished ? "#EC4899" : "none"} color={isWished ? "#EC4899" : "#888"} className={heartPop ? "heart-pop" : ""} />
      </button>
      <div style={{ padding: "9px 10px 11px" }}>
        <div onClick={() => goto("product", { productId: p.id })} style={{ fontSize: 12.5, fontWeight: 600, cursor: "pointer", lineHeight: 1.3, height: 32, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <span style={{ background: "#16A34A", color: "white", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>{p.rating} <Star size={9} fill="white" /></span>
          <span style={{ fontSize: 10.5, color: "#999" }}>({p.ratingCount})</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{money(p.price)}</span>
          {off > 0 && <span style={{ fontSize: 11.5, color: "#999", textDecoration: "line-through" }}>{money(p.mrp)}</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} disabled={p.stock === 0}
          style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: p.stock === 0 ? "#eee" : "linear-gradient(90deg,#7C3AED,#DB2777)", color: p.stock === 0 ? "#999" : "white", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: p.stock === 0 ? "not-allowed" : "pointer" }}>
          <ShoppingCart size={13} /> {p.stock === 0 ? "Notify Me" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export function Badge({ text, bg }) {
  return <span style={{ background: bg, color: "white", fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: .3 }}>{text}</span>;
}
