import express from "express";
import cors from "cors";
import adminRoutes, { ensureAdminSchema } from "./routes/admin.js";
import { config } from "./config.js";

const app = express();

app.use(
  cors({
    origin: [config.corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "admin-service" });
});

app.use("/api/admin", adminRoutes);

await ensureAdminSchema();

app.listen(config.port, () => {
  console.log(`Admin service listening on http://localhost:${config.port}`);
});
