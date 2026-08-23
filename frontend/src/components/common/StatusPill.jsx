import React from "react";

// Small colored pill showing an order's current status.

export default function StatusPill({ status }) {
  const colors = { Pending: "#F59E0B", Confirmed: "#3B82F6", Processing: "#8B5CF6", Shipped: "#6366F1", "Out for Delivery": "#EC4899", Delivered: "#16A34A", Cancelled: "#DC2626" };
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: colors[status] || "#666", background: (colors[status] || "#666") + "20", padding: "2px 8px", borderRadius: 999 }}>{status}</span>;
}
