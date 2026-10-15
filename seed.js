import bcrypt from "bcryptjs";
import { db } from "./db.js";

export async function seedDatabase(force = false) {
  const existingUsers = db.find("users");
  if (existingUsers.length > 0 && !force) {
    console.log("Database already seeded. Skipping initial seed.");
    return;
  }

  console.log("Seeding database with default e-commerce data...");

  // Password hashes
  const adminPasswordHash = await bcrypt.hash("tri09090", 10);
  const userPasswordHash = await bcrypt.hash("user123", 10);

  // 1. Users
  const users = [
    {
      id: "usr_admin",
      name: "Trio Admin",
      email: "admin97297@gmail.com",
      password: adminPasswordHash,
      role: "admin",
      phone: "9729794568",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr_demo",
      name: "Aarav Sharma",
      email: "user@trioshop.in",
      password: userPasswordHash,
      role: "user",
      phone: "9876543210",
      address: {
        address: "Flat 402, Lotus Towers, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr_priya",
      name: "Priya Patel",
      email: "priya@gmail.com",
      password: userPasswordHash,
      role: "user",
      phone: "9823456789",
      address: {
        address: "12/A, Navrangpura",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380009",
      },
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    }
  ];

  // 2. Categories
  const categories = [
    { id: "jewellery", name: "Jewellery", emoji: "💍", color: "#F3E8FF", order: 1 },
    { id: "accessories", name: "Accessories", emoji: "👜", color: "#FCE7F3", order: 2 },
    { id: "stickers", name: "Stickers", emoji: "✨", color: "#FEF3C7", order: 3 },
    { id: "bags", name: "Bags", emoji: "🎒", color: "#DBEAFE", order: 4 },
    { id: "giftitems", name: "Gift Items", emoji: "🎁", color: "#DCFCE7", order: 5 },
    { id: "newarrivals", name: "New Arrivals", emoji: "🆕", color: "#FFE4E6", order: 6 },
  ];

  // 3. Products
  const products = [
    {
      id: "p1",
      name: "Oxidised Silver Jhumka Earrings",
      category: "jewellery",
      price: 349,
      mrp: 899,
      rating: 4.3,
      ratingCount: 2140,
      stock: 24,
      badges: ["bestseller"],
      images: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600"
      ],
      desc: "Handcrafted oxidised silver jhumkas with intricate tribal detailing. Lightweight and skin-friendly, perfect for festive wear.",
      variants: { size: [], color: ["Silver", "Antique Gold"] },
      hidden: false,
    },
    {
      id: "p2",
      name: "Kundan Choker Necklace Set",
      category: "jewellery",
      price: 799,
      mrp: 1999,
      rating: 4.5,
      ratingCount: 876,
      stock: 8,
      badges: ["sale"],
      images: [
        "https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=600"
      ],
      desc: "Traditional kundan choker set with matching earrings, studded with faux pearls. Ideal for weddings and festive occasions.",
      variants: { size: [], color: ["Gold", "Rose Gold"] },
      hidden: false,
    },
    {
      id: "p3",
      name: "Layered Boho Anklet (Pair)",
      category: "jewellery",
      price: 199,
      mrp: 449,
      rating: 4.1,
      ratingCount: 431,
      stock: 12,
      badges: [],
      images: [
        "https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?w=600"
      ],
      desc: "Boho-style layered anklet pair with tiny bells. Adjustable chain, adds a playful touch to any outfit.",
      variants: { size: [], color: ["Silver"] },
      hidden: false,
    },
    {
      id: "p4",
      name: "Pearl Drop Stud Earrings",
      category: "jewellery",
      price: 249,
      mrp: 599,
      rating: 4.6,
      ratingCount: 1520,
      stock: 40,
      badges: ["new"],
      images: [
        "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600"
      ],
      desc: "Minimal pearl drop studs for everyday elegance. Hypoallergenic posts, safe for sensitive ears.",
      variants: { size: [], color: ["White", "Pink"] },
      hidden: false,
    },
    {
      id: "p5",
      name: "Tote Bag - Canvas Everyday",
      category: "bags",
      price: 449,
      mrp: 999,
      rating: 4.4,
      ratingCount: 632,
      stock: 15,
      badges: ["bestseller"],
      images: [
        "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600"
      ],
      desc: "Durable canvas tote with reinforced handles and inner pocket. Roomy enough for daily essentials.",
      variants: { size: [], color: ["Beige", "Black", "Olive"] },
      hidden: false,
    },
    {
      id: "p6",
      name: "Mini Sling Bag - Vegan Leather",
      category: "bags",
      price: 599,
      mrp: 1299,
      rating: 4.2,
      ratingCount: 298,
      stock: 7,
      badges: ["sale"],
      images: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"
      ],
      desc: "Compact vegan leather sling bag with adjustable strap and secure zip closure.",
      variants: { size: [], color: ["Tan", "Black"] },
      hidden: false,
    },
    {
      id: "p7",
      name: "Aesthetic Laptop Sticker Pack (50pc)",
      category: "stickers",
      price: 99,
      mrp: 249,
      rating: 4.7,
      ratingCount: 3210,
      stock: 120,
      badges: ["bestseller", "new"],
      images: [
        "https://images.unsplash.com/photo-1611931397228-de8b5abfe20d?w=600"
      ],
      desc: "Waterproof vinyl sticker pack, 50 unique aesthetic designs. Perfect for laptops, bottles and diaries.",
      variants: { size: [], color: [] },
      hidden: false,
    },
    {
      id: "p8",
      name: "Motivational Quote Sticker Sheet",
      category: "stickers",
      price: 79,
      mrp: 149,
      rating: 4.3,
      ratingCount: 540,
      stock: 60,
      badges: [],
      images: [
        "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600"
      ],
      desc: "Matte-finish quote stickers to brighten up your workspace and notebooks.",
      variants: { size: [], color: [] },
      hidden: false,
    },
    {
      id: "p9",
      name: "Chunky Resin Hair Clip Set",
      category: "accessories",
      price: 179,
      mrp: 399,
      rating: 4.0,
      ratingCount: 210,
      stock: 32,
      badges: ["new"],
      images: [
        "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600"
      ],
      desc: "Set of 3 chunky resin hair clips in trending colours, strong grip for all hair types.",
      variants: { size: [], color: ["Multi"] },
      hidden: false,
    },
    {
      id: "p10",
      name: "Beaded Phone Charm Strap",
      category: "accessories",
      price: 129,
      mrp: 299,
      rating: 4.4,
      ratingCount: 388,
      stock: 50,
      badges: ["sale"],
      images: [
        "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600"
      ],
      desc: "Trendy beaded wrist strap for your phone, easy to attach via lanyard hole or case loop.",
      variants: { size: [], color: ["Pastel Mix", "Bright Mix"] },
      hidden: false,
    },
    {
      id: "p11",
      name: "Scented Candle Gift Box",
      category: "giftitems",
      price: 349,
      mrp: 699,
      rating: 4.6,
      ratingCount: 460,
      stock: 18,
      badges: ["bestseller"],
      images: [
        "https://images.unsplash.com/photo-1602874801007-bd36c9291b76?w=600"
      ],
      desc: "Set of 3 soy wax scented candles in a gift-ready box. Long-lasting fragrance, perfect gifting choice.",
      variants: { size: [], color: [] },
      hidden: false,
    },
    {
      id: "p12",
      name: "Personalised Photo Keychain",
      category: "giftitems",
      price: 149,
      mrp: 299,
      rating: 4.2,
      ratingCount: 175,
      stock: 25,
      badges: ["new"],
      images: [
        "https://images.unsplash.com/photo-1607344645866-009c320c00d4?w=600"
      ],
      desc: "Customisable acrylic keychain with your favourite photo. A small, thoughtful gift.",
      variants: { size: [], color: [] },
      hidden: false,
    },
  ];

  // 4. Coupons
  const coupons = [
    { id: "c1", code: "TRIO50", type: "flat", value: 50, minOrder: 300, maxDiscount: 50, active: true },
    { id: "c2", code: "TRIO10", type: "pct", value: 10, minOrder: 500, maxDiscount: 200, active: true },
    { id: "c3", code: "FLAT100", type: "flat", value: 100, minOrder: 800, maxDiscount: 100, active: true },
    { id: "c4", code: "FESTIVE20", type: "pct", value: 20, minOrder: 999, maxDiscount: 400, active: true },
  ];

  // 5. Banners
  const banners = [
    { id: "b1", title: "TRIO DAYS SALE", sub: "Up to 70% off jewellery & bags", grad: "from-violet-600 via-fuchsia-600 to-pink-500", link: "shop", active: true },
    { id: "b2", title: "NEW ARRIVALS", sub: "Fresh drops every Friday", grad: "from-amber-500 via-orange-500 to-rose-500", link: "category", categoryId: "newarrivals", active: true },
    { id: "b3", title: "FREE SHIPPING", sub: "On orders above ₹499", grad: "from-blue-600 via-indigo-600 to-violet-600", link: "shop", active: true },
  ];

  // 6. Reviews
  const reviews = [
    { id: "rev_1", productId: "p1", userName: "Riya Sen", rating: 5, comment: "Loved the oxidised finish! Very lightweight and looks gorgeous with ethnic wear.", date: "2 days ago", verified: true, status: "approved" },
    { id: "rev_2", productId: "p1", userName: "Sneha Reddy", rating: 4, comment: "Super cute earrings. Got many compliments at the college fest.", date: "1 week ago", verified: true, status: "approved" },
    { id: "rev_3", productId: "p2", userName: "Ananya Deshmukh", rating: 5, comment: "The kundan shine is incredible. Packaging was very premium!", date: "3 days ago", verified: true, status: "approved" },
    { id: "rev_4", productId: "p5", userName: "Kavita Rao", rating: 5, comment: "Best canvas tote for daily college use. Fits my 14-inch laptop and bottle easily.", date: "2 weeks ago", verified: true, status: "approved" },
    { id: "rev_5", productId: "p7", userName: "Dev Sharma", rating: 5, comment: "50 aesthetic vinyl stickers at this price is a steal! Waterproof and sticks strongly.", date: "4 days ago", verified: true, status: "approved" },
  ];

  // 7. Demo Orders
  const orders = [
    {
      id: "TRIO849201",
      userId: "usr_demo",
      userEmail: "user@trioshop.in",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        { id: "p1", name: "Oxidised Silver Jhumka Earrings", price: 349, qty: 1, color: "Silver", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600" },
        { id: "p7", name: "Aesthetic Laptop Sticker Pack (50pc)", price: 99, qty: 2, color: null, image: "https://images.unsplash.com/photo-1611931397228-de8b5abfe20d?w=600" }
      ],
      subtotal: 547,
      discount: 50,
      delivery: 0,
      total: 497,
      status: "Shipped",
      payment: "cod",
      address: {
        name: "Aarav Sharma",
        phone: "9876543210",
        email: "user@trioshop.in",
        address: "Flat 402, Lotus Towers, MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001"
      },
      cancelled: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "TRIO924150",
      userId: "usr_priya",
      userEmail: "priya@gmail.com",
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
      items: [
        { id: "p2", name: "Kundan Choker Necklace Set", price: 799, qty: 1, color: "Gold", image: "https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=600" }
      ],
      subtotal: 799,
      discount: 79,
      delivery: 0,
      total: 720,
      status: "Delivered",
      payment: "upi",
      address: {
        name: "Priya Patel",
        phone: "9823456789",
        email: "priya@gmail.com",
        address: "12/A, Navrangpura",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380009"
      },
      cancelled: false,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    }
  ];

  db.data.users = users;
  db.data.categories = categories;
  db.data.products = products;
  db.data.coupons = coupons;
  db.data.banners = banners;
  db.data.reviews = reviews;
  db.data.orders = orders;
  db.persist();

  console.log("✅ Database successfully seeded with full sample data!");
}

if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase(true);
}
