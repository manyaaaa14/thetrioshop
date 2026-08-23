import React, { useState, useMemo } from "react";
import { X, Filter, Search } from "lucide-react";
import { money } from "../lib/format";
import ProductCard from "../components/common/ProductCard";
import EmptyState from "../components/common/EmptyState";

export default function ShopPage({ ctx, presetCategory }) {
  const { products, categories, filters, setFilters, searchQuery, goto } = ctx;
  const [showFilters, setShowFilters] = useState(false);
  const activeCategory = presetCategory || filters.category;
  const activeCategories = categories || [];

  const filtered = useMemo(() => {
    let list = [...products].filter((p) => !p.hidden);
    if (searchQuery && searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (filters.onlyAvail) list = list.filter((p) => p.stock > 0);
    list = list.filter((p) => p.price <= filters.maxPrice);
    switch (filters.sort) {
      case "lowhigh": list.sort((a, b) => a.price - b.price); break;
      case "highlow": list.sort((a, b) => b.price - a.price); break;
      case "newest": list = list.filter((p) => p.badges?.includes("new")).concat(list.filter((p) => !p.badges?.includes("new"))); break;
      case "rated": list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: list.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    }
    return list;
  }, [products, searchQuery, activeCategory, filters]);

  const categoryName = activeCategory ? activeCategories.find((c) => c.id === activeCategory)?.name || activeCategory : "All Products";

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: "16px auto", padding: "0 14px", display: "flex", gap: 20 }}>
      <aside style={{ width: 220, flexShrink: 0 }} className="filter-sidebar">
        <FilterPanel filters={filters} setFilters={setFilters} activeCategory={activeCategory} presetCategory={presetCategory} categories={activeCategories} />
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#111827", textTransform: "capitalize" }}>{categoryName}</div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>{filtered.length} products available{searchQuery ? ` matching "${searchQuery}"` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="mobile-filter-btn" onClick={() => setShowFilters(true)} style={{ border: "1px solid #D1D5DB", background: "white", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, display: "none", alignItems: "center", gap: 6 }}>
              <Filter size={14} /> Filters
            </button>
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, background: "white", color: "#374151", fontWeight: 600 }}>
              <option value="popular">Sort: Popularity</option>
              <option value="lowhigh">Price: Low to High</option>
              <option value="highlow">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
              <option value="rated">Customer Ratings</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Search size={38} />} title="No products match your filters" sub="Try adjusting your price range or search terms" />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
            {filtered.map((p) => <ProductCard key={p.id} p={p} ctx={ctx} />)}
          </div>
        )}
      </div>

      {showFilters && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "flex", alignItems: "flex-end" }} onClick={() => setShowFilters(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", width: "100%", borderRadius: "16px 16px 0 0", padding: 20, maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <b style={{ fontSize: 16 }}>Filter Catalog</b>
              <X onClick={() => setShowFilters(false)} style={{ cursor: "pointer" }} />
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} activeCategory={activeCategory} presetCategory={presetCategory} categories={activeCategories} />
            <button onClick={() => setShowFilters(false)} style={{ marginTop: 14, width: "100%", background: "#7C3AED", color: "white", border: "none", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 820px){ .filter-sidebar{ display:none; } .mobile-filter-btn{ display:flex !important; } }
      `}</style>
    </div>
  );
}

function FilterPanel({ filters, setFilters, activeCategory, presetCategory, categories }) {
  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", padding: 16 }}>
      {!presetCategory && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#111827" }}>Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="radio" checked={!filters.category} onChange={() => setFilters((f) => ({ ...f, category: null }))} /> All Categories
            </label>
            {categories.map((c) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="radio" checked={filters.category === c.id} onChange={() => setFilters((f) => ({ ...f, category: c.id }))} />
                <span>{c.emoji} {c.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#111827" }}>Max Price: {money(filters.maxPrice)}</div>
        <input type="range" min="100" max="3000" step="50" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: +e.target.value }))} style={{ width: "100%", accentColor: "#7C3AED" }} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: "#374151", fontWeight: 600 }}>
        <input type="checkbox" checked={filters.onlyAvail} onChange={(e) => setFilters((f) => ({ ...f, onlyAvail: e.target.checked }))} />
        In stock only
      </label>
    </div>
  );
}
