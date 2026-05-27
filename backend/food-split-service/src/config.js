import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 5010,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://OrderService:OrderService2025!@localhost:5435/OrderServiceDb",
  jwt: {
    secret: process.env.JWT_SECRET || "food-delivery-platform-jwt-key-1234567890!",
    issuer: process.env.JWT_ISSUER || "df.userservice",
    audience: process.env.JWT_AUDIENCE || "df.userservice.client",
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  orderServiceUrl: process.env.ORDER_SERVICE_URL || "http://localhost:5005/api/Order",
  holdTimeoutMs: Number(process.env.PAYMENT_HOLD_TIMEOUT_MS) || 10 * 60 * 1000,
  fees: {
    delivery: Number(process.env.DEFAULT_DELIVERY_FEE) || 79,
    servicePercent: Number(process.env.DEFAULT_SERVICE_FEE_PERCENT) || 5,
    tipsPercent: Number(process.env.DEFAULT_TIPS_PERCENT) || 0,
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
};
