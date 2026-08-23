import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/admin/stats - Admin Dashboard Analytics
router.get("/stats", protectAdmin, (req, res) => {
  try {
    const orders = db.find("orders");
    const products = db.find("products");
    const users = db.find("users", (u) => u.role !== "admin");

    const nonCancelledOrders = orders.filter((o) => !o.cancelled && o.status !== "Cancelled");

    // Total sales & orders
    const totalSales = nonCancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const customerCount = users.length;

    // Low stock products (< 10 stock)
    const lowStock = products.filter((p) => p.stock < 10);

    // Top selling products based on completed orders
    const productSalesMap = {};
    for (const order of nonCancelledOrders) {
      for (const it of order.items || []) {
        productSalesMap[it.id] = (productSalesMap[it.id] || 0) + (it.qty || 1);
      }
    }

    const topProducts = products
      .map((p) => ({
        ...p,
        unitsSold: productSalesMap[p.id] || 0,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // Recent orders
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalSales,
        totalOrders,
        customerCount,
        productCount: products.length,
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock,
        topProducts,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/customers - All customers with order stats
router.get("/customers", protectAdmin, (req, res) => {
  try {
    const users = db.find("users", (u) => u.role !== "admin");
    const orders = db.find("orders");

    const customerList = users.map((u) => {
      const userOrders = orders.filter((o) => o.userId === u.id || o.userEmail?.toLowerCase() === u.email.toLowerCase());
      const totalSpend = userOrders
        .filter((o) => !o.cancelled)
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        orderCount: userOrders.length,
        totalSpend,
        joinedAt: u.createdAt,
      };
    });

    res.json({ success: true, count: customerList.length, customers: customerList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/banners - Get homepage banners
router.get("/banners", (req, res) => {
  try {
    const banners = db.find("banners", (b) => b.active !== false);
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/banners - Update homepage banners (Admin)
router.put("/banners", protectAdmin, (req, res) => {
  try {
    const { banners } = req.body;
    if (Array.isArray(banners)) {
      db.data.banners = banners;
      db.persist();
    }
    res.json({ success: true, banners: db.data.banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
