import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// A labeled text input used across forms (checkout, profile, admin, auth).

export default function Input({ label, value, onChange, full, maxLength, type = "text", placeholder }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#666" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: isPassword ? "9px 38px 9px 10px" : "9px 10px",
            fontSize: 13,
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              top: "50%",
              right: 10,
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "#666",
              cursor: "pointer",
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
