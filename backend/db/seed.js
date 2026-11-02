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

  // 1. Users — only admin seeded; real customers register via the sign-up form
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
  ];

  // Product catalog data is managed through the admin and must stay in persistent storage.
  const categories = db.find("categories");
  const products = db.find("products");

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
    { id: "b3", title: "STANDARD SHIPPING", sub: "Flat ₹100 shipping on every order", grad: "from-blue-600 via-indigo-600 to-violet-600", link: "shop", active: true },
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

  console.log("✅ Database seeded. Existing product and category data was preserved.");
}

if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase(true);
}
