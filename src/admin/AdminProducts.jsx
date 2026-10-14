import React, { useState } from "react";
import { PlusCircle, Edit3, Eye, EyeOff, Trash2, X, RefreshCw } from "lucide-react";
import { CATEGORIES } from "../data/products";
import { money } from "../lib/format";
import Input from "../components/common/Input";
import { api } from "../services/api";

const MAX_PRODUCT_IMAGE_SIZE = 2 * 1024 * 1024;

export default function AdminProducts({ ctx }) {
  const { products, setProducts, showToast, refreshCatalog } = ctx;
  const [editing, setEditing] = useState(null); // product or "new"
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  async function saveProduct(p) {
    setLoading(true);
    try {
      if (p.id && products.find((x) => x.id === p.id)) {
        const res = await api.products.update(p.id, p);
        if (res.product) {
          setProducts((prev) => prev.map((x) => (x.id === p.id ? res.product : x)));
          showToast("Product updated successfully! ✅", "check");
        }
      } else {
        const res = await api.products.create(p);
        if (res.product) {
          setProducts((prev) => [res.product, ...prev]);
          showToast("Product created successfully! 🛍️", "check");
        }
      }
      if (refreshCatalog) refreshCatalog();
      setEditing(null);
    } catch (err) {
      showToast(err.message || "Failed to save product", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await api.products.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted", "check");
      if (refreshCatalog) refreshCatalog();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "warn");
    }
  }

  async function toggleFlag(id, flag) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const badges = product.badges || [];
    const newBadges = badges.includes(flag) ? badges.filter((b) => b !== flag) : [...badges, flag];
    try {
      const res = await api.products.update(id, { badges: newBadges });
      if (res.product) {
        setProducts((prev) => prev.map((p) => (p.id === id ? res.product : p)));
      }
    } catch (err) {
      showToast("Failed to update badge", "warn");
    }
  }

  async function toggleVisibility(id) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    try {
      const res = await api.products.update(id, { hidden: !product.hidden });
      if (res.product) {
        setProducts((prev) => prev.map((p) => (p.id === id ? res.product : p)));
        showToast(res.product.hidden ? "Product hidden from store" : "Product now visible", "check");
      }
    } catch (err) {
      showToast("Failed to update visibility", "warn");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name…"
          style={{ border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 12px", fontSize: 13, minWidth: 260 }}
        />
        <button
          onClick={() => setEditing("new")}
          style={{ background: "#7C3AED", color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <PlusCircle size={16} /> Add New Product
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 780 }}>
          <thead>
            <tr style={{ background: "#F9FAFB", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
              {["Product", "Category", "Price", "MRP", "Stock", "Badges", "Store Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#9CA3AF" }}>No products found</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={p.images?.[0]} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                    <span style={{ fontWeight: 600, color: "#111827" }}>{p.name}</span>
                  </td>
                  <td style={{ padding: "10px 12px", textTransform: "capitalize", color: "#6B7280" }}>{p.category}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111827" }}>{money(p.price)}</td>
                  <td style={{ padding: "10px 12px", color: "#9CA3AF", textDecoration: "line-through" }}>{money(p.mrp)}</td>
                  <td style={{ padding: "10px 12px", color: p.stock === 0 ? "#DC2626" : p.stock < 10 ? "#F59E0B" : "#16A34A", fontWeight: 700 }}>
                    {p.stock === 0 ? "Out of Stock (0)" : `${p.stock} units`}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["bestseller", "new", "sale"].map((f) => (
                        <button
                          key={f}
                          onClick={() => toggleFlag(p.id, f)}
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #DDD",
                            background: p.badges?.includes(f) ? "#7C3AED" : "white",
                            color: p.badges?.includes(f) ? "white" : "#6B7280",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {p.hidden ? (
                      <span style={{ color: "#9CA3AF", background: "#F3F4F6", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Hidden</span>
                    ) : (
                      <span style={{ color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditing(p)} style={{ border: "none", background: "none", color: "#2563EB", cursor: "pointer" }} title="Edit Product">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => toggleVisibility(p.id)} style={{ border: "none", background: "none", color: "#6B7280", cursor: "pointer" }} title={p.hidden ? "Show" : "Hide"}>
                        {p.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => deleteProduct(p.id)} style={{ border: "none", background: "none", color: "#DC2626", cursor: "pointer" }} title="Delete Product">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
          loading={loading}
        />
      )}
    </div>
  );
}

function ProductEditModal({ product, onClose, onSave, loading }) {
  const [imageError, setImageError] = useState("");
  const [form, setForm] = useState(
    product || {
      name: "",
      category: "jewellery",
      price: "",
      mrp: "",
      stock: "",
      desc: "",
      images: [],
      badges: [],
      rating: 4.5,
      ratingCount: 1,
      variants: { size: [], color: [] },
    }
  );

  function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file.");
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setImageError("Image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setImageError("Unable to read this image. Please try another file.");
        return;
      }
      setForm((current) => ({ ...current, images: [reader.result] }));
      setImageError("");
    };
    reader.onerror = () => setImageError("Unable to read this image. Please try again.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function save() {
    if (!form.images?.[0]) {
      setImageError("Please upload a product image.");
      return;
    }

    onSave({
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      stock: Number(form.stock),
      variants: form.variants || { size: [], color: [] },
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: 24, width: 480, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,.2)" }} className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#111827" }}>{product ? "Edit Product Details" : "Create New Product"}</div>
          <button onClick={onClose} style={{ border: "none", background: "#F3F4F6", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Product Name*" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} full placeholder="e.g. Handmade Silver Choker" />
          
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#4B5563" }}>Category</div>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Selling Price (₹)*" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v.replace(/\D/g, "") }))} placeholder="e.g. 499" />
            <Input label="MRP (₹)*" value={form.mrp} onChange={(v) => setForm((f) => ({ ...f, mrp: v.replace(/\D/g, "") }))} placeholder="e.g. 999" />
          </div>

          <Input label="Stock Quantity (Units)*" value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v.replace(/\D/g, "") }))} full placeholder="e.g. 50" />
          <div>
            <label htmlFor="product-image" style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#4B5563" }}>Product Image*</label>
            <input id="product-image" type="file" accept="image/*" onChange={selectImage} style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: 8, fontSize: 13 }} />
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Choose an image file (max 2 MB).</div>
            {form.images?.[0] && (
              <img src={form.images[0]} alt="Product preview" style={{ display: "block", width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #E5E7EB", marginTop: 8 }} />
            )}
            {imageError && <div role="alert" style={{ color: "#DC2626", fontSize: 12, marginTop: 4 }}>{imageError}</div>}
          </div>
          
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#4B5563" }}>Product Description</div>
            <textarea
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              rows={3}
              placeholder="Features, material details, care instructions..."
              style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "inherit" }}
            />
          </div>

          <button
            onClick={save}
            disabled={loading}
            style={{ background: "#7C3AED", color: "white", border: "none", padding: "12px 0", borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 6, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving…" : product ? "Update Product" : "Publish Product to Store"}
          </button>
        </div>
      </div>
    </div>
  );
}
