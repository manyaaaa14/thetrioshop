import React from "react";

// Friendly placeholder shown for empty carts, empty search results, etc.

export default function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
      <div style={{ color: "#ccc", marginBottom: 10, display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#555" }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>
      {action}
    </div>
  );
}

