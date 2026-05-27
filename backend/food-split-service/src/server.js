import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import apiRoutes from "./routes/api.js";
import webhookRoutes from "./routes/webhook.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import { runPaymentTimeoutSweep } from "./services/paymentService.js";

const app = express();
app.use(
  cors({
    origin: [config.corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true, service: "food-split" }));
app.use("/api/food-split", apiRoutes);
app.use("/webhooks", webhookRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [config.corsOrigin, "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log(`[socket] connected ${socket.id}`);
  registerSocketHandlers(io, socket);
  socket.on("disconnect", () => console.log(`[socket] disconnected ${socket.id}`));
});

setInterval(() => {
  runPaymentTimeoutSweep().catch((e) => console.error("timeout sweep", e));
}, 60_000);

httpServer.listen(config.port, () => {
  console.log(`Food Split service: http://localhost:${config.port}`);
  console.log(`Socket.io path: /socket.io`);
});
