import React, { useEffect } from "react";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { money } from "../lib/format";
import EmptyState from "../components/common/EmptyState";
import StatusPill from "../components/common/StatusPill";

export default function OrdersPage({ ctx }) {
  const { orders, goto, refreshOrders } = ctx;

  useEffect(() => {
    if (refreshOrders) refreshOrders();
  }, []);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={44} color="#7C3AED" />}
        title="No orders yet"
        sub="You haven't placed any orders with us yet. Explore our latest drops!"
        action={
          <button
            onClick={() => goto("shop")}
            style={{ marginTop: 14, background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", border: "none", padding: "11px 24px", borderRadius: 999, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ShoppingBag size={16} /> Start Shopping Now
          </button>
        }
      />
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: "16px auto", padding: "0 14px" }}>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 14, color: "#111827" }}>My Order History ({orders.length})</div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((o) => (
          <div
            key={o.id}
            onClick={() => goto("orderdetail", { orderId: o.id })}
            style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, padding: 16, cursor: "pointer", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,.02)", transition: "transform .15s, box-shadow .15s" }}
            className="order-card"
          >
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {o.items?.slice(0, 3).map((it, idx) => (
                <img
                  key={it.id || idx}
                  src={it.image}
                  alt=""
                  style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", border: "1px solid #E5E7EB" }}
                />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Order #{o.id}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {new Date(o.date || o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {o.items?.length || 1} item(s)
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.items?.map((it) => it.name).join(", ")}
              </div>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{money(o.total)}</div>
              <StatusPill status={o.status} />
            </div>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>
        ))}
      </div>
    </div>
  );
}
