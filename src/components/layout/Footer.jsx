import React from "react";
import { Instagram, MessageCircle, ShieldCheck, Heart } from "lucide-react";

export default function Footer({ goto, setAuthModal }) {
  return (
    <footer style={{ background: "#111827", color: "#9CA3AF", marginTop: 50, padding: "40px 14px 90px" }}>
      <div className="footer-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <img src="/blora-logo.png" alt="BLORA" style={{ width: 96, height: 70, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9CA3AF" }}>
            Trending & affordable jewellery, bags, stickers, accessories, and thoughtful gifts curated with love across India.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <a href="https://www.instagram.com/thetrioshop._/" target="_blank" rel="noreferrer" style={{ color: "#E5E7EB", background: "#1F2937", padding: 8, borderRadius: 8, display: "flex" }} title="Instagram"><Instagram size={17} /></a>
            <a href="https://wa.me/919729794568" target="_blank" rel="noreferrer" style={{ color: "#E5E7EB", background: "#1F2937", padding: 8, borderRadius: 8, display: "flex" }} title="WhatsApp Support"><MessageCircle size={17} /></a>
          </div>
        </div>

        <FooterCol
          title="Explore Catalog"
          links={[
            ["Shop All Products", "shop"],
            ["Jewellery Collection", "category", { categoryId: "jewellery" }],
            ["Bags & Totes", "category", { categoryId: "bags" }],
            ["Vinyl Sticker Packs", "category", { categoryId: "stickers" }],
            ["Gift Combos", "category", { categoryId: "giftitems" }],
          ]}
          goto={goto}
        />

        <FooterCol
          title="Customer Care"
          links={[
            ["Track My Orders", "orders"],
            ["My Account & Profile", "profile"],
            ["Wishlist", "wishlist"],
            ["About BLORA", "about"],
            ["Contact & Support", "contact"],
          ]}
          goto={goto}
        />

        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Trust & Security</div>
          <div style={{ fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.8 }}>
            <div>🔒 100% Secure SSL Checkout</div>
            <div>⚡ Fast dispatch on every order</div>
            <div>💳 Prepaid orders only • No returns or replacements</div>
            <div style={{ marginTop: 12 }}>
              <a
                onClick={() => setAuthModal("admin")}
                style={{ color: "#6B7280", fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}
              >
                Store Admin Portal
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: "#6B7280", marginTop: 32, borderTop: "1px solid #1F2937", paddingTop: 20 }}>
        © 2026 BLORA. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links, goto }) {
  return (
    <div>
      <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{title}</div>
      {links.map(([label, page, extra]) => (
        <a
          key={label}
          onClick={() => goto(page, extra || {})}
          style={{ display: "block", fontSize: 13, padding: "5px 0", cursor: "pointer", color: "#9CA3AF", transition: "color .15s" }}
          onMouseEnter={(e) => (e.target.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.target.style.color = "#9CA3AF")}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
