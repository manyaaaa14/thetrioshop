import React from "react";
import { ShoppingCart, Heart, AlertTriangle, Check } from "lucide-react";

// Small bottom-of-screen confirmation message ("Added to cart", etc.).

export default function Toast({ toast }) {
  const icons = { cart: <ShoppingCart size={15} />, heart: <Heart size={15} />, warn: <AlertTriangle size={15} />, check: <Check size={15} /> };
  return (
    <div className="fade-in" style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", background: "#1A1A1A", color: "white", padding: "10px 18px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 200 }}>
      {icons[toast.icon]} {toast.msg}
    </div>
  );
}

