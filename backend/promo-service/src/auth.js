import jwt from "jsonwebtoken";
import { config } from "./config.js";

const ROLE_CLAIMS = [
  "role",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function allowInternalOrAdmin(req, res, next) {
  if (req.headers.authorization === "internal") {
    return next();
  }

  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing bearer token." });
    }

    const payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const role = ROLE_CLAIMS.map((key) => payload?.[key]).find(Boolean);
    if (!["Admin", "Administrator"].includes(String(role || ""))) {
      return res.status(403).json({ message: "Administrator access required." });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
      detail: error?.message || "JWT validation failed.",
    });
  }
}
