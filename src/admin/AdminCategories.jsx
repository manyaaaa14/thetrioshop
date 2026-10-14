import React, { useState, useEffect } from "react";
import { Trash2, PlusCircle, Plus, X } from "lucide-react";
import { CATEGORIES } from "../data/products";
import { api } from "../services/api";

export default function AdminCategories({ ctx }) {
  const { setCategories } = ctx;
  const [cats, setCats] = useState(CATEGORIES);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState("#F3E8FF");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await api.categories.getAll();
      if (res.categories && res.categories.length > 0) {
        setCats(res.categories);
      }
    } catch (err) {
      console.warn("Using fallback categories");
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await api.categories.create({
        name: name.trim(),
        emoji,
        color,
      });
      if (res.category) {
        setCats((prev) => [...prev, res.category]);
        setCategories((prev) => [...prev, res.category]);
        setName("");
        setShowAdd(false);
        if (ctx?.showToast) ctx.showToast("Category created successfully! 🏷️", "check");
      }
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Failed to add category", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.categories.remove(id);
      setCats((prev) => prev.filter((x) => x.id !== id));
      setCategories((prev) => prev.filter((x) => x.id !== id));
      if (ctx?.showToast) ctx.showToast("Category deleted", "check");
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Failed to delete category", "warn");
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Storefront Product Categories</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Manage categories displayed on the storefront category rail</div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddCategory} style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", padding: 14, borderRadius: 10, marginBottom: 18, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name (e.g. Footwear)"
            style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 12px", fontSize: 13, flex: 2, minWidth: 160 }}
            required
          />
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="Emoji (e.g. 👟)"
            style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: 80, textAlign: "center" }}
            maxLength={4}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 44, height: 38, border: "1px solid #D1D5DB", borderRadius: 8, cursor: "pointer" }}
            title="Background Tint Color"
          />
          <button type="submit" disabled={loading} style={{ background: "#7C3AED", color: "white", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
            {loading ? "Creating…" : "Save Category"}
          </button>
          <button type="button" onClick={() => setShowAdd(false)} style={{ background: "#F3F4F6", border: "none", padding: "9px 12px", borderRadius: 8, fontSize: 12.5 }}>
            Cancel
          </button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14 }}>
        {cats.map((c) => (
          <div key={c.id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, textAlign: "center", position: "relative", background: "#FFFFFF", transition: "transform .15s" }}>
            <button
              onClick={() => handleDeleteCategory(c.id)}
              style={{ position: "absolute", top: 8, right: 8, border: "none", background: "none", color: "#DC2626", cursor: "pointer" }}
              title="Delete Category"
            >
              <Trash2 size={14} />
            </button>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.color || "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 8px" }}>
              {c.emoji || "🏷️"}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Slug: {c.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
