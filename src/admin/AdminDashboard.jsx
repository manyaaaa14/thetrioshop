import React, { useState, useEffect } from "react";
import { TrendingUp, ClipboardList, Boxes, AlertTriangle, Users, RefreshCw } from "lucide-react";
import { money } from "../lib/format";
import StatusPill from "../components/common/StatusPill";
import { api } from "../services/api";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", flex: 1, minWidth: 160, boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: "#111827" }}>{value}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ ctx }) {
  const { products, orders, goto } = ctx;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await api.admin.getStats();
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn("Using local stats fallback");
    } finally {
      setLoading(false);
    }
  }

  const totalSales = stats ? stats.totalSales : orders.filter((order) => !order.cancelled && order.paymentStatus === "Paid").reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = stats ? stats.totalOrders : orders.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
  const bestsellers = stats?.topProducts?.length ? stats.topProducts : [...products].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 5);
  const customerCount = stats?.customerCount || 2;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#6B7280" }}>Real-time business performance and catalog overview</div>
        <button
          onClick={fetchStats}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #D1D5DB", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total Revenue" value={money(totalSales)} icon={TrendingUp} color="#16A34A" />
        <StatCard label="Total Orders" value={totalOrders} icon={ClipboardList} color="#7C3AED" />
        <StatCard label="Active Customers" value={customerCount} icon={Users} color="#0284C7" />
        <StatCard label="Catalog Products" value={products.length} icon={Boxes} color="#6366F1" />
        <StatCard label="Low/Out of Stock" value={lowStock + outOfStock} icon={AlertTriangle} color="#EA580C" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="admin-grid">
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111827" }}>Weekly Sales Velocity</div>
          <MiniBarChart data={[45, 60, 40, 85, 70, 95, 80]} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} />
        </div>
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111827" }}>Top Performing Products</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bestsellers.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <img src={p.images?.[0]} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }} />
                <div style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>{money(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #E5E7EB", padding: 18, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Recent Store Orders</div>
          <a onClick={() => goto("admin-orders")} style={{ fontSize: 12, color: "#7C3AED", fontWeight: 700, cursor: "pointer" }}>View all orders →</a>
        </div>
        {orders.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9CA3AF", padding: "16px 0", textAlign: "center" }}>No orders placed yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#F9FAFB", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
                  <th style={{ padding: "8px 10px", color: "#6B7280" }}>Order ID</th>
                  <th style={{ padding: "8px 10px", color: "#6B7280" }}>Customer</th>
                  <th style={{ padding: "8px 10px", color: "#6B7280" }}>Items</th>
                  <th style={{ padding: "8px 10px", color: "#6B7280" }}>Total</th>
                  <th style={{ padding: "8px 10px", color: "#6B7280" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "10px 10px", fontWeight: 700, color: "#7C3AED" }}>{o.id}</td>
                    <td style={{ padding: "10px 10px" }}>{o.address?.name || o.userEmail || "Guest"}</td>
                    <td style={{ padding: "10px 10px" }}>{o.items?.length || 1} item(s)</td>
                    <td style={{ padding: "10px 10px", fontWeight: 700 }}>{money(o.total)}</td>
                    <td style={{ padding: "10px 10px" }}><StatusPill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@media (max-width:820px){ .admin-grid{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

function MiniBarChart({ data, labels }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 110, display: "flex", alignItems: "flex-end" }}>
            <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: "linear-gradient(180deg,#A78BFA,#7C3AED)", borderRadius: "6px 6px 0 0", transition: "height .3s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
