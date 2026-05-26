import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { readStore, updateStore } from "./store.js";
import { allowInternalOrAdmin } from "./auth.js";

const app = express();

app.use(
  cors({
    origin: [config.corsOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

function normalizePromo(promo) {
  return {
    ...promo,
    discountValue: Number(promo.discountValue || 0),
    minOrderTotal: Number(promo.minOrderTotal || 0),
    maxUses: promo.maxUses == null ? null : Number(promo.maxUses),
    usedCount: Number(promo.usedCount || 0),
    isActive: Boolean(promo.isActive),
  };
}

function resolvePromoDiscount(promo, orderTotal) {
  if (promo.discountType === "fixed") {
    return Math.min(orderTotal, Number(promo.discountValue || 0));
  }

  return Math.min(orderTotal, (orderTotal * Number(promo.discountValue || 0)) / 100);
}

function validatePromo(promo, { code, userId, orderTotal }) {
  if (!promo || promo.code.toLowerCase() !== String(code || "").trim().toLowerCase()) {
    return { valid: false, message: "Промокод не знайдено." };
  }

  if (!promo.isActive) {
    return { valid: false, message: "Промокод вимкнено." };
  }

  const now = new Date();
  if (promo.validFrom && new Date(promo.validFrom) > now) {
    return { valid: false, message: "Промокод ще не активний." };
  }
  if (promo.validTo && new Date(promo.validTo) < now) {
    return { valid: false, message: "Термін дії промокоду минув." };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { valid: false, message: "Ліміт використань вичерпано." };
  }
  if (promo.personalUserId && String(promo.personalUserId) !== String(userId || "")) {
    return { valid: false, message: "Цей промокод персональний." };
  }
  if (Number(orderTotal || 0) < Number(promo.minOrderTotal || 0)) {
    return {
      valid: false,
      message: `Мінімальна сума замовлення: ${promo.minOrderTotal} ₴.`,
    };
  }

  const discountAmount = resolvePromoDiscount(promo, Number(orderTotal || 0));
  return {
    valid: true,
    discountAmount,
    finalTotal: Math.max(0, Number(orderTotal || 0) - discountAmount),
    promo: normalizePromo(promo),
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "promo-service" });
});

app.get("/api/Promos", allowInternalOrAdmin, async (_req, res) => {
  const store = await readStore();
  res.json(store.promos.map(normalizePromo));
});

app.get("/api/Promos/analytics", allowInternalOrAdmin, async (_req, res) => {
  const store = await readStore();
  const totalRedemptions = store.redemptions.length;
  const discountAmountTotal = store.redemptions.reduce(
    (sum, redemption) => sum + Number(redemption.discountAmount || 0),
    0
  );

  const topPromos = [...store.promos]
    .sort((a, b) => Number(b.usedCount || 0) - Number(a.usedCount || 0))
    .slice(0, 5)
    .map((promo) => ({
      id: promo.id,
      code: promo.code,
      usedCount: Number(promo.usedCount || 0),
      discountValue: Number(promo.discountValue || 0),
      discountType: promo.discountType,
    }));

  res.json({
    totalPromos: store.promos.length,
    activePromos: store.promos.filter((promo) => promo.isActive).length,
    totalRedemptions,
    discountAmountTotal,
    topPromos,
  });
});

app.post("/api/Promos", allowInternalOrAdmin, async (req, res) => {
  const now = new Date().toISOString();
  const promo = {
    id: crypto.randomUUID(),
    code: String(req.body.code || "").trim().toUpperCase(),
    title: String(req.body.title || req.body.code || "").trim(),
    description: String(req.body.description || "").trim(),
    discountType: req.body.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(req.body.discountValue || 0),
    minOrderTotal: Number(req.body.minOrderTotal || 0),
    maxUses: req.body.maxUses == null || req.body.maxUses === "" ? null : Number(req.body.maxUses),
    usedCount: 0,
    personalUserId: req.body.personalUserId || null,
    validFrom: req.body.validFrom || now,
    validTo: req.body.validTo || null,
    isActive: req.body.isActive == null ? true : Boolean(req.body.isActive),
    createdAt: now,
    updatedAt: now,
  };

  if (!promo.code) {
    return res.status(400).json({ message: "Promo code is required." });
  }

  await updateStore((store) => {
    if (store.promos.some((entry) => entry.code.toLowerCase() === promo.code.toLowerCase())) {
      throw new Error("Промокод із таким кодом уже існує.");
    }
    store.promos.push(promo);
    return store;
  }).catch((error) =>
    res.status(409).json({ message: "Failed to create promo.", detail: error.message })
  );

  if (res.headersSent) return;
  res.status(201).json(normalizePromo(promo));
});

app.put("/api/Promos/:promoId", allowInternalOrAdmin, async (req, res) => {
  const nextState = await updateStore((store) => {
    const promo = store.promos.find((entry) => entry.id === req.params.promoId);
    if (!promo) {
      throw new Error("NOT_FOUND");
    }

    promo.code = String(req.body.code ?? promo.code).trim().toUpperCase();
    promo.title = String(req.body.title ?? promo.title).trim();
    promo.description = String(req.body.description ?? promo.description).trim();
    promo.discountType = req.body.discountType === "fixed" ? "fixed" : req.body.discountType === "percent" ? "percent" : promo.discountType;
    promo.discountValue = Number(req.body.discountValue ?? promo.discountValue ?? 0);
    promo.minOrderTotal = Number(req.body.minOrderTotal ?? promo.minOrderTotal ?? 0);
    promo.maxUses =
      req.body.maxUses == null || req.body.maxUses === "" ? promo.maxUses : Number(req.body.maxUses);
    promo.personalUserId = req.body.personalUserId ?? promo.personalUserId ?? null;
    promo.validFrom = req.body.validFrom ?? promo.validFrom;
    promo.validTo = req.body.validTo ?? promo.validTo;
    promo.isActive = req.body.isActive == null ? promo.isActive : Boolean(req.body.isActive);
    promo.updatedAt = new Date().toISOString();

    return store;
  }).catch((error) => {
    if (error.message === "NOT_FOUND") {
      res.status(404).json({ message: "Promo not found." });
      return null;
    }

    res.status(500).json({ message: "Failed to update promo.", detail: error.message });
    return null;
  });

  if (!nextState || res.headersSent) return;
  const updated = nextState.promos.find((entry) => entry.id === req.params.promoId);
  res.json(normalizePromo(updated));
});

app.delete("/api/Promos/:promoId", allowInternalOrAdmin, async (req, res) => {
  await updateStore((store) => {
    store.promos = store.promos.filter((entry) => entry.id !== req.params.promoId);
    return store;
  });

  res.status(204).send();
});

app.post("/api/Promos/check", async (req, res) => {
  const store = await readStore();
  const promo = store.promos.find(
    (entry) => entry.code.toLowerCase() === String(req.body.code || "").trim().toLowerCase()
  );
  res.json(validatePromo(normalizePromo(promo), req.body));
});

app.post("/api/Promos/apply", async (req, res) => {
  const store = await readStore();
  const promo = store.promos.find(
    (entry) => entry.code.toLowerCase() === String(req.body.code || "").trim().toLowerCase()
  );
  const validation = validatePromo(normalizePromo(promo), req.body);

  if (!validation.valid) {
    return res.json(validation);
  }

  const nextState = await updateStore((current) => {
    const mutablePromo = current.promos.find((entry) => entry.id === promo.id);
    mutablePromo.usedCount = Number(mutablePromo.usedCount || 0) + 1;
    mutablePromo.updatedAt = new Date().toISOString();

    current.redemptions.push({
      id: crypto.randomUUID(),
      promoId: mutablePromo.id,
      code: mutablePromo.code,
      userId: req.body.userId || null,
      orderTotal: Number(req.body.orderTotal || 0),
      discountAmount: validation.discountAmount,
      appliedAt: new Date().toISOString(),
    });

    return current;
  });

  const updatedPromo = nextState.promos.find((entry) => entry.id === promo.id);
  res.json({
    ...validation,
    promo: normalizePromo(updatedPromo),
  });
});

app.listen(config.port, () => {
  console.log(`Promo service listening on http://localhost:${config.port}`);
});
