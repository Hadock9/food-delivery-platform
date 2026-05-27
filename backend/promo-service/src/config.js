import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 5007,
  dataFile: process.env.PROMO_DATA_FILE || "/data/promos.json",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET || "food-delivery-platform-jwt-key-1234567890!",
    issuer: process.env.JWT_ISSUER || "df.userservice",
    audience: process.env.JWT_AUDIENCE || "df.userservice.client",
  },
};
