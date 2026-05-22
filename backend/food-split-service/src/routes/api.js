import { Router } from "express";
import { verifyAccessToken } from "../auth.js";
import { createSession, getRoomState } from "../services/roomService.js";
import { calculateSplit } from "../services/splitCalculator.js";
import {
  startPaymentPhase,
  authorizePayment,
  releaseSessionPayments,
} from "../services/paymentService.js";

const router = Router();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const auth = verifyAccessToken(header);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  req.userId = auth.userId;
  next();
}

router.post("/sessions", requireAuth, async (req, res) => {
  try {
    const { businessId, expiresInMinutes } = req.body;
    if (!businessId) return res.status(400).json({ error: "businessId required" });

    const created = await createSession({
      hostUserId: req.userId,
      businessId,
      expiresInMinutes: expiresInMinutes ?? 120,
    });
    const room = await getRoomState(created.sessionId);
    res.status(201).json({ ...created, room });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  const room = await getRoomState(req.params.sessionId);
  if (!room) return res.status(404).json({ error: "Not found" });
  const split = await calculateSplit(req.params.sessionId);
  res.json({ room, split });
});

router.get("/sessions/:sessionId/split", async (req, res) => {
  const split = await calculateSplit(req.params.sessionId);
  res.json(split);
});

router.post("/sessions/:sessionId/payment/start", requireAuth, async (req, res) => {
  try {
    const result = await startPaymentPhase(req.params.sessionId, req.headers.authorization);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/payments/:intentId/authorize", async (req, res) => {
  const result = await authorizePayment(req.params.intentId);
  if (result.error) return res.status(404).json(result);
  res.json(result);
});

router.post("/sessions/:sessionId/cancel", requireAuth, async (req, res) => {
  await releaseSessionPayments(req.params.sessionId);
  res.json({ ok: true });
});

export default router;
