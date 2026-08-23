import React from "react";
import { MessageCircle } from "lucide-react";

// Floating WhatsApp contact button, shown on every page.
// Update the phone number below (or wire it to the admin-managed content settings).

export default function WhatsAppFloat() {
  return (
    <a href="https://wa.me/919729794568" target="_blank" rel="noreferrer" style={{ position: "fixed", bottom: 18, right: 18, width: 52, height: 52, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(0,0,0,.25)", zIndex: 60 }}>
      <MessageCircle size={26} color="white" fill="white" />
    </a>
  );
}
