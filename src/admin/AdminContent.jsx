import React, { useEffect, useState } from "react";
import Input from "../components/common/Input";
import { api } from "../services/api";
import { Save, Plus, Trash2 } from "lucide-react";
import { DEFAULT_ANNOUNCEMENT } from "../data/products";

const COLOR_START = "#245477";
const COLOR_END = "#C6A46A";

export default function AdminContent({ ctx }) {
  const [banners, setBanners] = useState([]);
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    loadBanners();
    loadAnnouncement();
  }, []);

  async function loadBanners() {
    try {
      const res = await api.admin.getBanners();
      setBanners(Array.isArray(res.banners) ? res.banners : []);
    } catch (err) {
      console.error("Unable to load homepage banners:", err);
      ctx?.showToast?.(err.message || "Unable to load homepage banners", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncement() {
    try {
      const res = await api.admin.getAnnouncement();
      if (res.announcement) setAnnouncement({ ...DEFAULT_ANNOUNCEMENT, ...res.announcement });
    } catch (err) {
      console.error("Unable to load announcement bar settings:", err);
      ctx?.showToast?.(err.message || "Unable to load announcement bar settings", "warn");
    }
  }

  async function handleSaveBanners() {
    setSaving(true);
    try {
      const res = await api.admin.updateBanners(banners);
      setBanners(Array.isArray(res.banners) ? res.banners : banners);
      ctx?.showToast?.("Homepage banners saved", "check");
      ctx?.refreshCatalog?.();
    } catch (err) {
      ctx?.showToast?.(err.message || "Failed to save banners", "warn");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAnnouncement() {
    setSavingAnnouncement(true);
    try {
      const res = await api.admin.updateAnnouncement(announcement);
      if (res.announcement) setAnnouncement({ ...DEFAULT_ANNOUNCEMENT, ...res.announcement });
      ctx?.showToast?.("Announcement bar settings saved", "check");
      ctx?.refreshCatalog?.();
    } catch (err) {
      ctx?.showToast?.(err.message || "Failed to save announcement bar settings", "warn");
    } finally {
      setSavingAnnouncement(false);
    }
  }

  function updateBanner(idx, field, value) {
    setBanners((prev) => prev.map((banner, i) => i === idx ? { ...banner, [field]: value } : banner));
  }

  function addBanner() {
    setBanners((prev) => [...prev, {
      id: `banner-${Date.now()}`,
      title: "New collection",
      sub: "Discover something you love",
      ctaText: "Shop Now",
      link: "shop",
      colorStart: COLOR_START,
      colorEnd: COLOR_END,
      imageUrl: "",
      active: true,
    }]);
  }

  const categories = ctx?.categories || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Announcement Bar</div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>Customize the scrolling message and its appearance at the top of the storefront.</div>
          </div>
          <button
            onClick={handleSaveAnnouncement}
            disabled={savingAnnouncement}
            style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Save size={14} /> {savingAnnouncement ? "Saving…" : "Save announcement"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
          <Input label="Scrolling message" value={announcement.message} maxLength={240} onChange={(value) => setAnnouncement((prev) => ({ ...prev, message: value }))} full />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#4B5563" }}>
            <input type="checkbox" checked={announcement.enabled} onChange={(e) => setAnnouncement((prev) => ({ ...prev, enabled: e.target.checked }))} />
            Show announcement bar
          </label>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
            Bar background
            <input type="color" value={announcement.backgroundColor} onChange={(e) => setAnnouncement((prev) => ({ ...prev, backgroundColor: e.target.value }))} style={{ display: "block", width: "100%", height: 38, marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: 4, background: "white" }} />
          </label>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
            Text color
            <input type="color" value={announcement.textColor} onChange={(e) => setAnnouncement((prev) => ({ ...prev, textColor: e.target.value }))} style={{ display: "block", width: "100%", height: 38, marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: 4, background: "white" }} />
          </label>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
            Scroll duration (seconds)
            <input
              type="number"
              min="8"
              max="60"
              value={announcement.scrollDuration}
              onChange={(e) => setAnnouncement((prev) => ({ ...prev, scrollDuration: Number(e.target.value) }))}
              style={{ display: "block", width: "100%", marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: "9px 10px", fontSize: 13 }}
            />
          </label>
        </div>
        <div aria-label="Announcement preview" style={{ marginTop: 14, overflow: "hidden", whiteSpace: "nowrap", background: announcement.backgroundColor, color: announcement.textColor, padding: "7px 12px", fontSize: 12 }}>
          {announcement.message || "Announcement preview"}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Homepage Promotional Banners</div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>Edit banner content, images, colors, visibility, and button destinations.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={addBanner}
              disabled={loading || banners.length >= 10}
              style={{ background: "white", color: "#374151", border: "1px solid #D1D5DB", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <Plus size={14} /> Add banner
            </button>
            <button
              onClick={handleSaveBanners}
              disabled={loading || saving}
              style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <Save size={14} /> {saving ? "Saving…" : "Save All"}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 18, textAlign: "center", color: "#6B7280", fontSize: 13 }}>Loading banners…</div>
        ) : banners.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", color: "#6B7280", fontSize: 13 }}>No banners yet. Add one to feature it on the homepage.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {banners.map((b, idx) => {
              const previewBackground = b.imageUrl
                ? `linear-gradient(90deg, rgba(17,24,39,.78), rgba(17,24,39,.18)), url("${b.imageUrl}") center/cover`
                : `linear-gradient(120deg, ${b.colorStart || COLOR_START}, ${b.colorEnd || COLOR_END})`;

              return (
                <div key={b.id || idx} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, background: "#F9FAFB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#7C3AED" }}>Banner #{idx + 1}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#4B5563" }}>
                        <input type="checkbox" checked={b.active !== false} onChange={(e) => updateBanner(idx, "active", e.target.checked)} />
                        Visible
                      </label>
                      <button
                        type="button"
                        aria-label={`Remove banner ${idx + 1}`}
                        onClick={() => setBanners((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#B91C1C", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
                    <Input label="Headline" value={b.title || ""} maxLength={80} onChange={(v) => updateBanner(idx, "title", v)} full />
                    <Input label="Subtitle" value={b.sub || ""} maxLength={160} onChange={(v) => updateBanner(idx, "sub", v)} full />
                    <Input label="Button label" value={b.ctaText || "Shop Now"} maxLength={24} onChange={(v) => updateBanner(idx, "ctaText", v)} />
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
                      Button destination
                      <select
                        value={b.link || "shop"}
                        onChange={(e) => updateBanner(idx, "link", e.target.value)}
                        style={{ display: "block", width: "100%", marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: "9px 10px", fontSize: 13, background: "white" }}
                      >
                        <option value="shop">Shop all</option>
                        <option value="category">Category</option>
                        <option value="about">About us</option>
                        <option value="contact">Contact</option>
                      </select>
                    </label>
                    {b.link === "category" && (
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
                        Category
                        <select
                          value={b.categoryId || ""}
                          onChange={(e) => updateBanner(idx, "categoryId", e.target.value)}
                          style={{ display: "block", width: "100%", marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: "9px 10px", fontSize: 13, background: "white" }}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                      </label>
                    )}
                    <Input label="Background image URL (optional, HTTPS)" value={b.imageUrl || ""} maxLength={500} onChange={(v) => updateBanner(idx, "imageUrl", v)} full />
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
                      Gradient start
                      <input type="color" value={b.colorStart || COLOR_START} onChange={(e) => updateBanner(idx, "colorStart", e.target.value)} style={{ display: "block", width: "100%", height: 38, marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: 4, background: "white" }} />
                    </label>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#666" }}>
                      Gradient end
                      <input type="color" value={b.colorEnd || COLOR_END} onChange={(e) => updateBanner(idx, "colorEnd", e.target.value)} style={{ display: "block", width: "100%", height: 38, marginTop: 4, border: "1px solid #ddd", borderRadius: 8, padding: 4, background: "white" }} />
                    </label>
                  </div>

                  <div style={{ marginTop: 12, height: 112, borderRadius: 9, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "white", background: previewBackground, overflow: "hidden" }}>
                    <div style={{ textShadow: "0 1px 3px rgba(0,0,0,.4)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>BLORA</div>
                      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 3 }}>{b.title || "Banner headline"}</div>
                      <div style={{ fontSize: 12, marginTop: 3 }}>{b.sub || "Banner subtitle"}</div>
                    </div>
                    <div style={{ flexShrink: 0, background: "white", color: "#111827", borderRadius: 999, padding: "8px 12px", fontSize: 11, fontWeight: 800 }}>{b.ctaText || "Shop Now"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
