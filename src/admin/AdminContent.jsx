import React, { useState, useEffect } from "react";
import Input from "../components/common/Input";
import { api } from "../services/api";
import { Save, Plus, Trash2, LayoutTemplate } from "lucide-react";

export default function AdminContent({ ctx }) {
  const [banners, setBanners] = useState([
    { id: "b1", title: "TRIO DAYS SALE", sub: "Up to 70% off jewellery & bags", grad: "from-violet-600 via-fuchsia-600 to-pink-500", link: "shop", active: true },
    { id: "b2", title: "NEW ARRIVALS", sub: "Fresh drops every Friday", grad: "from-amber-500 via-orange-500 to-rose-500", link: "category", active: true },
    { id: "b3", title: "FREE SHIPPING", sub: "On orders above ₹499", grad: "from-blue-600 via-indigo-600 to-violet-600", link: "shop", active: true },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      const res = await api.admin.getBanners();
      if (res.banners && res.banners.length > 0) {
        setBanners(res.banners);
      }
    } catch (err) {
      console.warn("Using default banners");
    }
  }

  async function handleSaveBanners() {
    setLoading(true);
    try {
      await api.admin.updateBanners(banners);
      if (ctx?.showToast) ctx.showToast("Homepage banners saved to database! 🎨", "check");
      if (ctx?.refreshCatalog) ctx.refreshCatalog();
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Failed to save banners", "warn");
    } finally {
      setLoading(false);
    }
  }

  function updateBanner(idx, field, value) {
    setBanners((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Homepage Promotional Banners</div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>Edit titles, subtitles, and color gradients shown on the storefront carousel</div>
          </div>
          <button
            onClick={handleSaveBanners}
            disabled={loading}
            style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Save size={14} /> {loading ? "Saving…" : "Save All"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {banners.map((b, idx) => (
            <div key={b.id || idx} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, background: "#F9FAFB" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#7C3AED", marginBottom: 8 }}>Banner #{idx + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Input label="Headline Title" value={b.title} onChange={(v) => updateBanner(idx, "title", v)} full />
                <Input label="Subtitle" value={b.sub} onChange={(v) => updateBanner(idx, "sub", v)} full />
                <Input label="Tailwind Gradient Classes" value={b.grad} onChange={(v) => updateBanner(idx, "grad", v)} full />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
