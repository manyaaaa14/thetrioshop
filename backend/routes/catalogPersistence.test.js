import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "trio-catalog-persistence-"));
process.env.TRIO_STORE_PATH = path.join(tempDir, "store.json");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "catalog-persistence-test-secret";
process.env.MONGODB_URI = "";
process.env.MONGO_URI = "";

let server;
let db;
let baseUrl;

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  for (const file of [process.env.TRIO_STORE_PATH, `${process.env.TRIO_STORE_PATH}.tmp`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  fs.rmdirSync(tempDir);
});

test("catalog CRUD survives reloads and keeps category links intact", async () => {
  const { connectMongoDB } = await import("../db/mongodb.js");
  process.env.NODE_ENV = "production";
  await assert.rejects(
    connectMongoDB(),
    /MONGODB_URI must be configured in production/
  );
  process.env.NODE_ENV = "test";
  process.env.RENDER = "true";
  await assert.rejects(
    connectMongoDB(),
    /MONGODB_URI must be configured in production/
  );
  delete process.env.RENDER;

  ({ db } = await import("../db/db.js"));
  await db.ready;
  const [{ default: express }, { default: jwt }, { default: productRoutes }, { default: categoryRoutes }] =
    await Promise.all([
      import("express"),
      import("jsonwebtoken"),
      import("./products.routes.js"),
      import("./categories.routes.js"),
    ]);

  db.insert("users", {
    id: "catalog-test-admin",
    email: "catalog-admin@example.test",
    role: "admin",
  });
  const token = jwt.sign({ id: "catalog-test-admin" }, process.env.JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  async function request(endpoint, options = {}) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.admin ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return { status: response.status, body: await response.json() };
  }

  const createdCategory = await request("/categories", {
    method: "POST",
    admin: true,
    body: JSON.stringify({ name: "Seasonal", emoji: "🌿", color: "#F3E8FF" }),
  });
  assert.equal(createdCategory.status, 201);
  const categoryId = createdCategory.body.category.id;

  await db.init();
  const categoriesAfterReload = await request("/categories");
  assert.ok(categoriesAfterReload.body.categories.some((item) => item.id === categoryId));
  assert.equal((await request("/categories", {
    method: "POST",
    admin: true,
    body: JSON.stringify({ name: "Seasonal" }),
  })).status, 400);

  const createdProduct = await request("/products", {
    method: "POST",
    admin: true,
    body: JSON.stringify({
      name: "Test product",
      category: categoryId,
      price: 50,
      mrp: 70,
      stock: 3,
      desc: "Persistence test",
      images: ["data:image/png;base64,AA=="],
    }),
  });
  assert.equal(createdProduct.status, 201);
  const productId = createdProduct.body.product.id;
  assert.ok((await request("/products")).body.products.some((item) => item.id === productId));

  assert.equal((await request(`/categories/${categoryId}`, {
    method: "DELETE",
    admin: true,
  })).status, 409);

  const secondCategory = await request("/categories", {
    method: "POST",
    admin: true,
    body: JSON.stringify({ name: "New collection" }),
  });
  assert.equal(secondCategory.status, 201);
  const newCategoryId = secondCategory.body.category.id;
  assert.equal((await request(`/products/${productId}`, {
    method: "PUT",
    admin: true,
    body: JSON.stringify({ category: newCategoryId }),
  })).status, 200);

  await db.init();
  const productsAfterReload = await request("/products/admin/all", { admin: true });
  const reloadedProduct = productsAfterReload.body.products.find((item) => item.id === productId);
  assert.equal(reloadedProduct.category, newCategoryId);
  assert.ok((await request("/products")).body.products.some((item) => item.id === productId));

  assert.equal((await request(`/products/${productId}`, { method: "DELETE", admin: true })).status, 200);
  await db.init();
  assert.ok(!(await request("/products/admin/all", { admin: true })).body.products.some((item) => item.id === productId));
  assert.ok(!(await request("/products")).body.products.some((item) => item.id === productId));

  assert.equal((await request(`/categories/${newCategoryId}`, {
    method: "DELETE",
    admin: true,
  })).status, 200);
  await db.init();
  assert.ok(!(await request("/categories")).body.categories.some((item) => item.id === newCategoryId));
});
