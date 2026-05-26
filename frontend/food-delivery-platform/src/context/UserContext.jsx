// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { getProfileData, switchAccount } from "../api/Profile.jsx";
import { refresh, logout } from "../api/Auth.jsx";
import { accountTypeToStorageValue } from "../utils/accountRole.js";
import { CURRENT_SYSTEM_ROLE_KEY, isAdminEligible } from "../utils/appRole.js";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [currentAccountId, setCurrentAccountId] = useState(null);
    const [currentSystemRole, setCurrentSystemRole] = useState(
        localStorage.getItem(CURRENT_SYSTEM_ROLE_KEY)
    );
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            let token = localStorage.getItem("accessToken");
            if (!token) {
                return null;
            }
            const data = await getProfileData(token);
            setUser(data.user);
            setAccounts(data.accounts);
            setCurrentAccountId(data.currentAccount.id);
            const adminEligible = isAdminEligible(data.user);

            // Зберігаємо accountType у localStorage
            const currentAcc = data.accounts.find(a => a.id === data.currentAccount.id);

            if (currentAcc) {
                const storedType = accountTypeToStorageValue(currentAcc.accountType);
                if (storedType != null) {
                    localStorage.setItem("currentAccountType", storedType);
                }
                localStorage.setItem("currentAccountId", data.currentAccount.id);
            }

            const storedSystemRole = localStorage.getItem(CURRENT_SYSTEM_ROLE_KEY);
            if (adminEligible) {
                const nextSystemRole = storedSystemRole ?? "Admin";
                localStorage.setItem(CURRENT_SYSTEM_ROLE_KEY, nextSystemRole);
                setCurrentSystemRole(nextSystemRole);
            } else {
                localStorage.removeItem(CURRENT_SYSTEM_ROLE_KEY);
                setCurrentSystemRole(null);
            }
            return data;
        } catch (err) {
            if (err?.response?.status !== 401) {
                console.error("Load user error:", err);
            }
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const handleSwitchAccount = async (accountId) => {
        try {
            localStorage.setItem(CURRENT_SYSTEM_ROLE_KEY, "Account");
            setCurrentSystemRole("Account");
            let token = localStorage.getItem("accessToken");
            if (!token) {
                const tokens = await refresh();
                token = tokens.accessToken;
            }

            await switchAccount(accountId, token);
            await loadUser(); // оновлюємо дані

            // ПЕРЕЗАВАНТАЖУЄМО СТОРІНКУ ПІСЛЯ ПЕРЕМИКАННЯ
            window.location.reload();
        } catch (err) {
            console.error("Switch account error:", err);
        }
    };

    const handleSwitchSystemRole = (role) => {
        if (role) {
            localStorage.setItem(CURRENT_SYSTEM_ROLE_KEY, role);
            setCurrentSystemRole(role);
        } else {
            localStorage.removeItem(CURRENT_SYSTEM_ROLE_KEY);
            setCurrentSystemRole(null);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.warn("Logout error:", err);
        } finally {
            localStorage.clear();
            window.location.href = "/food-delivery-platform/";
        }
    };

    return (
        <UserContext.Provider
            value={{
                user,
                accounts,
                currentAccountId,
                currentSystemRole,
                loading,
                reloadUser: loadUser,
                switchAccount: handleSwitchAccount,
                switchSystemRole: handleSwitchSystemRole,
                logout: handleLogout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);