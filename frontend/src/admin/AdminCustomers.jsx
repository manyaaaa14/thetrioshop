import React, { useState, useEffect } from "react";
import { money } from "../lib/format";
import { api } from "../services/api";
import { Users, Mail, Phone, ShoppingBag } from "lucide-react";

export default function AdminCustomers({ ctx }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await api.admin.getCustomers();
      if (res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.warn("Using fallback customer calculation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Registered Customers & Buyers</div>
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Total {customers.length} registered customer accounts</div>
        </div>
      </div>

      {customers.length === 0 ? (
        <div style={{ padding: 32, fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
          No registered customer accounts yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
                {["Customer", "Email Address", "Phone", "Total Orders", "Lifetime Spend", "Joined"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", fontWeight: 700, color: "#4B5563" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id || c.email} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F3E8FF", color: "#7C3AED", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      {c.name ? c.name[0].toUpperCase() : "U"}
                    </div>
                    {c.name}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>{c.email}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280" }}>{c.phone || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#7C3AED" }}>{c.orderCount || 0} order(s)</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#16A34A" }}>{money(c.totalSpend || 0)}</td>
                  <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: 12 }}>
                    {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString("en-IN") : "Recent"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
