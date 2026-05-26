import { resolveAccountRole } from "./accountRole.js";

export const CURRENT_SYSTEM_ROLE_KEY = "currentSystemRole";
export const ADMIN_ACCOUNT_ID = "__admin__";

const ADMIN_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="24" fill="#1e293b"/>
  <circle cx="48" cy="32" r="14" fill="#f8fafc"/>
  <path d="M24 76c5-14 17-22 24-22s19 8 24 22" fill="#7c5cff"/>
  <path d="M48 10l4 8 9 1-6 6 2 9-9-5-9 5 2-9-6-6 9-1z" fill="#fbbf24"/>
</svg>
`)}`;

export function resolveSystemRole(raw) {
    const value = String(raw ?? "").trim().toLowerCase();
    if (!value) return null;
    if (value === "administrator" || value === "admin") return "Admin";
    return null;
}

export function isAdminEligible(user) {
    return resolveSystemRole(user?.userRole) === "Admin";
}

export function buildAdminAccount(user) {
    if (!isAdminEligible(user)) return null;
    return {
        id: ADMIN_ACCOUNT_ID,
        userId: user?.id ?? null,
        name: "Адміністратор",
        accountType: "Admin",
        imageUrl: ADMIN_AVATAR,
        isSystemRole: true,
    };
}

export function resolveAppRole(user, accounts = [], currentAccountId = null, currentSystemRole = null) {
    if (isAdminEligible(user)) {
        if (currentSystemRole === "Account") {
            // explicit switch away from the admin pseudo-account
        } else if (currentSystemRole === "Admin" || currentSystemRole == null) {
            return "Admin";
        }
    }

    const activeAccount =
        accounts.find((account) => account.id === currentAccountId) ??
        accounts.find((account) => String(account.id) === String(currentAccountId)) ??
        accounts[0];

    return resolveAccountRole(activeAccount?.accountType);
}

export function isAdminUser(user) {
    return isAdminEligible(user);
}
