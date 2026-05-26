import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { resolveAppRole } from "./appRole.js";
import { homePathForRole } from "./roleRoutes.js";

/**
 * Активний акаунт має збігатися з зоною (Customer / Business).
 * Інакше — редірект на «домашню» сторінку поточної ролі.
 */
export default function RequireActiveRole({ role, children }) {
    const location = useLocation();
    const { loading, user, accounts, currentAccountId, currentSystemRole } = useUser();

    if (loading) {
        return (
            <div className="page-wrapper" style={{ padding: "2rem", textAlign: "center" }}>
                Завантаження...
            </div>
        );
    }

    const activeRole = resolveAppRole(user, accounts, currentAccountId, currentSystemRole);

    if (activeRole && activeRole !== role) {
        const target = homePathForRole(activeRole);
        if (location.pathname !== target) {
            return <Navigate to={target} replace state={{ reason: "wrong-zone", expected: role }} />;
        }
    }

    return children;
}
