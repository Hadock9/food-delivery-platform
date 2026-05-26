import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 5011,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET || "food-delivery-platform-jwt-key-1234567890!",
    issuer: process.env.JWT_ISSUER || "df.userservice",
    audience: process.env.JWT_AUDIENCE || "df.userservice.client",
  },
  userDb: {
    server: process.env.USER_DB_SERVER || "localhost",
    port: Number(process.env.USER_DB_PORT) || 11433,
    user: process.env.USER_DB_USER || "sa",
    password: process.env.USER_DB_PASSWORD || "StrongPass123!",
    database: process.env.USER_DB_NAME || "UserServiceDb",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  orderDbUrl:
    process.env.ORDER_DB_URL ||
    "postgresql://OrderService:OrderService2025!@localhost:5435/OrderServiceDb",
  menuDbUrl:
    process.env.MENU_DB_URL ||
    "postgresql://MenuService:MenuService2025!@localhost:5436/MenuServiceDb",
  promoServiceUrl:
    process.env.PROMO_SERVICE_URL || "http://localhost:5007/api/Promos",
};
