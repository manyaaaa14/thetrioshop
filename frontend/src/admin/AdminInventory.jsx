import React from "react";
import { money } from "../lib/format";
import { api } from "../services/api";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";

export default function AdminInventory({ ctx }) {
  const { products, setProducts, showToast, refreshCatalog } = ctx;

  async function adjustStock(id, newStock) {
    const safeStock = Math.max(0, newStock);
    try {
      const res = await api.products.updateStock(id, safeStock);
      if (res.product) {
        setProducts((prev) => prev.map((x) => (x.id === id ? res.product : x)));
        if (refreshCatalog) refreshCatalog();
      }
    } catch (err) {
      showToast(err.message || "Failed to update stock", "warn");
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Inventory & Stock Control</div>
        <div style={{ fontSize: 12.5, color: "#6B7280" }}>Adjust quantities in real-time — prevents customer overselling at checkout</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#F9FAFB", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
              {["Product", "Category", "Current Stock", "Stock Status", "Quick Adjust"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", fontWeight: 700, color: "#4B5563" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={p.images?.[0]} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", border: "1px solid #E5E7EB" }} />
                  <span style={{ fontWeight: 600, color: "#111827" }}>{p.name}</span>
                </td>
                <td style={{ padding: "12px 16px", textTransform: "capitalize", color: "#6B7280" }}>{p.category}</td>
                <td style={{ padding: "12px 16px", fontWeight: 800, color: "#111827", fontSize: 14 }}>{p.stock}</td>
                <td style={{ padding: "12px 16px" }}>
                  {p.stock === 0 ? (
                    <span style={{ color: "#DC2626", background: "#FEF2F2", padding: "3px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> Out of Stock
                    </span>
                  ) : p.stock < 10 ? (
                    <span style={{ color: "#D97706", background: "#FEF3C7", padding: "3px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> Low ({p.stock} left)
                    </span>
                  ) : (
                    <span style={{ color: "#16A34A", background: "#DCFCE7", padding: "3px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={12} /> In Stock
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => adjustStock(p.id, p.stock - 1)}
                      style={{ border: "1px solid #D1D5DB", background: "white", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: 700 }}
                    >
                      -
                    </button>
                    <button
                      onClick={() => adjustStock(p.id, p.stock + 1)}
                      style={{ border: "1px solid #D1D5DB", background: "white", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        adjustStock(p.id, p.stock + 20);
                        showToast(`Restocked +20 units for "${p.name}"`, "check");
                      }}
                      style={{ border: "1px solid #C4B5FD", color: "#7C3AED", background: "#F5F3FF", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Restock +20
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
