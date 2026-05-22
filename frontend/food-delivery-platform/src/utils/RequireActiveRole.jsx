import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { resolveAccountRole } from "./accountRole.js";
import { homePathForRole } from "./roleRoutes.js";

/**
 * Активний акаунт має збігатися з зоною (Customer / Business).
 * Інакше — редірект на «домашню» сторінку поточної ролі.
 */
export default function RequireActiveRole({ role, children }) {
    const location = useLocation();
    const { loading, accounts, currentAccountId } = useUser();

    if (loading) {
        return (
            <div className="page-wrapper" style={{ padding: "2rem", textAlign: "center" }}>
                Завантаження...
            </div>
        );
    }

    const currentAcc = accounts.find((a) => a.id === currentAccountId);
    const fromContext = resolveAccountRole(currentAcc?.accountType);
    const fromStorage = resolveAccountRole(localStorage.getItem("currentAccountType"));
    const activeRole = fromContext ?? fromStorage;

    if (activeRole && activeRole !== role) {
        const target = homePathForRole(activeRole);
        if (location.pathname !== target) {
            return <Navigate to={target} replace state={{ reason: "wrong-zone", expected: role }} />;
        }
    }

    return children;
}
