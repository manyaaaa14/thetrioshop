// Small global CSS block (animations, scrollbar hiding, etc.) injected once via App.jsx.
// Could equally live in index.css — kept separate here for clarity/portability.

export const GLOBAL_CSS = `
  :root {
    --blora-background: #F6EFE5;
    --blora-blue: #245477;
    --blora-gold: #C6A46A;
    --blora-card: #FFFFFF;
    --blora-ink: #243746;
    --blora-muted: #6B7780;
    --blora-border: #E5DCCF;
  }
  * { box-sizing: border-box; }
  html, body, #root { width: 100%; min-height: 100%; margin: 0; }
  html { background: var(--blora-background); }
  body { overflow-x: hidden; background: var(--blora-background); color: var(--blora-ink); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  img, video, svg { display: block; max-width: 100%; height: auto; }
  .blora-app { background: var(--blora-background) !important; color: var(--blora-ink) !important; }
  .blora-app h1, .blora-app h2, .blora-app h3 { color: var(--blora-blue); }
  .blora-app [style*="#111827"] { color: var(--blora-blue) !important; }
  .blora-app [style*="#7C3AED"] { border-color: var(--blora-gold); }
  .blora-app footer { background: var(--blora-blue) !important; color: #FFFFFF !important; }
  .blora-app .brand-badge {
    background: linear-gradient(135deg, var(--blora-blue), var(--blora-gold)) !important;
  }
  .blora-app .social-banner {
    background: linear-gradient(120deg, var(--blora-blue), var(--blora-gold)) !important;
  }
  .blora-app button[style*="linear-gradient"] {
    background: var(--blora-blue) !important;
    color: var(--blora-card) !important;
  }
  .blora-app button[style*="background: #7C3AED"],
  .blora-app button[style*="background: \\"#7C3AED\\""] {
    background: var(--blora-blue) !important;
    color: var(--blora-card) !important;
  }
  .blora-app input:not([type="checkbox"]):not([type="radio"]),
  .blora-app textarea,
  .blora-app select {
    border-color: var(--blora-border);
    border-radius: 8px;
  }
  .blora-app input:focus, .blora-app textarea:focus, .blora-app select:focus {
    outline: 2px solid color-mix(in srgb, var(--blora-gold) 65%, transparent);
    outline-offset: 1px;
  }
  .product-card {
    background: var(--blora-card) !important;
    border-color: var(--blora-border) !important;
    border-radius: 14px !important;
    box-shadow: 0 3px 12px rgba(36, 84, 119, .06);
  }
  .product-card > div:first-child > img { object-fit: cover; }
  .category-rail > div { min-width: 82px; }
  .category-rail .cat-circle { background: color-mix(in srgb, var(--blora-gold) 20%, white) !important; }
  .footer-grid { color: #EAF0F3; }
  .footer-grid a:hover { color: var(--blora-gold) !important; }
  .fade-in { animation: fadeIn .35s ease both; }
  @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
  .heart-pop { animation: heartPop .4s ease; }
  @keyframes heartPop { 0%{transform:scale(1);} 40%{transform:scale(1.35);} 100%{transform:scale(1);} }
  .skel { background: linear-gradient(90deg,#eee 25%,#f5f5f5 37%,#eee 63%); background-size:400% 100%; animation: shimmer 1.4s infinite; }
  @keyframes shimmer { 0%{background-position:100% 50%} 100%{background-position:0 50%} }
  .scrollbar-none::-webkit-scrollbar{ display:none; }
  .ticker { animation: ticker 18s linear infinite; }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  button { cursor:pointer; font-family:inherit; }
  a { text-decoration:none; color:inherit; }

  @media (max-width: 820px) {
    .shop-layout { gap: 12px !important; }
    .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
    .product-card > div:first-child > img { height: 150px !important; }
    .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 22px 16px !important; }
  }

  @media (max-width: 600px) {
    .hero-banner { height: 190px !important; border-radius: 12px !important; }
    .hero-banner > div[style*="position: absolute"] { padding: 0 20px !important; }
    .hero-banner > div[style*="position: absolute"] > div > div:nth-child(2) { font-size: 24px !important; line-height: 1.15; }
    .hero-banner > div[style*="position: absolute"] > div > div:nth-child(3) { font-size: 13px !important; }
    .trust-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }
    .trust-grid > div { padding: 9px !important; font-size: 11px !important; }
    .category-rail { gap: 10px !important; }
    .category-rail > div { width: 78px !important; }
    .category-rail .cat-circle { width: 64px !important; height: 64px !important; font-size: 26px !important; }
    .social-banner { padding: 20px 18px !important; }
    .social-banner > div { width: 100%; }
    .social-banner > a { justify-content: center; }
    .product-card { border-radius: 11px !important; }
    .product-card > div:first-child > img { height: 138px !important; }
    .product-card > div:last-child { padding: 8px !important; }
    .product-card > div:last-child > div:first-child { font-size: 12px !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .footer-grid > div:first-child { grid-column: 1 / -1; }
    .cart-items > div { padding: 10px !important; }
    .cart-items img { width: 64px !important; height: 64px !important; flex-shrink: 0; }
    .checkout-shell { padding: 0 12px !important; gap: 14px !important; }
    .checkout-main > div, .checkout-summary > div { padding: 15px !important; }
    .checkout-summary > div { position: static !important; }
    .product-grid-detail { gap: 18px !important; }
  }

  @media (max-width: 380px) {
    .products-grid { gap: 8px !important; }
    .product-card > div:first-child > img { height: 120px !important; }
    .product-card > div:last-child > div:nth-child(2) { flex-wrap: wrap; }
    .trust-grid > div { align-items: flex-start !important; }
    .footer-grid { gap: 18px 10px !important; }
  }

  @media (max-width: 768px) {
    body { font-size: 14px; }
    main { width: 100%; overflow-x: clip; }
    input, button, textarea, select { font-size: 16px; }
  }
`;
