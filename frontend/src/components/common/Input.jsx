import React from "react";

// A labeled text input used across forms (checkout, profile, admin, auth).

export default function Input({ label, value, onChange, full, maxLength }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#666" }}>{label}</div>
      <input value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "9px 10px", fontSize: 13 }} />
    </div>
  );
}

