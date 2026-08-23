import React from "react";

export default function SectionHeader({ title, sub }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 19 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: "#888" }}>{sub}</div>}
      </div>
    </div>
  );
}
