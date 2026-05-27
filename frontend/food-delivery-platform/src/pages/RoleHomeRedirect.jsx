import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { resolveAppRole } from "../utils/appRole.js";
import { ROUTES, homePathForRole } from "../utils/roleRoutes.js";
import UnauthenticatedHome from "../components/UnauthenticatedHome.jsx";

/** `/` — гість бачить лендінг, авторизований — редірект у свою зону */
export default function RoleHomeRedirect() {
    const { user, accounts, currentAccountId, currentSystemRole, loading } = useUser();
    const token = localStorage.getItem("accessToken");

    const role = useMemo(() => {
        return resolveAppRole(user, accounts, currentAccountId, currentSystemRole);
    }, [user, accounts, currentAccountId, currentSystemRole]);

    if (loading) {
        return (
            <div className="page-wrapper" style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
                Завантаження…
            </div>
        );
    }

    if (!token || !user) {
        return <UnauthenticatedHome />;
    }

    if (role) {
        const target = homePathForRole(role);
        if (target !== ROUTES.home) {
            return <Navigate to={target} replace />;
        }
    }

    return <UnauthenticatedHome />;
}
