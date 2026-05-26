const USER_API = process.env.SEED_USER_API_URL ?? "http://localhost:5001";
const MENU_API = process.env.SEED_MENU_API_URL ?? "http://localhost:5004";
const ORDER_API = process.env.SEED_ORDER_API_URL ?? "http://localhost:5005";
const TRACKING_API = process.env.SEED_TRACKING_API_URL ?? "http://localhost:5006";
const PROMO_API = process.env.SEED_PROMO_API_URL ?? "http://localhost:5007";
const ADMIN_API = process.env.SEED_ADMIN_API_URL ?? "http://localhost:5011";

const LOGIN = {
  email: "seed-customer@example.com",
  password: "Test123!",
};

const ADMIN_LOGIN = {
  email: "seed-admin@example.com",
  password: "Test123!",
};

function log(message) {
  console.log(`[smoke] ${message}`);
}

async function request(method, url, { token, json } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: json ? JSON.stringify(json) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${method} ${url}: ${text}`);
  }

  return data;
}

async function main() {
  await request("GET", `${USER_API}/swagger/v1/swagger.json`);
  await request("GET", `${ORDER_API}/swagger/v1/swagger.json`);
  await request("GET", `${PROMO_API}/health`);
  await request("GET", `${ADMIN_API}/health`);
  log("User/order/admin/promo health endpoints are reachable");

  const auth = await request("POST", `${USER_API}/api/Auth/login`, { json: LOGIN });
  const adminAuth = await request("POST", `${USER_API}/api/Auth/login`, { json: ADMIN_LOGIN });
  log("Seed admin login works");

  const adminProfile = await request("GET", `${USER_API}/api/Profile`, {
    token: adminAuth.accessToken,
  });
  if (adminProfile?.user?.userRole !== "Admin") {
    throw new Error(`Expected admin profile role to be Admin, got ${adminProfile?.user?.userRole ?? "missing"}`);
  }
  log("Admin profile role is real");
  const profile = await request("GET", `${USER_API}/api/Profile`, {
    token: auth.accessToken,
  });
  const customerAccount = (profile.accounts ?? []).find(
    (account) => String(account.accountType).toLowerCase() === "customer"
  );
  if (!customerAccount?.id) {
    throw new Error("Customer account is missing");
  }
  log(`Customer account: ${customerAccount.id}`);

  const adminUsers = await request("GET", `${ADMIN_API}/api/admin/users`, {
    token: adminAuth.accessToken,
  });
  if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
    throw new Error("Admin users endpoint returned no data");
  }
  log(`Admin users: ${adminUsers.length}`);

  const adminOrders = await request("GET", `${ADMIN_API}/api/admin/orders`, {
    token: adminAuth.accessToken,
  });
  if (!Array.isArray(adminOrders) || adminOrders.length === 0) {
    throw new Error("Admin orders endpoint returned no data");
  }
  log(`Admin orders: ${adminOrders.length}`);

  const categories = await request("GET", `${ADMIN_API}/api/admin/categories`, {
    token: adminAuth.accessToken,
  });
  if (!Array.isArray(categories) || categories.length < 10) {
    throw new Error("Admin categories endpoint returned too few categories");
  }
  log(`Admin categories: ${categories.length}`);

  const businesses = await request("GET", `${ADMIN_API}/api/admin/businesses`, {
    token: adminAuth.accessToken,
  });
  if (!Array.isArray(businesses) || businesses.length === 0) {
    throw new Error("Admin businesses endpoint returned no data");
  }
  log(`Admin businesses: ${businesses.length}`);

  let businessWithDishes = null;
  for (const business of businesses) {
    const adminDishes = await request(
      "GET",
      `${ADMIN_API}/api/admin/dishes?businessId=${business.id}`,
      { token: adminAuth.accessToken }
    );
    if (Array.isArray(adminDishes) && adminDishes.length > 0) {
      businessWithDishes = { business, adminDishes };
      break;
    }
  }
  if (!businessWithDishes) {
    throw new Error("Admin dishes endpoint returned no data for any business");
  }
  log(`Admin dishes for ${businessWithDishes.business.name}: ${businessWithDishes.adminDishes.length}`);

  const dashboard = await request("GET", `${ADMIN_API}/api/admin/dashboard`, {
    token: adminAuth.accessToken,
  });
  if (!dashboard?.totalOrders && dashboard?.totalOrders !== 0) {
    throw new Error("Admin dashboard summary is missing totalOrders");
  }
  log(`Admin dashboard total orders: ${dashboard.totalOrders}`);

  const promos = await request("GET", `${PROMO_API}/api/Promos`, {
    token: adminAuth.accessToken,
  });
  if (!Array.isArray(promos) || promos.length === 0) {
    throw new Error("Promo admin list returned no seeded promos");
  }
  log(`Promo list: ${promos.length}`);

  const promo = await request("POST", `${PROMO_API}/api/Promos/check`, {
    json: {
      code: "ADMIN10",
      userId: customerAccount.id,
      orderTotal: 500,
    },
  });
  if (!promo?.valid) {
    throw new Error("PromoService did not validate the seeded promo code");
  }
  log(`Promo check succeeded with discount ${promo.discountAmount}`);

  log("Smoke check passed");
}

main().catch((error) => {
  console.error("[smoke] Failed:", error?.message ?? error);
  process.exitCode = 1;
});
