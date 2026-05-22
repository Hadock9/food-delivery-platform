/**
 * Normalizes UserContext / profile data for business layout components.
 */
export function buildBusinessUserData(user, accounts, currentAccountId) {
    const businessAccount = resolveBusinessAccount(accounts, currentAccountId);

    return {
        user,
        accounts,
        currentAccount: businessAccount,
        id: user?.id,
        name: user?.name,
        surname: user?.surname,
        email: user?.email,
    };
}

function isBusinessAccount(account) {
    return String(account?.accountType ?? "").toLowerCase() === "business";
}

/** Active or first Business account from profile accounts list. */
export function resolveBusinessAccount(accounts, currentAccountId) {
    if (!accounts?.length) return null;

    const byId =
        accounts.find((a) => a.id === currentAccountId) ??
        accounts.find((a) => String(a.id) === String(currentAccountId));

    if (byId && isBusinessAccount(byId)) return byId;

    return accounts.find(isBusinessAccount) ?? null;
}

/** GUID used for Order/Menu API calls (business account id, not user id). */
export function getBusinessAccountId(accounts, currentAccountId) {
    const account = resolveBusinessAccount(accounts, currentAccountId);
    return account?.id ?? localStorage.getItem("currentAccountId") ?? null;
}
