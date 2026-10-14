import React from "react";
import { Instagram, MessageCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: "20px auto", padding: "0 14px" }}>
      <div style={{ borderRadius: 16, background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "white", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 26 }}>Our Story</div>
        <div style={{ fontSize: 14, marginTop: 8, opacity: .95 }}>A dream built with love, passion, and courage.</div>
      </div>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8, marginTop: 20 }}>
        Every big dream begins with a small step, and BLORA is a dream built with love, passion, and courage. 💗✨
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        What started as a small idea to bring trendy, beautiful, and affordable products to everyone is becoming something more than just a shop. From jewellery and press-on nails to cute accessories and more, BLORA is here to make your everyday moments feel a little more special. 🎀
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        Behind BLORA is a dreamer who believes that style shouldn’t be expensive and that everyone deserves to express themselves in their own way. Every order, every follow, and every bit of support means the world to us. 🫶🏻
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        We’re not just building a brand; we’re building a family where every customer becomes a part of our journey.
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        BLORA is more than a name. It’s a dream in the making. 🌷
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        And this is only the beginning… 💌
      </p>
      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
        Thank you for being a part of our story. 🤍
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 20 }}>
        {[["10K+","Happy Customers"],["500+","Products Shipped Weekly"],["4.4★","Average Rating"]].map(([n,l]) => (
          <div key={l} style={{ background: "white", borderRadius: 12, border: "1px solid #eee", padding: 16, textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#7C3AED" }}>{n}</div>
            <div style={{ fontSize: 11.5, color: "#888", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center" }}>
        <a href="https://www.instagram.com/_thetrioshop?igsh=NmQ5MGxxMzkwMHB6&utm_source=qr" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8F5FF", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#7C3AED" }}><Instagram size={15} /> Instagram</a>
        <a href="https://wa.me/919729794568" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FDF4", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#16A34A" }}><MessageCircle size={15} /> WhatsApp</a>
      </div>
    </div>
  );
}
