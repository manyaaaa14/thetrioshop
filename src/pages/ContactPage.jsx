import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import Input from "../components/common/Input";

export default function ContactPage({ ctx }) {
  const { showToast } = ctx;
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "20px auto", padding: "0 14px" }}>
      <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Get in Touch</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>We usually reply within a few hours</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <a href="https://wa.me/919729794568" target="Hiii" rel="noreferrer" style={{ flex: 1, minWidth: 140, background: "#F0FDF4", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#16A34A" }}><MessageCircle size={17} /> WhatsApp Us</a>
        <a href="mailto:manyataneja53@gmail.com" style={{ flex: 1, minWidth: 140, background: "#EFF6FF", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#2563EB" }}>✉️ hello@thetrioshop.in</a>
      </div>
      <div style={{ fontSize: 12.5, color: "#7C2D12", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 10px", marginBottom: 14, fontWeight: 600 }}>
        Prepaid orders only. No returns or replacements. Payment number: 9729794568.
      </div>
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #eee", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <Input label="Your Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} full />
        <Input label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} full />
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#666" }}>Message</div>
          <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4} style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <button onClick={() => { showToast("Message sent!", "check"); setForm({ name: "", email: "", message: "" }); }} style={{ background: "linear-gradient(90deg,#7C3AED,#DB2777)", color: "white", border: "none", padding: "10px 0", borderRadius: 8, fontWeight: 700, fontSize: 13.5 }}>Send Message</button>
      </div>
    </div>
  );
}

