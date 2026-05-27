import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";

const DEFAULT_STATE = {
  promos: [
    {
      id: crypto.randomUUID(),
      code: "ADMIN10",
      title: "Знижка 10%",
      description: "Базовий промокод для smoke-check і адмінки.",
      discountType: "percent",
      discountValue: 10,
      minOrderTotal: 200,
      maxUses: 100,
      usedCount: 0,
      personalUserId: null,
      validFrom: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      validTo: new Date("2027-01-01T00:00:00.000Z").toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  redemptions: [],
};

let writeChain = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  try {
    await fs.access(config.dataFile);
  } catch {
    await fs.writeFile(config.dataFile, JSON.stringify(DEFAULT_STATE, null, 2));
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(config.dataFile, "utf8");
  return JSON.parse(raw);
}

export async function writeStore(nextState) {
  await ensureStore();
  writeChain = writeChain.then(() =>
    fs.writeFile(config.dataFile, JSON.stringify(nextState, null, 2))
  );
  return writeChain;
}

export async function updateStore(mutator) {
  const current = await readStore();
  const nextState = await mutator(structuredClone(current));
  await writeStore(nextState);
  return nextState;
}
