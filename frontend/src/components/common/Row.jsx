import React from "react";

// A single label/value line used in price summaries (cart, checkout, orders).

export default function Row({ label, value, green, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? 14.5 : 13, fontWeight: bold ? 800 : 500, color: green ? "#16A34A" : "#333", padding: "4px 0" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

