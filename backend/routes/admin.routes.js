import express from "express";
import { db } from "../db/db.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

class BannerInputError extends Error {}

const DEFAULT_ANNOUNCEMENT = {
  message: "✨ BLORA — Thoughtful finds at budget-friendly prices • 🚚 Standard shipping ₹100",
  enabled: true,
  backgroundColor: "#245477",
  textColor: "#FFFFFF",
  scrollDuration: 24,
};

// GET /api/admin/stats - Admin Dashboard Analytics
router.get("/stats", protectAdmin, (req, res) => {
  try {
    const orders = db.find("orders");
    const products = db.find("products");
    const users = db.find("users", (u) => u.role !== "admin");

    const nonCancelledOrders = orders.filter((o) => !o.cancelled && o.status !== "Cancelled");

    // Total sales & orders
    const totalSales = nonCancelledOrders
      .filter((order) => order.paymentStatus === "Paid")
      .reduce((sum, order) => sum + (order.total || 0), 0);
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

// GET /api/admin/banners/manage - Admin banner editor, including inactive banners
router.get("/banners/manage", protectAdmin, (req, res) => {
  try {
    res.json({ success: true, banners: db.find("banners") });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/banners - Update homepage banners (Admin)
router.put("/banners", protectAdmin, (req, res) => {
  try {
    const { banners } = req.body;
    if (!Array.isArray(banners) || banners.length > 10) {
      return res.status(400).json({ success: false, message: "Provide up to 10 homepage banners." });
    }

    const validDestinations = new Set(["shop", "category", "about", "contact"]);
    const categoryIds = new Set(db.find("categories").map((category) => category.id));
    const normalizedBanners = banners.map((banner, index) => {
      if (!banner || typeof banner !== "object" || Array.isArray(banner)) {
        throw new BannerInputError(`Banner ${index + 1} is invalid.`);
      }

      const title = String(banner.title || "").trim();
      const sub = String(banner.sub || "").trim();
      const ctaText = String(banner.ctaText || "Shop Now").trim();
      const link = String(banner.link || "shop");
      const categoryId = String(banner.categoryId || "");
      const colorStart = String(banner.colorStart || "#245477");
      const colorEnd = String(banner.colorEnd || "#C6A46A");
      const imageUrl = String(banner.imageUrl || "").trim();

      if (!title || title.length > 80 || sub.length > 160 || !ctaText || ctaText.length > 24) {
        throw new BannerInputError(`Banner ${index + 1} needs a title (max 80 characters) and button label (max 24); subtitle must be 160 characters or fewer.`);
      }
      if (!validDestinations.has(link) || (link === "category" && !categoryIds.has(categoryId))) {
        throw new BannerInputError(`Banner ${index + 1} has an invalid button destination.`);
      }
      if (!/^#[0-9a-f]{6}$/i.test(colorStart) || !/^#[0-9a-f]{6}$/i.test(colorEnd)) {
        throw new BannerInputError(`Banner ${index + 1} has an invalid background color.`);
      }
      let normalizedImageUrl = "";
      if (imageUrl) {
        try {
          const parsedImageUrl = new URL(imageUrl);
          if (parsedImageUrl.protocol !== "https:" || imageUrl.length > 500) throw new Error("Invalid image URL");
          normalizedImageUrl = parsedImageUrl.toString();
        } catch {
          throw new BannerInputError(`Banner ${index + 1} image URL must be a valid HTTPS URL (max 500 characters).`);
        }
      }
      if (banner.active != null && typeof banner.active !== "boolean") {
        throw new BannerInputError(`Banner ${index + 1} visibility setting is invalid.`);
      }

      return {
        id: String(banner.id || `banner-${Date.now()}-${index}`).slice(0, 64),
        title,
        sub,
        ctaText,
        link,
        ...(link === "category" ? { categoryId } : {}),
        colorStart,
        colorEnd,
        imageUrl: normalizedImageUrl,
        active: banner.active !== false,
      };
    });

    const previousBanners = db.data.banners;
    db.data.banners = normalizedBanners;
    if (!db.persist()) {
      db.data.banners = previousBanners;
      return res.status(500).json({ success: false, message: "Unable to save homepage banners." });
    }
    res.json({ success: true, banners: normalizedBanners });
  } catch (err) {
    res.status(err instanceof BannerInputError ? 400 : 500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/announcement - Public announcement bar settings
router.get("/announcement", (req, res) => {
  try {
    const announcement = db.data.announcement || DEFAULT_ANNOUNCEMENT;
    res.json({ success: true, announcement: { ...DEFAULT_ANNOUNCEMENT, ...announcement } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/announcement/manage - Admin announcement bar settings
router.get("/announcement/manage", protectAdmin, (req, res) => {
  try {
    const announcement = db.data.announcement || DEFAULT_ANNOUNCEMENT;
    res.json({ success: true, announcement: { ...DEFAULT_ANNOUNCEMENT, ...announcement } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/announcement - Update announcement bar settings (Admin)
router.put("/announcement", protectAdmin, (req, res) => {
  try {
    const { announcement } = req.body;
    if (!announcement || typeof announcement !== "object" || Array.isArray(announcement)) {
      return res.status(400).json({ success: false, message: "Provide announcement bar settings." });
    }

    const message = String(announcement.message || "").trim();
    const backgroundColor = String(announcement.backgroundColor || "");
    const textColor = String(announcement.textColor || "");
    const scrollDuration = Number(announcement.scrollDuration);
    if (!message || message.length > 240) {
      return res.status(400).json({ success: false, message: "Announcement message must be between 1 and 240 characters." });
    }
    if (!/^#[0-9a-f]{6}$/i.test(backgroundColor) || !/^#[0-9a-f]{6}$/i.test(textColor)) {
      return res.status(400).json({ success: false, message: "Choose valid colors for the announcement bar." });
    }
    if (!Number.isInteger(scrollDuration) || scrollDuration < 8 || scrollDuration > 60) {
      return res.status(400).json({ success: false, message: "Scrolling speed must be between 8 and 60 seconds." });
    }
    if (typeof announcement.enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "Announcement bar visibility setting is invalid." });
    }

    const previousAnnouncement = db.data.announcement;
    const updatedAnnouncement = { message, enabled: announcement.enabled, backgroundColor, textColor, scrollDuration };
    db.data.announcement = updatedAnnouncement;
    if (!db.persist()) {
      db.data.announcement = previousAnnouncement;
      return res.status(500).json({ success: false, message: "Unable to save announcement bar settings." });
    }
    res.json({ success: true, announcement: updatedAnnouncement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
