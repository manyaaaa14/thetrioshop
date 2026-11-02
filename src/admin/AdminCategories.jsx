import React, { useEffect, useState } from "react";
import { Edit3, ImagePlus, Plus, Trash2 } from "lucide-react";
import { api } from "../services/api";

const MAX_CATEGORY_IMAGE_SIZE = 2 * 1024 * 1024;
const emptyForm = { name: "", emoji: "✨", color: "#F3E8FF", image: "" };

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Unable to read this image. Please try another file."));
    reader.onerror = () => reject(new Error("Unable to read this image. Please try again."));
    reader.readAsDataURL(file);
  });
}

export default function AdminCategories({ ctx, initialCreate = false }) {
  const { setCategories, showToast } = ctx;
  const [categories, setLocalCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.categories.getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res.categories)) {
          setLocalCategories(res.categories);
          setCategories(res.categories);
        }
      })
      .catch((err) => {
        if (!cancelled) showToast(err.message || "Unable to load categories", "warn");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (initialCreate) startCreate();
  }, [initialCreate]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageError("");
    setFormOpen(true);
  }

  function startEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      emoji: category.emoji || "✨",
      color: category.color || "#F3E8FF",
      image: category.image || "",
    });
    setImageError("");
    setFormOpen(true);
  }

  async function selectImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file.");
      return;
    }
    if (file.size > MAX_CATEGORY_IMAGE_SIZE) {
      setImageError("Category images must be 2 MB or smaller.");
      return;
    }
    try {
      const image = await readImage(file);
      setForm((current) => ({ ...current, image }));
      setImageError("");
    } catch (error) {
      setImageError(error.message);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setImageError("Enter a category name.");
      return;
    }

    setLoading(true);
    try {
      const result = editingId
        ? await api.categories.update(editingId, form)
        : await api.categories.create(form);
      if (!result.category) throw new Error("The server did not return the saved category.");
      const saved = result.category;
      const next = editingId
        ? categories.map((category) => category.id === editingId ? saved : category)
        : [...categories, saved];
      setLocalCategories(next);
      setCategories(next);
      setForm(emptyForm);
      setFormOpen(false);
      setEditingId(null);
      showToast(editingId ? "Category updated successfully" : "Category created successfully", "check");
    } catch (err) {
      showToast(err.message || "Unable to save category", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete "${category.name}"? Categories with products cannot be deleted.`)) return;
    try {
      await api.categories.remove(category.id);
      const next = categories.filter((item) => item.id !== category.id);
      setLocalCategories(next);
      setCategories(next);
      showToast("Category deleted", "check");
    } catch (err) {
      showToast(err.message || "Unable to delete category", "warn");
    }
  }

  return (
    <section style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Manage Categories</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Categories are shared with the storefront and product editor.</div>
        </div>
        <button type="button" onClick={startCreate} style={{ background: "#7C3AED", color: "white", border: 0, padding: "9px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", whiteSpace: "nowrap" }}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      {formOpen && (
        <form onSubmit={saveCategory} style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", padding: 16, borderRadius: 10, marginBottom: 18, display: "grid", gridTemplateColumns: "minmax(180px, 2fr) minmax(100px, 1fr) auto", gap: 10, alignItems: "end" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>
            Category Name
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={80} required placeholder="e.g. Crochet" style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 10px", fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>
            Icon (optional)
            <input value={form.emoji} onChange={(event) => setForm((current) => ({ ...current, emoji: event.target.value }))} maxLength={4} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 5, border: "1px solid #D1D5DB", borderRadius: 8, padding: "9px 10px", fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>
            Background color
            <input type="color" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} style={{ display: "block", width: "100%", height: 38, boxSizing: "border-box", marginTop: 5, border: "1px solid #D1D5DB", borderRadius: 8, cursor: "pointer" }} />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label htmlFor="category-image" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, background: "white", border: "1px solid #D1D5DB", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <ImagePlus size={15} /> {form.image ? "Change image" : "Upload image (optional)"}
            </label>
            <input id="category-image" type="file" accept="image/*" onChange={selectImage} style={{ display: "none" }} />
            {form.image && (
              <>
                <img src={form.image} alt="Category preview" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 8 }} />
                <button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))} style={{ border: 0, background: "transparent", color: "#DC2626", cursor: "pointer", fontSize: 12 }}>Remove image</button>
              </>
            )}
            {imageError && <span role="alert" style={{ color: "#DC2626", fontSize: 12 }}>{imageError}</span>}
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading} style={{ background: "#7C3AED", color: "white", border: 0, padding: "9px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{loading ? "Saving…" : editingId ? "Update Category" : "Save Category"}</button>
            <button type="button" onClick={() => setFormOpen(false)} style={{ background: "#F3F4F6", border: 0, padding: "9px 12px", borderRadius: 8, fontSize: 12.5, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loadingCategories ? (
        <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>Loading categories…</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>No categories yet. Add one to make it available in the product editor.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
          {categories.map((category) => (
            <article key={category.id} style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 14, position: "relative", background: "#FFFFFF" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: category.color || "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: 26, marginBottom: 10 }}>
                {category.image ? <img src={category.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : category.emoji || "🏷️"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{category.name}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>ID: {category.id}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "#2563EB", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><Edit3 size={14} /> Edit</button>
                <button type="button" onClick={() => deleteCategory(category)} aria-label={`Delete ${category.name}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "#DC2626", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
