/**
 * Normalizes UserContext / profile data for business layout components.
 */
export function buildBusinessUserData(user, accounts, currentAccountId) {
    const currentAccount =
        accounts?.find((a) => a.id === currentAccountId) ??
        accounts?.find((a) => String(a.id) === String(currentAccountId));

    return {
        user,
        accounts,
        currentAccount,
        id: user?.id,
        name: user?.name,
        surname: user?.surname,
        email: user?.email,
    };
}
