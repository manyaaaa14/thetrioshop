import React, { useState, useEffect } from "react";
import { Truck, ShieldCheck, RotateCcw, Star, Instagram } from "lucide-react";
import { pctOff } from "../lib/format";
import SectionHeader from "../components/common/SectionHeader";
import ProductRow from "../components/common/ProductRow";

export default function HomePage({ ctx }) {
  const { goto, products, categories, banners } = ctx;
  const [bannerIdx, setBannerIdx] = useState(0);

  const activeBanners = Array.isArray(banners) ? banners.filter((banner) => banner.active !== false) : [];

  useEffect(() => {
    if (activeBanners.length < 2) {
      setBannerIdx(0);
      return undefined;
    }
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % activeBanners.length), 3500);
    return () => clearInterval(t);
  }, [activeBanners.length]);

  const bestsellers = products.filter((p) => p.badges?.includes("bestseller"));
  const newArrivals = products.filter((p) => p.badges?.includes("new"));
  const deals = [...products]
    .sort((a, b) => pctOff(b.price, b.mrp) - pctOff(a.price, a.mrp))
    .slice(0, 8);

  const activeCategories = categories || [];

  return (
    <div className="fade-in">
      {/* Banner carousel */}
      {activeBanners.length > 0 && <div style={{ maxWidth: 1200, margin: "12px auto", padding: "0 14px" }}>
        <div className="hero-banner" style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220, boxShadow: "0 8px 24px rgba(124,58,237,.15)" }}>
          {activeBanners.map((b, i) => (
            <div
              key={b.id || i}
              style={{
                position: "absolute",
                inset: 0,
                opacity: i === bannerIdx ? 1 : 0,
                transition: "opacity .6s ease",
                display: "flex",
                alignItems: "center",
                padding: "0 40px",
                color: "white",
                background: b.imageUrl
                  ? `linear-gradient(90deg, rgba(17,24,39,.78), rgba(17,24,39,.18)), url("${b.imageUrl}") center/cover`
                  : `linear-gradient(120deg, ${b.colorStart || "#245477"}, ${b.colorEnd || "#C6A46A"})`,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, opacity: 0.9 }}>BLORA</div>
                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{b.title}</div>
                <div style={{ fontSize: 14, marginTop: 6, opacity: 0.95 }}>{b.sub}</div>
                <button
                  onClick={() => goto(b.link || "shop", b.link === "category" && b.categoryId ? { categoryId: b.categoryId } : {})}
                  style={{ marginTop: 14, background: "white", color: "#111827", border: "none", padding: "10px 22px", borderRadius: 999, fontWeight: 800, fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,.1)" }}
                >
                  {b.ctaText || "Shop Now"}
                </button>
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {activeBanners.map((_, i) => (
              <div
                key={i}
                onClick={() => setBannerIdx(i)}
                style={{ width: i === bannerIdx ? 20 : 6, height: 6, borderRadius: 3, background: "white", opacity: i === bannerIdx ? 1 : 0.5, transition: "all .3s", cursor: "pointer" }}
              />
            ))}
          </div>
        </div>
      </div>}

      {/* Trust strip */}
      <div className="trust-grid" style={{ maxWidth: 1200, margin: "0 auto 20px", padding: "0 14px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {[
          [Truck, "Standard shipping ₹100"],
          [ShieldCheck, "100% Safe Payments"],
          [RotateCcw, "Budget Friendly"],
          [Star, "4.5★ rated shop across India"],
        ].map(([Icon, t], i) => (
          <div key={i} style={{ background: "white", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "#374151", border: "1px solid #E5E7EB" }}>
            <Icon size={17} color="#7C3AED" /> {t}
          </div>
        ))}
      </div>

      {/* Category rail */}
      <SectionHeader title="Shop by Category" />
      <div style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "0 14px", display: "flex", gap: 14, overflowX: "auto" }} className="scrollbar-none category-rail">
        {activeCategories.map((c) => (
          <div key={c.id} onClick={() => goto("category", { categoryId: c.id })} style={{ flexShrink: 0, width: 96, textAlign: "center", cursor: "pointer" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: c.color || "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 6px", transition: "transform .2s", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }} className="cat-circle">
              {c.emoji || "✨"}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937" }}>{c.name}</div>
          </div>
        ))}
      </div>

      {/* Deals */}
      <SectionHeader title="🔥 Deals of the Day" sub="Discounts up to 70% off" />
      <ProductRow products={deals} ctx={ctx} />

      {/* Bestsellers */}
      <SectionHeader title="⭐ Bestsellers" sub="Loved by 5,000+ Indian shoppers" />
      <ProductRow products={bestsellers} ctx={ctx} />

      {/* New arrivals */}
      <SectionHeader title="🆕 New Arrivals" sub="Trending designs just dropped" />
      <ProductRow products={newArrivals} ctx={ctx} />

      {/* Instagram / social */}
      <div style={{ maxWidth: 1200, margin: "30px auto", padding: "0 14px" }}>
        <div className="social-banner" style={{ borderRadius: 16, background: "linear-gradient(135deg,#7C3AED,#EC4899)", padding: "26px 24px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, boxShadow: "0 10px 25px rgba(236,72,153,.2)" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>Follow BLORA on Instagram</div>
            <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 3 }}>Get styling tips, customer unboxings & flash restocks</div>
          </div>
          <a href="https://www.instagram.com/thetrioshop._/" target="_blank" rel="noreferrer" style={{ background: "white", color: "#7C3AED", fontWeight: 800, fontSize: 13.5, padding: "11px 20px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8, textDecoration: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
            <Instagram size={17} /> @thetrioshop._
          </a>
        </div>
      </div>
    </div>
  );
}
