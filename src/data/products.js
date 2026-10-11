// Demo catalog data for BLORA.
// Swap this file for real API calls once you connect a backend/database.

export const CATEGORIES = [
  { id: "jewellery", name: "Jewellery", emoji: "💍", color: "#F3E8FF" },
  { id: "accessories", name: "Accessories", emoji: "👜", color: "#FCE7F3" },
  { id: "stickers", name: "Stickers", emoji: "✨", color: "#FEF3C7" },
  { id: "bags", name: "Bags", emoji: "🎒", color: "#DBEAFE" },
  { id: "giftitems", name: "Gift Items", emoji: "🎁", color: "#DCFCE7" },
  { id: "newarrivals", name: "New Arrivals", emoji: "🆕", color: "#FFE4E6" },
];

export const PRODUCTS = [
  { id: "p1", name: "Oxidised Silver Jhumka Earrings", category: "jewellery", price: 349, mrp: 899, rating: 4.3, ratingCount: 2140, stock: 24, badges: ["bestseller"], images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"], desc: "Handcrafted oxidised silver jhumkas with intricate tribal detailing. Lightweight and skin-friendly, perfect for festive wear.", variants: { size: [], color: ["Silver", "Antique Gold"] } },
  { id: "p2", name: "Kundan Choker Necklace Set", category: "jewellery", price: 799, mrp: 1999, rating: 4.5, ratingCount: 876, stock: 8, badges: ["sale"], images: ["https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=600"], desc: "Traditional kundan choker set with matching earrings, studded with faux pearls. Ideal for weddings and festive occasions.", variants: { size: [], color: ["Gold", "Rose Gold"] } },
  { id: "p3", name: "Layered Boho Anklet (Pair)", category: "jewellery", price: 199, mrp: 449, rating: 4.1, ratingCount: 431, stock: 0, badges: [], images: ["https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?w=600"], desc: "Boho-style layered anklet pair with tiny bells. Adjustable chain, adds a playful touch to any outfit.", variants: { size: [], color: ["Silver"] } },
  { id: "p4", name: "Pearl Drop Stud Earrings", category: "jewellery", price: 249, mrp: 599, rating: 4.6, ratingCount: 1520, stock: 40, badges: ["new"], images: ["https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600"], desc: "Minimal pearl drop studs for everyday elegance. Hypoallergenic posts, safe for sensitive ears.", variants: { size: [], color: ["White", "Pink"] } },
  { id: "p5", name: "Tote Bag - Canvas Everyday", category: "bags", price: 449, mrp: 999, rating: 4.4, ratingCount: 632, stock: 15, badges: ["bestseller"], images: ["https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600"], desc: "Durable canvas tote with reinforced handles and inner pocket. Roomy enough for daily essentials.", variants: { size: [], color: ["Beige", "Black", "Olive"] } },
  { id: "p6", name: "Mini Sling Bag - Vegan Leather", category: "bags", price: 599, mrp: 1299, rating: 4.2, ratingCount: 298, stock: 3, badges: ["sale"], images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"], desc: "Compact vegan leather sling bag with adjustable strap and secure zip closure.", variants: { size: [], color: ["Tan", "Black"] } },
  { id: "p7", name: "Aesthetic Laptop Sticker Pack (50pc)", category: "stickers", price: 99, mrp: 249, rating: 4.7, ratingCount: 3210, stock: 120, badges: ["bestseller", "new"], images: ["https://images.unsplash.com/photo-1611931397228-de8b5abfe20d?w=600"], desc: "Waterproof vinyl sticker pack, 50 unique aesthetic designs. Perfect for laptops, bottles and diaries.", variants: { size: [], color: [] } },
  { id: "p8", name: "Motivational Quote Sticker Sheet", category: "stickers", price: 79, mrp: 149, rating: 4.3, ratingCount: 540, stock: 60, badges: [], images: ["https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600"], desc: "Matte-finish quote stickers to brighten up your workspace and notebooks.", variants: { size: [], color: [] } },
  { id: "p9", name: "Chunky Resin Hair Clip Set", category: "accessories", price: 179, mrp: 399, rating: 4.0, ratingCount: 210, stock: 32, badges: ["new"], images: ["https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600"], desc: "Set of 3 chunky resin hair clips in trending colours, strong grip for all hair types.", variants: { size: [], color: ["Multi"] } },
  { id: "p10", name: "Beaded Phone Charm Strap", category: "accessories", price: 129, mrp: 299, rating: 4.4, ratingCount: 388, stock: 50, badges: ["sale"], images: ["https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600"], desc: "Trendy beaded wrist strap for your phone, easy to attach via lanyard hole or case loop.", variants: { size: [], color: ["Pastel Mix", "Bright Mix"] } },
  { id: "p11", name: "Scented Candle Gift Box", category: "giftitems", price: 349, mrp: 699, rating: 4.6, ratingCount: 460, stock: 18, badges: ["bestseller"], images: ["https://images.unsplash.com/photo-1602874801007-bd36c9291b76?w=600"], desc: "Set of 3 soy wax scented candles in a gift-ready box. Long-lasting fragrance, perfect gifting choice.", variants: { size: [], color: [] } },
  { id: "p12", name: "Personalised Photo Keychain", category: "giftitems", price: 149, mrp: 299, rating: 4.2, ratingCount: 175, stock: 25, badges: ["new"], images: ["https://images.unsplash.com/photo-1607344645866-009c320c00d4?w=600"], desc: "Customisable acrylic keychain with your favourite photo. A small, thoughtful gift.", variants: { size: [], color: [] } },
];

export const BANNERS = [
  { id: 1, title: "TRIO DAYS SALE", sub: "Up to 70% off jewellery & bags", grad: "from-violet-600 via-fuchsia-600 to-pink-500" },
  { id: 2, title: "NEW ARRIVALS", sub: "Fresh drops every Friday", grad: "from-amber-500 via-orange-500 to-rose-500" },
  { id: 3, title: "STANDARD SHIPPING", sub: "Flat ₹100 shipping on every order", grad: "from-blue-600 via-indigo-600 to-violet-600" },
];

export const DEFAULT_ANNOUNCEMENT = {
  message: "✨ BLORA — Thoughtful finds at budget-friendly prices • 🚚 Standard shipping ₹100",
  enabled: true,
  backgroundColor: "#245477",
  textColor: "#FFFFFF",
  scrollDuration: 24,
};

export const STANDARD_SHIPPING_COST = 100;
