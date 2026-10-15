import React, { useState, useEffect } from "react";
import { Trash2, Plus, Tag, Percent } from "lucide-react";
import { api } from "../services/api";

export default function AdminCoupons({ ctx }) {
  const [coupons, setCoupons] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("flat");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      const res = await api.coupons.getAll();
      if (res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Unable to load coupons", "warn");
    }
  }

  async function handleAddCoupon(e) {
    e.preventDefault();
    if (!code.trim() || !value) return;

    setLoading(true);
    try {
      const res = await api.coupons.create({
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      });

      if (res.coupon) {
        setCoupons((prev) => [res.coupon, ...prev]);
        setCode("");
        setValue("");
        setMinOrder("");
        setMaxDiscount("");
        setShowAdd(false);
        if (ctx?.showToast) ctx.showToast(`Coupon ${res.coupon.code} created! 🎟️`, "check");
      }
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Failed to create coupon", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCoupon(id) {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.coupons.remove(id);
      setCoupons((prev) => prev.filter((x) => x.id !== id));
      if (ctx?.showToast) ctx.showToast("Coupon deleted", "check");
    } catch (err) {
      if (ctx?.showToast) ctx.showToast(err.message || "Failed to delete coupon", "warn");
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Promotional Discount Coupons</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Manage promo codes verified directly at customer checkout</div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <Plus size={15} /> Create Coupon
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddCoupon} style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", padding: 16, borderRadius: 10, marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#6B21A8" }}>New Coupon Configuration</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>Coupon Code*</div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MEGA20"
                style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 13, textTransform: "uppercase" }}
                required
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>Type*</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "white" }}
              >
                <option value="flat">Flat Amount (₹)</option>
                <option value="pct">Percentage (%)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>Discount Value*</div>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
                placeholder={type === "flat" ? "e.g. 100" : "e.g. 15"}
                style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
                required
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>Min. Cart Total (₹)</div>
              <input
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 500"
                style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
              />
            </div>
            {type === "pct" && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 3 }}>Maximum Discount (₹)</div>
                <input
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value.replace(/\D/g, ""))}
                  placeholder="Optional cap"
                  style={{ width: "100%", border: "1px solid #D1D5DB", borderRadius: 6, padding: "8px 10px", fontSize: 13 }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setShowAdd(false)} style={{ background: "#F3F4F6", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: "#7C3AED", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
              {loading ? "Creating…" : "Publish Coupon"}
            </button>
          </div>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F9FAFB", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
            {["Coupon Code", "Discount Type", "Value", "Min Order", "Status", "Actions"].map((h) => (
              <th key={h} style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id || c.code} style={{ borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "12px 12px", fontWeight: 700, color: "#7C3AED", display: "flex", alignItems: "center", gap: 6 }}>
                <Tag size={14} /> {c.code}
              </td>
              <td style={{ padding: "12px 12px", textTransform: "capitalize", color: "#4B5563" }}>
                {c.type === "flat" ? "Flat Amount" : "Percentage Off"}
              </td>
              <td style={{ padding: "12px 12px", fontWeight: 700, color: "#16A34A" }}>
                {c.type === "flat" ? `₹${c.value}` : `${c.value}%`}
              </td>
              <td style={{ padding: "12px 12px", color: "#6B7280" }}>
                {c.minOrder ? `₹${c.minOrder}` : "No minimum"}
              </td>
              <td style={{ padding: "12px 12px" }}>
                <span style={{ color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Active</span>
              </td>
              <td style={{ padding: "12px 12px" }}>
                <button
                  onClick={() => handleDeleteCoupon(c.id)}
                  style={{ border: "none", background: "none", color: "#DC2626", cursor: "pointer" }}
                  title="Delete Coupon"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
