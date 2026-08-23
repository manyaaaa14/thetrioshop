// Small global CSS block (animations, scrollbar hiding, etc.) injected once via App.jsx.
// Could equally live in index.css — kept separate here for clarity/portability.

export const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  html, body, #root { width: 100%; min-height: 100%; margin: 0; }
  body { overflow-x: hidden; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  img, video, svg { display: block; max-width: 100%; height: auto; }
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

  @media (max-width: 768px) {
    body { font-size: 14px; }
    main { width: 100%; overflow-x: hidden; }
    section, div, article, header, footer { max-width: 100%; }
    input, button, textarea, select { font-size: 16px; }
  }
`;

