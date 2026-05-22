import { Router } from "express";
import { handleWebhookEvent } from "../services/paymentService.js";

const router = Router();

router.post("/payment", async (req, res) => {
  try {
    const result = await handleWebhookEvent(req.body);
    res.json(result);
  } catch (e) {
    console.error("webhook", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
