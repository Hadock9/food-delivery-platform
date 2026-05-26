import jwt from "jsonwebtoken";
import { config } from "./config.js";

const ROLE_CLAIMS = [
  "role",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

const USER_ID_CLAIMS = [
  "sub",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function getClaim(payload, candidates) {
  for (const key of candidates) {
    if (payload?.[key] != null) return payload[key];
  }
  return null;
}

export function requireAdmin(req, res, next) {
  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing bearer token." });
    }

    const payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    const role = String(getClaim(payload, ROLE_CLAIMS) || "").trim();
    if (!["Admin", "Administrator"].includes(role)) {
      return res.status(403).json({ message: "Administrator access required." });
    }

    req.user = {
      id: getClaim(payload, USER_ID_CLAIMS),
      email: payload?.email || payload?.unique_name || null,
      role,
      claims: payload,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
      detail: error?.message || "JWT validation failed.",
    });
  }
}
