import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import { requireAdmin } from "../auth.js";
import { menuPool, orderPool, getUserPool, mssql } from "../db.js";
import { config } from "../config.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const DEFAULT_CATEGORIES = [
  { id: 0, slug: "drink", name: "Напої", sortOrder: 0 },
  { id: 1, slug: "soup", name: "Супи", sortOrder: 1 },
  { id: 2, slug: "salad", name: "Салати", sortOrder: 2 },
  { id: 3, slug: "pizza", name: "Піца", sortOrder: 3 },
  { id: 4, slug: "burger", name: "Бургери", sortOrder: 4 },
  { id: 5, slug: "pasta", name: "Паста", sortOrder: 5 },
  { id: 6, slug: "sushi", name: "Суші", sortOrder: 6 },
  { id: 7, slug: "dessert", name: "Десерти", sortOrder: 7 },
  { id: 8, slug: "breakfast", name: "Сніданки", sortOrder: 8 },
  { id: 9, slug: "grill", name: "Гриль", sortOrder: 9 },
  { id: 10, slug: "side-dish", name: "Гарніри", sortOrder: 10 },
  { id: 11, slug: "sauce", name: "Соуси", sortOrder: 11 },
  { id: 12, slug: "vegan", name: "Веган", sortOrder: 12 },
  { id: 13, slug: "kids-menu", name: "Дитяче меню", sortOrder: 13 },
  { id: 14, slug: "special-offer", name: "Акція", sortOrder: 14 },
];

const USER_ROLE_TO_DB = {
  user: 0,
  admin: 1,
};

const ORDER_STATUS_TO_DB = {
  canceled: 0,
  cancelled: 0,
  preparing: 1,
  ready: 2,
  outfordelivery: 3,
  delivered: 4,
};

const DB_TO_ORDER_STATUS = {
  0: "Canceled",
  1: "Preparing",
  2: "Ready",
  3: "OutForDelivery",
  4: "Delivered",
};

const DB_TO_ACCOUNT_TYPE = {
  0: "Customer",
  1: "Business",
  2: "Courier",
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function asBoolean(value) {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
}

function mapUserRole(value) {
  return Number(value) === 1 ? "Admin" : "User";
}

function normalizeOrderStatus(value) {
  const key = String(value || "").trim();
  if (!key) return null;
  return ORDER_STATUS_TO_DB[key.toLowerCase()] ?? null;
}

function buildImageDataUri(file) {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

function parseIngredients(body) {
  const bucket = new Map();

  for (const [key, value] of Object.entries(body || {})) {
    const match = key.match(/^Ingredients\[(\d+)\]\.(Name|Weight|Id)$/);
    if (!match) continue;
    const [, index, field] = match;
    const current = bucket.get(index) || {};
    current[field] = value;
    bucket.set(index, current);
  }

  return [...bucket.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, ingredient]) => ({
      id: ingredient.Id || null,
      name: String(ingredient.Name || "").trim(),
      weight: Number(ingredient.Weight || 0),
    }))
    .filter((ingredient) => ingredient.name && ingredient.weight > 0);
}

function buildAccountResponse(row) {
  const accountType = DB_TO_ACCOUNT_TYPE[row.AccountType] || "Unknown";
  const base = {
        id: String(row.Id).toLowerCase(),
        userId: String(row.UserId).toLowerCase(),
    accountType,
    imageUrl: row.ImageUrl || "",
  };

  if (accountType === "Business") {
    return {
      ...base,
      name: row.BusinessName || "Заклад",
      description: row.BusinessDescription || "",
    };
  }

  if (accountType === "Courier") {
    return {
      ...base,
      name: row.CourierName || "",
      surname: row.CourierSurname || "",
      address: row.CourierAddress || "",
      description: row.CourierDescription || "",
      phoneNumber: row.CourierPhoneNumber || "",
    };
  }

  return {
    ...base,
    name: row.CustomerName || "",
    surname: row.CustomerSurname || "",
    address: row.CustomerAddress || "",
    phoneNumber: row.CustomerPhoneNumber || "",
    locationId: row.CustomerLocationId || null,
  };
}

async function getAllAccounts() {
  const pool = await getUserPool();
  const result = await pool.request().query(`
    SELECT
      a.Id,
      a.UserId,
      a.AccountType,
      a.ImageUrl,
      ca.Name AS CustomerName,
      ca.Surname AS CustomerSurname,
      ca.Address AS CustomerAddress,
      ca.PhoneNumber AS CustomerPhoneNumber,
      ca.LocationId AS CustomerLocationId,
      ba.Name AS BusinessName,
      ba.Description AS BusinessDescription,
      co.Name AS CourierName,
      co.Surname AS CourierSurname,
      co.Address AS CourierAddress,
      co.Description AS CourierDescription,
      co.PhoneNumber AS CourierPhoneNumber
    FROM dbo.Accounts a
    LEFT JOIN dbo.CustomerAccounts ca ON ca.Id = a.Id
    LEFT JOIN dbo.BusinessAccounts ba ON ba.Id = a.Id
    LEFT JOIN dbo.CourierAccounts co ON co.Id = a.Id
  `);

  return result.recordset.map(buildAccountResponse);
}

async function getAllUsers() {
  const pool = await getUserPool();
  const [userResult, accounts] = await Promise.all([
    pool.request().query(`
      SELECT
        Id,
        Email,
        Name,
        Surname,
        AccountId,
        UserRole,
        LockoutEnd,
        LockoutEnabled
      FROM dbo.Users
      ORDER BY Email
    `),
    getAllAccounts(),
  ]);

  const accountsByUserId = new Map();
  for (const account of accounts) {
    const key = String(account.userId).toLowerCase();
    const list = accountsByUserId.get(key) || [];
    list.push(account);
    accountsByUserId.set(key, list);
  }

  return userResult.recordset.map((row) => {
    const userAccounts = accountsByUserId.get(String(row.Id).toLowerCase()) || [];
    const activeAccountId = row.AccountId ? String(row.AccountId).toLowerCase() : null;
    const activeAccount = userAccounts.find((account) => account.id === activeAccountId) || userAccounts[0] || null;
    const blocked = Boolean(row.LockoutEnabled && row.LockoutEnd && new Date(row.LockoutEnd) > new Date());

    return {
      id: String(row.Id).toLowerCase(),
      email: row.Email,
      name: row.Name || "",
      surname: row.Surname || "",
      userRole: mapUserRole(row.UserRole),
      blocked,
      activeAccountId,
      activeAccount,
      accounts: userAccounts,
    };
  });
}

async function ensureAdminRoleMembership(userId, userRoleDb) {
  const pool = await getUserPool();
  const roleId = "11111111-1111-4111-8111-00000000A001";
  const request = pool.request();
  request.input("roleId", mssql.UniqueIdentifier, roleId);
  request.input("userId", mssql.UniqueIdentifier, userId);

  if (userRoleDb === 1) {
    await request.query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE Id = @roleId)
      BEGIN
        INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
        VALUES (@roleId, 'Administrator', 'ADMINISTRATOR', NEWID())
      END

      IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @userId AND RoleId = @roleId)
      BEGIN
        INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
        VALUES (@userId, @roleId)
      END
    `);
  } else {
    await request.query(`
      DELETE FROM dbo.AspNetUserRoles
      WHERE UserId = @userId AND RoleId = @roleId
    `);
  }
}

async function getBusinesses() {
  const accounts = await getAllAccounts();
  return accounts
    .filter((account) => account.accountType === "Business")
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

async function getCategories() {
  const result = await menuPool.query(`
    SELECT
      "Id" AS id,
      "Slug" AS slug,
      "Name" AS name,
      "SortOrder" AS "sortOrder",
      "IsActive" AS "isActive"
    FROM "Categories"
    ORDER BY "SortOrder", "Id"
  `);

  return result.rows;
}

async function getDishRows(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.businessId) {
    values.push(filters.businessId);
    conditions.push(`d."BusinessId" = $${values.length}::uuid`);
  }

  if (filters.category != null && filters.category !== "") {
    values.push(Number(filters.category));
    conditions.push(`d."Category" = $${values.length}`);
  }

  if (filters.query) {
    values.push(`%${filters.query.trim()}%`);
    conditions.push(`(d."Name" ILIKE $${values.length} OR COALESCE(d."Description", '') ILIKE $${values.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const dishResult = await menuPool.query(
    `
      SELECT
        d."Id",
        d."MenuId",
        d."BusinessId",
        d."Name",
        d."Description",
        d."Image",
        d."Price",
        d."Category",
        d."CookingTime",
        m."Name" AS "MenuName"
      FROM "Dishes" d
      LEFT JOIN "Menus" m ON m."Id" = d."MenuId"
      ${whereClause}
      ORDER BY d."Name"
    `,
    values
  );

  const dishIds = dishResult.rows.map((row) => row.Id);
  const categories = await getCategories();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const ingredientsResult = dishIds.length
    ? await menuPool.query(
        `
          SELECT
            "Id",
            "DishId",
            "Name",
            "Weight"
          FROM "Ingredients"
          WHERE "DishId" = ANY($1::uuid[])
          ORDER BY "Name"
        `,
        [dishIds]
      )
    : { rows: [] };

  const ingredientsByDishId = new Map();
  for (const row of ingredientsResult.rows) {
    const list = ingredientsByDishId.get(row.DishId) || [];
    list.push({
      id: row.Id,
      name: row.Name,
      weight: row.Weight,
    });
    ingredientsByDishId.set(row.DishId, list);
  }

  return dishResult.rows.map((row) => ({
    id: row.Id,
    menuId: row.MenuId,
    businessId: row.BusinessId,
    name: row.Name,
    description: row.Description || "",
    imageUrl: row.Image || "",
    image: row.Image || "",
    price: Number(row.Price),
    category: row.Category,
    categoryLabel: categoryMap.get(row.Category)?.name || `Категорія ${row.Category}`,
    cookingTime: row.CookingTime,
    menuName: row.MenuName || "",
    ingredients: ingredientsByDishId.get(row.Id) || [],
  }));
}

async function ensureMenuForBusiness(businessId) {
  const existing = await menuPool.query(
    `SELECT "Id", "Name" FROM "Menus" WHERE "BusinessId" = $1::uuid ORDER BY "Name" NULLS LAST LIMIT 1`,
    [businessId]
  );

  if (existing.rows[0]) return existing.rows[0];

  const menuId = crypto.randomUUID();
  await menuPool.query(
    `
      INSERT INTO "Menus" ("Id", "BusinessId", "Name", "Image")
      VALUES ($1::uuid, $2::uuid, $3, $4)
    `,
    [menuId, businessId, "Основне меню", ""]
  );

  return { Id: menuId, Name: "Основне меню" };
}

function groupOrderedDishRows(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const current = grouped.get(row.DishId) || {
      dishId: row.DishId,
      quantity: 0,
    };

    current.quantity += 1;
    grouped.set(row.DishId, current);
  }

  return [...grouped.values()];
}

async function getOrders(filters = {}) {
  const clauses = [];
  const values = [];

  if (filters.status) {
    const normalized = normalizeOrderStatus(filters.status);
    if (normalized != null) {
      values.push(normalized);
      clauses.push(`o."OrderStatus" = $${values.length}`);
    }
  }

  if (filters.businessId) {
    values.push(filters.businessId);
    clauses.push(`o."BusinessId" = $${values.length}::uuid`);
  }

  if (filters.customerId) {
    values.push(filters.customerId);
    clauses.push(`o."OrderedBy" = $${values.length}::uuid`);
  }

  if (filters.courierId) {
    values.push(filters.courierId);
    clauses.push(`o."DeliveredById" = $${values.length}::uuid`);
  }

  if (filters.from) {
    values.push(filters.from);
    clauses.push(`o."OrderDate" >= $${values.length}::timestamptz`);
  }

  if (filters.to) {
    values.push(filters.to);
    clauses.push(`o."OrderDate" <= $${values.length}::timestamptz`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const ordersResult = await orderPool.query(
    `
      SELECT
        o."Id",
        o."BusinessId",
        o."OrderedBy",
        o."OrderDate",
        o."TotalPrice",
        o."DeliverToId",
        o."DeliverFromId",
        o."DeliveredById",
        o."OrderStatus",
        o."OrderNumber",
        o."Profit"
      FROM "Orders" o
      ${whereClause}
      ORDER BY o."OrderDate" DESC
    `,
    values
  );

  const orderIds = ordersResult.rows.map((row) => row.Id);
  const orderedDishRows = orderIds.length
    ? (
        await orderPool.query(
          `
            SELECT "OrderId", "DishId"
            FROM "OrderedDishes"
            WHERE "OrderId" = ANY($1::uuid[])
          `,
          [orderIds]
        )
      ).rows
    : [];

  const dishIds = [...new Set(orderedDishRows.map((row) => row.DishId))];
  const dishes = dishIds.length
    ? (
        await menuPool.query(
          `
            SELECT "Id", "Name", "Price", "Category", "Image"
            FROM "Dishes"
            WHERE "Id" = ANY($1::uuid[])
          `,
          [dishIds]
        )
      ).rows
    : [];

  const dishMap = new Map(
    dishes.map((dish) => [
      dish.Id,
      {
        dishId: dish.Id,
        dishName: dish.Name,
        price: Number(dish.Price),
        category: dish.Category,
        imageUrl: dish.Image || "",
      },
    ])
  );

  const accountDirectory = new Map((await getAllAccounts()).map((account) => [account.id, account]));
  const orderDishMap = new Map();

  for (const row of orderedDishRows) {
    const list = orderDishMap.get(row.OrderId) || [];
    list.push(row);
    orderDishMap.set(row.OrderId, list);
  }

  return ordersResult.rows.map((row) => {
    const business = accountDirectory.get(row.BusinessId) || null;
    const customer = accountDirectory.get(row.OrderedBy) || null;
    const courier = row.DeliveredById ? accountDirectory.get(row.DeliveredById) || null : null;
    const groupedItems = groupOrderedDishRows(orderDishMap.get(row.Id) || [])
      .map((item) => ({
        ...dishMap.get(item.dishId),
        quantity: item.quantity,
      }))
      .filter((item) => item.dishId);

    return {
      id: row.Id,
      orderNumber: row.OrderNumber,
      orderDate: row.OrderDate,
      totalPrice: Number(row.TotalPrice),
      profit: Number(row.Profit || 0),
      orderStatus: DB_TO_ORDER_STATUS[row.OrderStatus] || "Preparing",
      orderStatusCode: Number(row.OrderStatus),
      businessId: row.BusinessId,
      businessName: business?.name || "Заклад",
      customerId: row.OrderedBy,
      customerName: [customer?.name, customer?.surname].filter(Boolean).join(" ").trim() || "Клієнт",
      customerAddress: customer?.address || "",
      customerPhone: customer?.phoneNumber || "",
      courierId: row.DeliveredById,
      courierName: [courier?.name, courier?.surname].filter(Boolean).join(" ").trim() || "",
      courierPhone: courier?.phoneNumber || "",
      dishes: groupedItems,
    };
  });
}

async function getDashboard() {
  const [summaryResult, topDishesResult, businesses, orders] = await Promise.all([
    orderPool.query(`
      SELECT
        COUNT(*)::int AS "totalOrders",
        COUNT(*) FILTER (WHERE "OrderStatus" IN (1, 2, 3))::int AS "activeDeliveries",
        COALESCE(SUM("TotalPrice"), 0)::numeric AS "grossSales"
      FROM "Orders"
    `),
    orderPool.query(`
      SELECT
        od."DishId" AS id,
        COUNT(*)::int AS "orderCount"
      FROM "OrderedDishes" od
      GROUP BY od."DishId"
      ORDER BY "orderCount" DESC
      LIMIT 5
    `),
    getBusinesses(),
    getOrders(),
  ]);

  const dishRows = topDishesResult.rows;
  const dishIds = dishRows.map((row) => row.id);
  const dishNames = dishIds.length
    ? (
        await menuPool.query(
          `SELECT "Id", "Name" FROM "Dishes" WHERE "Id" = ANY($1::uuid[])`,
          [dishIds]
        )
      ).rows
    : [];
  const dishNameMap = new Map(dishNames.map((row) => [row.Id, row.Name]));

  let promoAnalytics = {
    totalPromos: 0,
    activePromos: 0,
    totalRedemptions: 0,
  };

  try {
    const response = await fetch(`${config.promoServiceUrl}/analytics`, {
      headers: {
        Authorization: "internal",
      },
    });
    if (response.ok) {
      promoAnalytics = await response.json();
    }
  } catch {
    // promo-service may still be starting; keep zeroed metrics
  }

  return {
    totalOrders: summaryResult.rows[0]?.totalOrders || 0,
    activeDeliveries: summaryResult.rows[0]?.activeDeliveries || 0,
    grossSales: Number(summaryResult.rows[0]?.grossSales || 0),
    businessCount: businesses.length,
    deliveredOrders: orders.filter((order) => order.orderStatus === "Delivered").length,
    promoAnalytics,
    topDishes: dishRows.map((row) => ({
      id: row.id,
      name: dishNameMap.get(row.id) || "Страва",
      orderCount: row.orderCount,
    })),
  };
}

export async function ensureAdminSchema() {
  await menuPool.query(`
    CREATE TABLE IF NOT EXISTS "Categories" (
      "Id" integer PRIMARY KEY,
      "Slug" varchar(120) NOT NULL UNIQUE,
      "Name" varchar(120) NOT NULL,
      "SortOrder" integer NOT NULL DEFAULT 0,
      "IsActive" boolean NOT NULL DEFAULT true,
      "CreatedAt" timestamptz NOT NULL DEFAULT NOW(),
      "UpdatedAt" timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  for (const category of DEFAULT_CATEGORIES) {
    await menuPool.query(
      `
        INSERT INTO "Categories" ("Id", "Slug", "Name", "SortOrder", "IsActive")
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT ("Id") DO NOTHING
      `,
      [category.id, category.slug, category.name, category.sortOrder]
    );
  }
}

router.use(requireAdmin);

router.get("/dashboard", async (_req, res) => {
  try {
    res.json(await getDashboard());
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin dashboard.", detail: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    let users = await getAllUsers();
    const query = String(req.query.query || "").trim().toLowerCase();
    const role = String(req.query.role || "").trim();
    const blocked = asBoolean(req.query.blocked);

    if (query) {
      users = users.filter((user) =>
        [user.email, user.name, user.surname].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      );
    }

    if (role) {
      users = users.filter((user) => user.userRole === role);
    }

    if (blocked != null) {
      users = users.filter((user) => user.blocked === blocked);
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load users.", detail: error.message });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const users = await getAllUsers();
    const user = users.find((entry) => entry.id === req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to load user details.", detail: error.message });
  }
});

router.patch("/users/:userId", async (req, res) => {
  try {
    const pool = await getUserPool();
    const users = await getAllUsers();
    const existing = users.find((entry) => entry.id === req.params.userId);
    if (!existing) return res.status(404).json({ message: "User not found." });

    const nextName = String(req.body.name ?? existing.name).trim();
    const nextSurname = String(req.body.surname ?? existing.surname).trim();
    const nextEmail = String(req.body.email ?? existing.email).trim();
    const roleInput = String(req.body.userRole ?? existing.userRole).trim().toLowerCase();
    const nextUserRole = USER_ROLE_TO_DB[roleInput] ?? USER_ROLE_TO_DB.user;
    const blocked = req.body.blocked == null ? existing.blocked : Boolean(req.body.blocked);
    const lockoutEnd = blocked ? new Date("2099-12-31T00:00:00.000Z") : null;

    const request = pool.request();
    request.input("userId", mssql.UniqueIdentifier, req.params.userId);
    request.input("email", mssql.NVarChar(256), nextEmail);
    request.input("normalizedEmail", mssql.NVarChar(256), nextEmail.toUpperCase());
    request.input("name", mssql.NVarChar(256), nextName);
    request.input("surname", mssql.NVarChar(256), nextSurname);
    request.input("userRole", mssql.Int, nextUserRole);
    request.input("lockoutEnabled", mssql.Bit, blocked);
    request.input("lockoutEnd", mssql.DateTimeOffset, lockoutEnd);

    await request.query(`
      UPDATE dbo.Users
      SET
        Email = @email,
        NormalizedEmail = @normalizedEmail,
        UserName = @email,
        NormalizedUserName = @normalizedEmail,
        Name = @name,
        Surname = @surname,
        UserRole = @userRole,
        LockoutEnabled = @lockoutEnabled,
        LockoutEnd = @lockoutEnd
      WHERE Id = @userId
    `);

    await ensureAdminRoleMembership(req.params.userId, nextUserRole);

    const updated = (await getAllUsers()).find((entry) => entry.id === req.params.userId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update user.", detail: error.message });
  }
});

router.get("/businesses", async (_req, res) => {
  try {
    res.json(await getBusinesses());
  } catch (error) {
    res.status(500).json({ message: "Failed to load businesses.", detail: error.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    res.json(await getOrders(req.query));
  } catch (error) {
    res.status(500).json({ message: "Failed to load orders.", detail: error.message });
  }
});

router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const nextStatus = normalizeOrderStatus(req.body.status);
    if (nextStatus == null) {
      return res.status(400).json({ message: "Unsupported order status." });
    }

    const currentOrder = (await getOrders()).find((order) => order.id === req.params.orderId);
    if (!currentOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (
      ["Canceled", "Delivered"].includes(currentOrder.orderStatus) &&
      currentOrder.orderStatus !== DB_TO_ORDER_STATUS[nextStatus]
    ) {
      return res.status(409).json({
        message: "Terminal orders cannot be moved to another status.",
      });
    }

    await orderPool.query(`UPDATE "Orders" SET "OrderStatus" = $2 WHERE "Id" = $1::uuid`, [
      req.params.orderId,
      nextStatus,
    ]);

    const updated = (await getOrders()).find((order) => order.id === req.params.orderId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status.", detail: error.message });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    res.json(await getCategories());
  } catch (error) {
    res.status(500).json({ message: "Failed to load categories.", detail: error.message });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const current = await getCategories();
    const nextId =
      req.body.id != null
        ? Number(req.body.id)
        : current.reduce((max, category) => Math.max(max, category.id), -1) + 1;
    const name = String(req.body.name || "").trim();
    const slug = slugify(req.body.slug || name);

    if (!name || !slug) {
      return res.status(400).json({ message: "Category name is required." });
    }

    await menuPool.query(
      `
        INSERT INTO "Categories" ("Id", "Slug", "Name", "SortOrder", "IsActive", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      `,
      [nextId, slug, name, Number(req.body.sortOrder || nextId)]
    );

    const created = (await getCategories()).find((category) => category.id === nextId);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Failed to create category.", detail: error.message });
  }
});

router.put("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const current = (await getCategories()).find((category) => category.id === categoryId);
    if (!current) return res.status(404).json({ message: "Category not found." });

    const name = String(req.body.name ?? current.name).trim();
    const slug = slugify(req.body.slug ?? current.slug);
    const sortOrder = Number(req.body.sortOrder ?? current.sortOrder);
    const isActive = req.body.isActive == null ? current.isActive : Boolean(req.body.isActive);

    await menuPool.query(
      `
        UPDATE "Categories"
        SET
          "Name" = $2,
          "Slug" = $3,
          "SortOrder" = $4,
          "IsActive" = $5,
          "UpdatedAt" = NOW()
        WHERE "Id" = $1
      `,
      [categoryId, name, slug, sortOrder, isActive]
    );

    const updated = (await getCategories()).find((category) => category.id === categoryId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update category.", detail: error.message });
  }
});

router.delete("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const usageResult = await menuPool.query(
      `SELECT COUNT(*)::int AS count FROM "Dishes" WHERE "Category" = $1`,
      [categoryId]
    );

    if (usageResult.rows[0]?.count > 0) {
      return res.status(409).json({
        message: "Category is still used by dishes and cannot be deleted.",
      });
    }

    await menuPool.query(`DELETE FROM "Categories" WHERE "Id" = $1`, [categoryId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category.", detail: error.message });
  }
});

router.get("/dishes", async (req, res) => {
  try {
    res.json(await getDishRows(req.query));
  } catch (error) {
    res.status(500).json({ message: "Failed to load dishes.", detail: error.message });
  }
});

router.post("/dishes", upload.single("Image"), async (req, res) => {
  try {
    const businessId = String(req.body.BusinessId || req.body.businessId || "").trim();
    if (!businessId) {
      return res.status(400).json({ message: "BusinessId is required." });
    }

    const menu = await ensureMenuForBusiness(businessId);
    const dishId = crypto.randomUUID();
    const image = buildImageDataUri(req.file);
    const ingredients = parseIngredients(req.body);

    await menuPool.query(
      `
        INSERT INTO "Dishes" (
          "Id", "MenuId", "Name", "Description", "Image", "Price", "Category", "BusinessId", "CookingTime"
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::uuid, $9
        )
      `,
      [
        dishId,
        req.body.MenuId || req.body.menuId || menu.Id,
        String(req.body.Name || req.body.name || "").trim(),
        String(req.body.Description || req.body.description || "").trim(),
        image || "",
        Number(req.body.Price || req.body.price || 0),
        Number(req.body.Category || req.body.category || 0),
        businessId,
        Number(req.body.CookingTime || req.body.cookingTime || 0),
      ]
    );

    for (const ingredient of ingredients) {
      await menuPool.query(
        `
          INSERT INTO "Ingredients" ("Id", "DishId", "Name", "Weight")
          VALUES ($1::uuid, $2::uuid, $3, $4)
        `,
        [crypto.randomUUID(), dishId, ingredient.name, ingredient.weight]
      );
    }

    const created = (await getDishRows({ businessId })).find((dish) => dish.id === dishId);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Failed to create dish.", detail: error.message });
  }
});

router.put("/dishes/:dishId", upload.single("Image"), async (req, res) => {
  try {
    const existing = (await getDishRows()).find((dish) => dish.id === req.params.dishId);
    if (!existing) return res.status(404).json({ message: "Dish not found." });

    const businessId = String(req.body.BusinessId || req.body.businessId || existing.businessId).trim();
    const menu = await ensureMenuForBusiness(businessId);
    const image = buildImageDataUri(req.file) || existing.imageUrl || "";
    const ingredients = parseIngredients(req.body);

    await menuPool.query(
      `
        UPDATE "Dishes"
        SET
          "MenuId" = $2::uuid,
          "Name" = $3,
          "Description" = $4,
          "Image" = $5,
          "Price" = $6,
          "Category" = $7,
          "BusinessId" = $8::uuid,
          "CookingTime" = $9
        WHERE "Id" = $1::uuid
      `,
      [
        req.params.dishId,
        req.body.MenuId || req.body.menuId || existing.menuId || menu.Id,
        String(req.body.Name || req.body.name || existing.name).trim(),
        String(req.body.Description || req.body.description || existing.description).trim(),
        image,
        Number(req.body.Price || req.body.price || existing.price || 0),
        Number(req.body.Category || req.body.category || existing.category || 0),
        businessId,
        Number(req.body.CookingTime || req.body.cookingTime || existing.cookingTime || 0),
      ]
    );

    if (ingredients.length > 0) {
      await menuPool.query(`DELETE FROM "Ingredients" WHERE "DishId" = $1::uuid`, [req.params.dishId]);
      for (const ingredient of ingredients) {
        await menuPool.query(
          `
            INSERT INTO "Ingredients" ("Id", "DishId", "Name", "Weight")
            VALUES ($1::uuid, $2::uuid, $3, $4)
          `,
          [crypto.randomUUID(), req.params.dishId, ingredient.name, ingredient.weight]
        );
      }
    }

    const updated = (await getDishRows({ businessId })).find((dish) => dish.id === req.params.dishId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update dish.", detail: error.message });
  }
});

router.delete("/dishes/:dishId", async (req, res) => {
  try {
    await menuPool.query(`DELETE FROM "Dishes" WHERE "Id" = $1::uuid`, [req.params.dishId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete dish.", detail: error.message });
  }
});

export default router;
