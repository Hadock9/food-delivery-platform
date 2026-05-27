/** Нормалізує тип акаунта з API (рядок) або localStorage (число/рядок) до ролі. */
export function resolveAccountRole(raw) {
    if (raw == null || raw === "") return null;

    const byNumber = { 0: "Customer", 1: "Business", 2: "Courier" };
    const n = Number(raw);
    if (!Number.isNaN(n) && byNumber[n] != null) return byNumber[n];

    const key = String(raw).trim().toLowerCase();
    const byString = {
        customer: "Customer",
        business: "Business",
        courier: "Courier",
    };
    return byString[key] ?? null;
}

/** Значення для localStorage (0 | 1 | 2). */
export function accountTypeToStorageValue(accountType) {
    if (accountType == null || accountType === "") return null;
    const n = Number(accountType);
    if (!Number.isNaN(n) && n >= 0 && n <= 2) return String(n);

    const map = { customer: "0", business: "1", courier: "2" };
    const key = String(accountType).trim().toLowerCase();
    return map[key] ?? null;
}
