# THE TRIO SHOP — Full-Stack E-Commerce Platform

A complete, modern Meesho / Flipkart / Amazon–style full-stack e‑commerce platform and admin management suite, built with **React + Vite + Tailwind CSS** on the frontend and **Node.js + Express + Persistent Database** on the backend with JWT authentication.

---

## ✨ Features Overview

### 🛍️ Storefront Experience (Customer App)
- **Dynamic Home Page:** Auto-rotating promotional hero banners, quick category carousel rail, Daily Deals, Bestsellers, New Arrivals, and Instagram social banner.
- **Search & Auto-Complete:** Real-time search dropdown showing matching product names, categories, thumbnail previews, and pricing.
- **Catalog & Advanced Filtering:** Filter by Category, Price slider, In-stock only, and sort by Popularity, Price (Low/High), Newest Drops, or Customer Ratings.
- **Product Details:** High-res image gallery, color variant selector, stock status (with low stock warnings), quantity selector, instant "Buy Now" and "Add to Cart", and Wishlist heart toggle.
- **Live Customer Reviews & Ratings:** Verified customer reviews, interactive star ratings, dynamic average calculation, and live review submission.
- **Persistent Cart & Wishlist:** Live quantity management, price summaries, and server-synced cart across logins.
- **Smart Checkout:** Address form with validation, payment mode selection (Cash on Delivery, UPI, Cards), live promo coupon validation (`TRIO50`, `TRIO10`, `FLAT100`, `FESTIVE20`), and free delivery computation (orders ≥ ₹499).
- **Celebratory Order Confirmation:** Confetti visual celebration with order summary and instant tracking link.
- **Order Tracking & Lifecycle:** Interactive visual stepper (`Pending` → `Confirmed` → `Shipped` → `Out for Delivery` → `Delivered`), order cancellation with automatic stock restoration.
- **Customer Profile & Address Book:** Manage personal info, saved shipping addresses, and direct order shortcuts.

### 🛡️ Admin Dashboard (`/#admin` or Footer Link)
- **Real-Time Analytics:** Total store revenue, total orders, active customer count, catalog product count, and low stock warnings.
- **Sales Velocity Graph:** Visual weekly sales breakdown and best-selling product rankings.
- **Product Management (CRUD):** Add products with image URLs, categories, MRP, selling price, badges (`bestseller`, `new`, `sale`), toggle store visibility, or delete products.
- **Category Manager:** Add new categories with custom emoji and background color tint.
- **Order Status Control:** View complete order histories, customer shipping addresses, ordered items, and advance statuses or cancel orders with stock restoration.
- **Customer Directory:** Track registered customer accounts, order counts, and lifetime spend.
- **Inventory Control:** Quick restock (`+20`) and real-time inventory quantity increments.
- **Coupon Manager:** Create flat amount (₹) or percentage (%) discount promo codes with minimum cart total requirements.
- **Review Moderation:** View and moderate customer feedback across the entire catalog.
- **Homepage Banner Editor:** Customize carousel banner titles, subtitles, and gradient styles.

---

## 🚀 Quick Start (Single Command)

### 1. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### 2. Launch Full-Stack Application
```bash
npm run dev
```
This runs both:
- **Backend Express API:** `http://localhost:5000`
- **Frontend Storefront:** `http://localhost:5173` (with `/api` proxying)

### 3. Configure Firebase Authentication (optional)
The app uses Firebase Authentication for customer email/password sign-in and keeps customer profiles, orders, and other store data in the existing backend database. Admin sign-in continues to use the backend.

1. In the Firebase Console, create a project, register a Web app, and enable **Authentication → Sign-in method → Email/Password**.
2. Add the Web app values to a root `.env.local` file:
   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```
3. Set `FIREBASE_PROJECT_ID` to the Firebase project ID in the backend process's `.env` file (the repository-root `.env` when running `npm run dev`, or `backend/.env` when starting the backend from its own folder). Only the project ID is needed to verify Firebase ID tokens; no service-account private key is required. The variable name is listed in `backend/.env.example`.
4. For deployment, add the six `VITE_FIREBASE_*` Web config variables to Netlify's environment variables and `FIREBASE_PROJECT_ID` to the backend Render service (`bloraa.onrender.com`). Local `.env` files are not deployed.
5. Restart both the Vite frontend and backend after setting the variables.

The Firebase Web configuration is public client configuration; the service-account private key must never be exposed to the frontend or committed. If the Web configuration is omitted, the existing backend email/password authentication remains active. Existing customer accounts can be linked after signing in with a verified Firebase email; admin authentication is unchanged.

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email | Password | Access Method |
|---|---|---|---|
| **Store Admin** | `admin97297@gmail.com` | `tri09090` | Click footer **"Store Admin Portal"** or add `/#admin` to URL |
| **Demo Customer** | `user@trioshop.in` | `user123` | Click **"Login"** on top navbar |

---

## 📡 Backend API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Server health check | Public |
| `POST` | `/api/auth/register` | Register new customer | Public |
| `POST` | `/api/auth/login` | Customer login (returns JWT) | Public |
| `POST` | `/api/auth/firebase-session` | Verify Firebase ID token and issue API JWT | Public |
| `POST` | `/api/auth/admin-login` | Admin authentication (returns JWT) | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user | User / Admin |
| `PUT` | `/api/auth/profile` | Update profile & address | User |
| `GET` | `/api/products` | Query products with filters | Public |
| `GET` | `/api/products/:id` | Single product details | Public |
| `POST` | `/api/products` | Create product | Admin |
| `PUT` | `/api/products/:id` | Update product | Admin |
| `DELETE` | `/api/products/:id` | Delete product | Admin |
| `PATCH` | `/api/products/:id/stock` | Quick stock adjustment | Admin |
| `GET` | `/api/categories` | List catalog categories | Public |
| `POST` | `/api/categories` | Add new category | Admin |
| `DELETE` | `/api/categories/:id` | Delete category | Admin |
| `POST` | `/api/orders` | Place verified order (auto-stock check) | Public / User |
| `GET` | `/api/orders/my-orders` | Current user order history | User |
| `GET` | `/api/orders/all` | View all customer orders | Admin |
| `GET` | `/api/orders/:id` | Order details & timeline | Public / User |
| `PATCH` | `/api/orders/:id/cancel` | Cancel order (restores stock) | User / Admin |
| `PATCH` | `/api/orders/:id/status` | Update order stage | Admin |
| `POST` | `/api/coupons/validate` | Validate coupon against cart | Public |
| `GET` | `/api/coupons` | List all discount coupons | Admin |
| `POST` | `/api/coupons` | Create discount coupon | Admin |
| `DELETE` | `/api/coupons/:id` | Delete coupon | Admin |
| `GET` | `/api/reviews/product/:id` | Product reviews | Public |
| `POST` | `/api/reviews` | Submit product review | User / Guest |
| `GET` | `/api/reviews/all` | Moderation list | Admin |
| `DELETE` | `/api/reviews/:id` | Delete review | Admin |
| `GET` | `/api/admin/stats` | Business overview & metrics | Admin |
| `GET` | `/api/admin/customers` | Customer lifetime spend list | Admin |
| `GET` | `/api/admin/banners` | Homepage banners | Public |
| `PUT` | `/api/admin/banners` | Update banners | Admin |

---

## 🗄️ Database Architecture

The backend uses a zero-configuration persistent JSON database (`backend/data/store.json`) with atomic file writes. It requires **no external database server installation** on Windows and starts immediately.

To reseed the database at any time with fresh demo data:
```bash
npm run seed
```

---

## 📦 Production Build

```bash
npm run build
npm run preview
```
Output bundle is generated into `dist/`.
#   t h e t r i o s h o p  
 