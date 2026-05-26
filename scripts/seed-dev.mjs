import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const FRONTEND_PUBLIC_DIR = join(ROOT, "frontend", "food-delivery-platform", "public");
const FRONTEND_GENERATED_DIR = join(ROOT, "frontend", "food-delivery-platform", "src", "generated");
const BUSINESS_CATALOG_PATH = join(FRONTEND_PUBLIC_DIR, "seed-business-catalog.json");
const BUSINESS_CATALOG_MODULE_PATH = join(
  FRONTEND_GENERATED_DIR,
  "seedBusinessCatalog.js"
);
const CUSTOMER_DISH_MODULE_PATH = join(
  FRONTEND_GENERATED_DIR,
  "seedCustomerDishes.js"
);

const USER_API = process.env.SEED_USER_API_URL ?? "http://localhost:5001";
const MENU_API = process.env.SEED_MENU_API_URL ?? "http://localhost:5004";
const ORDER_API = process.env.SEED_ORDER_API_URL ?? "http://localhost:5005";
const PROMO_API = process.env.SEED_PROMO_API_URL ?? "http://localhost:5007";

const DEFAULT_PASSWORD = "Test123!";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const ADMIN_ROLE_ID = "11111111-1111-4111-8111-00000000A001";

const seedBusinesses = [
  {
    key: "burger",
    owner: {
      email: "seed-owner-burger@example.com",
      password: DEFAULT_PASSWORD,
      name: "Burger",
      surname: "Owner",
    },
    account: {
      name: "Burger Hub",
      description: "Smash burgers, fries and shakes",
      accountType: 1,
    },
    menu: {
      id: "11111111-1111-4111-8111-000000000201",
      name: "Main Menu",
    },
    address: {
      fullAddress: "вул. Незалежності, 5, Івано-Франківськ, Україна",
      city: "Івано-Франківськ",
      street: "Незалежності",
      house: "5",
    },
    dishes: [
      {
        id: "11111111-1111-4111-8111-000000000301",
        name: "Classic Smash Burger",
        description: "Double beef, cheddar, pickles and burger sauce",
        price: 229,
        category: 4,
        cookingTime: 14,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000401", name: "Beef Patty", weight: 180 },
          { id: "11111111-1111-4111-8111-000000000402", name: "Cheddar", weight: 40 },
          { id: "11111111-1111-4111-8111-000000000403", name: "Pickles", weight: 30 },
        ],
      },
      {
        id: "11111111-1111-4111-8111-000000000302",
        name: "Loaded Fries",
        description: "Crispy fries with cheddar sauce and bacon",
        price: 149,
        category: 10,
        cookingTime: 10,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000404", name: "Potato", weight: 220 },
          { id: "11111111-1111-4111-8111-000000000405", name: "Cheddar Sauce", weight: 60 },
        ],
      },
    ],
  },
  {
    key: "pizza",
    owner: {
      email: "seed-owner-pizza@example.com",
      password: DEFAULT_PASSWORD,
      name: "Pizza",
      surname: "Owner",
    },
    account: {
      name: "Pizza Palace",
      description: "Wood-fired pizza and Italian classics",
      accountType: 1,
    },
    menu: {
      id: "11111111-1111-4111-8111-000000000202",
      name: "Main Menu",
    },
    address: {
      fullAddress: "вул. Галицька, 10, Івано-Франківськ, Україна",
      city: "Івано-Франківськ",
      street: "Галицька",
      house: "10",
    },
    dishes: [
      {
        id: "11111111-1111-4111-8111-000000000303",
        name: "Margherita",
        description: "Tomato sauce, mozzarella and basil",
        price: 249,
        category: 3,
        cookingTime: 13,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000406", name: "Mozzarella", weight: 120 },
          { id: "11111111-1111-4111-8111-000000000407", name: "Tomato Sauce", weight: 80 },
        ],
      },
      {
        id: "11111111-1111-4111-8111-000000000304",
        name: "Carbonara Pasta",
        description: "Creamy pasta with pancetta and parmesan",
        price: 219,
        category: 5,
        cookingTime: 16,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000408", name: "Pasta", weight: 180 },
          { id: "11111111-1111-4111-8111-000000000409", name: "Pancetta", weight: 70 },
        ],
      },
    ],
  },
  {
    key: "sushi",
    owner: {
      email: "seed-owner-sushi@example.com",
      password: DEFAULT_PASSWORD,
      name: "Sushi",
      surname: "Owner",
    },
    account: {
      name: "Sushi Bar",
      description: "Fresh sushi and ramen bowls",
      accountType: 1,
    },
    menu: {
      id: "11111111-1111-4111-8111-000000000203",
      name: "Main Menu",
    },
    address: {
      fullAddress: "вул. Шевченка, 20, Івано-Франківськ, Україна",
      city: "Івано-Франківськ",
      street: "Шевченка",
      house: "20",
    },
    dishes: [
      {
        id: "11111111-1111-4111-8111-000000000305",
        name: "Philadelphia Roll",
        description: "Salmon, cream cheese and cucumber",
        price: 259,
        category: 6,
        cookingTime: 15,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000410", name: "Salmon", weight: 90 },
          { id: "11111111-1111-4111-8111-000000000411", name: "Cream Cheese", weight: 45 },
        ],
      },
      {
        id: "11111111-1111-4111-8111-000000000306",
        name: "Miso Soup",
        description: "Classic miso broth with tofu and wakame",
        price: 99,
        category: 1,
        cookingTime: 8,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000412", name: "Miso Paste", weight: 30 },
          { id: "11111111-1111-4111-8111-000000000413", name: "Tofu", weight: 50 },
        ],
      },
    ],
  },
  {
    key: "coffee",
    owner: {
      email: "seed-owner-coffee@example.com",
      password: DEFAULT_PASSWORD,
      name: "Coffee",
      surname: "Owner",
    },
    account: {
      name: "Coffee House",
      description: "Coffee, breakfast and desserts",
      accountType: 1,
    },
    menu: {
      id: "11111111-1111-4111-8111-000000000204",
      name: "Main Menu",
    },
    address: {
      fullAddress: "вул. Мазепи, 34, Івано-Франківськ, Україна",
      city: "Івано-Франківськ",
      street: "Мазепи",
      house: "34",
    },
    dishes: [
      {
        id: "11111111-1111-4111-8111-000000000307",
        name: "Cappuccino",
        description: "Italian coffee with silky milk foam",
        price: 89,
        category: 0,
        cookingTime: 5,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000414", name: "Espresso", weight: 30 },
          { id: "11111111-1111-4111-8111-000000000415", name: "Milk", weight: 150 },
        ],
      },
      {
        id: "11111111-1111-4111-8111-000000000308",
        name: "Cheesecake",
        description: "Creamy vanilla cheesecake with berry topping",
        price: 129,
        category: 7,
        cookingTime: 4,
        ingredients: [
          { id: "11111111-1111-4111-8111-000000000416", name: "Cream Cheese", weight: 110 },
          { id: "11111111-1111-4111-8111-000000000417", name: "Berry Topping", weight: 40 },
        ],
      },
    ],
  },
];

const seedCustomer = {
  email: "seed-customer@example.com",
  password: DEFAULT_PASSWORD,
  name: "Test",
  surname: "Customer",
  account: {
    Name: "Test",
    Surname: "Customer",
    PhoneNumber: "+380501112233",
    Address: "вул. Незалежності, 25, Івано-Франківськ, Україна",
    AccountType: 0,
  },
};

const seedCourier = {
  email: "seed-courier@example.com",
  password: DEFAULT_PASSWORD,
  name: "Fast",
  surname: "Courier",
  account: {
    Name: "Fast",
    Surname: "Courier",
    PhoneNumber: "+380509998877",
    Address: "вул. Дністровська, 7, Івано-Франківськ, Україна",
    Description: "Courier for seeded development orders",
    AccountType: 2,
  },
};

const seedAdmin = {
  email: "seed-admin@example.com",
  password: DEFAULT_PASSWORD,
  name: "Seed",
  surname: "Admin",
  roleName: "Administrator",
};

function log(message) {
  console.log(`[seed] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAccountType(accountType) {
  return String(accountType ?? "").trim().toLowerCase();
}

function docker(args, options = {}) {
  return execFileSync("docker", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function userServiceQuery(sql) {
  return docker(
    [
      "exec",
      "-i",
      "mssql",
      "/opt/mssql-tools18/bin/sqlcmd",
      "-C",
      "-S",
      "localhost",
      "-U",
      "sa",
      "-P",
      "StrongPass123!",
      "-d",
      "UserServiceDb",
      "-b",
    ],
    { input: `${sql}\n` }
  );
}

async function waitForHttp(url, name, maxAttempts = 60) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        log(`${name} is ready`);
        return;
      }
    } catch {
      // retry
    }
    await sleep(2000);
  }
  throw new Error(`${name} did not become ready: ${url}`);
}

async function request(method, url, { token, json, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: json ? JSON.stringify(json) : formData,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${method} ${url}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function loginOrRegister(user) {
  const loginPayload = { email: user.email, password: user.password };
  try {
    return await request("POST", `${USER_API}/api/Auth/login`, { json: loginPayload });
  } catch (loginError) {
    if (loginError.status && loginError.status !== 400 && loginError.status !== 404) {
      throw loginError;
    }
  }

  try {
    return await request("POST", `${USER_API}/api/Auth/register`, {
      json: {
        email: user.email,
        password: user.password,
        name: user.name,
        surname: user.surname,
      },
    });
  } catch (registerError) {
    const message = JSON.stringify(registerError.data ?? "");
    if (!/exist|already|вже/i.test(message)) {
      throw registerError;
    }
  }

  return request("POST", `${USER_API}/api/Auth/login`, { json: loginPayload });
}

async function getProfile(token) {
  return request("GET", `${USER_API}/api/Profile`, { token });
}

async function ensureAccount(kind, auth, matcher, fields) {
  const profile = await getProfile(auth.accessToken);
  const existing = (profile?.accounts ?? []).find((account) => matcher(account));
  if (existing) {
    return existing;
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  return request("POST", `${USER_API}/api/Account/${kind}`, {
    token: auth.accessToken,
    formData,
  });
}

function ensureAdministratorRole(userId) {
  userServiceQuery(`
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = 'ADMINISTRATOR')
BEGIN
  INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
  VALUES ('${ADMIN_ROLE_ID}', 'Administrator', 'ADMINISTRATOR', NEWID());
END;

IF NOT EXISTS (
  SELECT 1
  FROM AspNetUserRoles
  WHERE UserId = '${userId}' AND RoleId = '${ADMIN_ROLE_ID}'
)
BEGIN
  INSERT INTO AspNetUserRoles (UserId, RoleId)
  VALUES ('${userId}', '${ADMIN_ROLE_ID}');
END;

UPDATE Users
SET UserRole = 1
WHERE Id = '${userId}';
`);
}

function upsertMenuAndDishesSql(businesses) {
  const lines = [
    "BEGIN;",
  ];

  for (const business of businesses) {
    lines.push(`
INSERT INTO "Menus" ("Id", "BusinessId", "Name", "Image")
VALUES ('${business.menu.id}', '${business.accountId}', '${sqlText(business.menu.name)}', '')
ON CONFLICT ("Id") DO UPDATE
SET "BusinessId" = EXCLUDED."BusinessId",
    "Name" = EXCLUDED."Name",
    "Image" = EXCLUDED."Image";`);

    for (const dish of business.dishes) {
      lines.push(`
INSERT INTO "Dishes" ("Id", "MenuId", "Name", "Description", "Image", "Price", "Category", "BusinessId", "CookingTime")
VALUES ('${dish.id}', '${business.menu.id}', '${sqlText(dish.name)}', '${sqlText(dish.description)}', '', ${dish.price.toFixed(2)}, ${dish.category}, '${business.accountId}', ${dish.cookingTime})
ON CONFLICT ("Id") DO UPDATE
SET "MenuId" = EXCLUDED."MenuId",
    "Name" = EXCLUDED."Name",
    "Description" = EXCLUDED."Description",
    "Image" = EXCLUDED."Image",
    "Price" = EXCLUDED."Price",
    "Category" = EXCLUDED."Category",
    "BusinessId" = EXCLUDED."BusinessId",
    "CookingTime" = EXCLUDED."CookingTime";`);

      for (const ingredient of dish.ingredients) {
        lines.push(`
INSERT INTO "Ingredients" ("Id", "DishId", "Name", "Weight")
VALUES ('${ingredient.id}', '${dish.id}', '${sqlText(ingredient.name)}', ${ingredient.weight})
ON CONFLICT ("Id") DO UPDATE
SET "DishId" = EXCLUDED."DishId",
    "Name" = EXCLUDED."Name",
    "Weight" = EXCLUDED."Weight";`);
      }
    }
  }

  lines.push("COMMIT;");
  return lines.join("\n");
}

function sqlText(value) {
  return String(value).replace(/'/g, "''");
}

function menuQuery(sql) {
  return docker(
    [
      "exec",
      "-i",
      "df.menuservice.db",
      "psql",
      "-U",
      "MenuService",
      "-d",
      "MenuServiceDb",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: `${sql}\n` }
  );
}

function writeBusinessCatalog(businesses) {
  mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
  mkdirSync(FRONTEND_GENERATED_DIR, { recursive: true });
  const payload = businesses.map((business) => ({
    id: business.accountId,
    userId: business.userId,
    name: business.account.name,
    description: business.account.description,
    accountType: "Business",
    imageUrl: "",
    address: business.address.fullAddress,
    latitude: null,
    longitude: null,
  }));
  writeFileSync(BUSINESS_CATALOG_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  writeFileSync(
    BUSINESS_CATALOG_MODULE_PATH,
    `const seedBusinessCatalog = ${JSON.stringify(payload, null, 2)};\n\nexport default seedBusinessCatalog;\n`,
    "utf8"
  );
}

function writeCustomerDishCatalog(businesses) {
  mkdirSync(FRONTEND_GENERATED_DIR, { recursive: true });
  const payload = businesses.flatMap((business) =>
    business.dishes.map((dish) => ({
      id: dish.id,
      menuId: business.menu.id,
      name: dish.name,
      description: dish.description,
      imageUrl: "",
      price: dish.price,
      category: dish.category,
      businessId: business.accountId,
      cookingTime: dish.cookingTime,
      businessDetails: {
        id: business.accountId,
        name: business.account.name,
      },
      ingredients: dish.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        weight: ingredient.weight,
      })),
    }))
  );

  writeFileSync(
    CUSTOMER_DISH_MODULE_PATH,
    `const seedCustomerDishes = ${JSON.stringify(payload, null, 2)};\n\nexport default seedCustomerDishes;\n`,
    "utf8"
  );
}

async function safePromoCheck(customerAccountId) {
  try {
    const result = await request("POST", `${PROMO_API}/api/Promos/check`, {
      json: { code: "WELCOME10", userId: customerAccountId, orderTotal: 500 },
    });
    log(`PromoService check response: ${JSON.stringify(result)}`);
  } catch (error) {
    log(`PromoService check skipped: ${JSON.stringify(error.data ?? error.message)}`);
  }
}

async function seedOrders(customer, courier, businesses) {
  const customerProfile = await getProfile(customer.accessToken);
  const customerAccount =
    (customerProfile?.accounts ?? []).find(
      (account) => normalizeAccountType(account.accountType) === "customer"
    ) ?? customer.account;

  const courierProfile = await getProfile(courier.accessToken);
  const courierAccount =
    (courierProfile?.accounts ?? []).find(
      (account) => normalizeAccountType(account.accountType) === "courier"
    ) ?? courier.account;

  const existingActive = await request(
    "GET",
    `${ORDER_API}/api/Order/get-customer-orders?customerId=${customerAccount.id}`,
    { token: customer.accessToken }
  ).catch(() => []);

  const existingHistory = await request(
    "GET",
    `${ORDER_API}/api/Order/get-customer-history?customerId=${customerAccount.id}`,
    { token: customer.accessToken }
  ).catch(() => []);

  if ((existingActive?.length ?? 0) + (existingHistory?.length ?? 0) > 0) {
    log("Orders already exist for seeded customer, skipping order seeding");
    return;
  }

  const activeBusiness = businesses.find((business) => business.key === "pizza") ?? businesses[0];
  const historyBusiness = businesses.find((business) => business.key === "burger") ?? businesses[1];

  const orderPayloads = [
    {
      businessId: activeBusiness.accountId,
      orderedBy: customerAccount.id,
      orderDate: new Date().toISOString(),
      totalPrice: activeBusiness.dishes[0].price,
      deliveredBy: null,
      deliverFrom: { fullAddress: activeBusiness.address.fullAddress },
      deliverTo: { fullAddress: seedCustomer.account.Address },
      dishes: activeBusiness.dishes.slice(0, 1).map((dish) => ({
        orderId: ZERO_UUID,
        dishId: dish.id,
      })),
    },
    {
      businessId: historyBusiness.accountId,
      orderedBy: customerAccount.id,
      orderDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      totalPrice: historyBusiness.dishes[0].price,
      deliveredBy: courierAccount?.id ?? null,
      deliverFrom: { fullAddress: historyBusiness.address.fullAddress },
      deliverTo: { fullAddress: seedCustomer.account.Address },
      dishes: historyBusiness.dishes.slice(0, 1).map((dish) => ({
        orderId: ZERO_UUID,
        dishId: dish.id,
      })),
    },
  ];

  await request("POST", `${ORDER_API}/api/Order/create-orders`, {
    token: customer.accessToken,
    json: orderPayloads,
  });

  const activeAfter = await request(
    "GET",
    `${ORDER_API}/api/Order/get-customer-orders?customerId=${customerAccount.id}`,
    { token: customer.accessToken }
  );

  const burgerOrder = (activeAfter ?? []).find(
    (order) => String(order.businessId) === String(historyBusiness.accountId)
  );

  if (burgerOrder?.id && courierAccount?.id) {
    try {
      await request(
        "POST",
        `${ORDER_API}/api/Order/courier/deliver?orderId=${burgerOrder.id}&courierId=${courierAccount.id}`,
        { token: courier.accessToken }
      );
      await request(
        "PATCH",
        `${ORDER_API}/api/Order/status?orderId=${burgerOrder.id}&status=Delivered`,
        { token: businesses[0].auth.accessToken }
      );
    } catch (error) {
      log(`Order status setup partially failed: ${JSON.stringify(error.data ?? error.message)}`);
    }
  }
}

async function main() {
  log("Waiting for services");
  await waitForHttp(`${USER_API}/swagger/index.html`, "UserService");
  await waitForHttp(`${MENU_API}/swagger/index.html`, "MenuService");
  await waitForHttp(`${ORDER_API}/swagger/index.html`, "OrderService");
  await waitForHttp(`${PROMO_API}/swagger/index.html`, "PromoService");

  const businesses = [];

  for (const businessSeed of seedBusinesses) {
    const auth = await loginOrRegister(businessSeed.owner);
    const account = await ensureAccount(
      "business",
      auth,
      (existing) =>
        normalizeAccountType(existing.accountType) === "business" &&
        String(existing.name ?? "").trim().toLowerCase() ===
          businessSeed.account.name.toLowerCase(),
      {
        Name: businessSeed.account.name,
        Description: businessSeed.account.description,
        AccountType: businessSeed.account.accountType,
      }
    );

    businesses.push({
      ...businessSeed,
      auth,
      accountId: account.id,
      userId: account.userId,
    });
    log(`Business ready: ${businessSeed.account.name}`);
  }

  const customerAuth = await loginOrRegister(seedCustomer);
  const customerAccount = await ensureAccount(
    "customer",
    customerAuth,
    (existing) => normalizeAccountType(existing.accountType) === "customer",
    seedCustomer.account
  );
  log("Customer account ready");

  const courierAuth = await loginOrRegister(seedCourier);
  const courierAccount = await ensureAccount(
    "courier",
    courierAuth,
    (existing) => normalizeAccountType(existing.accountType) === "courier",
    seedCourier.account
  );
  log("Courier account ready");

  const adminAuth = await loginOrRegister(seedAdmin);
  const adminProfile = await getProfile(adminAuth.accessToken);
  ensureAdministratorRole(adminProfile.user.id);
  log("Administrator user ready");

  writeBusinessCatalog(businesses);
  log(`Business catalog written to ${BUSINESS_CATALOG_PATH}`);
  writeCustomerDishCatalog(businesses);
  log(`Customer dish catalog written to ${CUSTOMER_DISH_MODULE_PATH}`);

  menuQuery(upsertMenuAndDishesSql(businesses));
  log("Menus and dishes seeded");

  await seedOrders(
    { ...customerAuth, account: customerAccount },
    { ...courierAuth, account: courierAccount },
    businesses
  );
  log("Orders seed completed");

  await safePromoCheck(customerAccount.id);

  log("Seed completed successfully");
}

main().catch((error) => {
  console.error("[seed] Failed:", error?.data ?? error?.message ?? error);
  process.exitCode = 1;
});
