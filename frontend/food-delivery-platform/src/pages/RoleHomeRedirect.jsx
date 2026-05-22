import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { resolveAccountRole } from "../utils/accountRole.js";
import { ROUTES, homePathForRole } from "../utils/roleRoutes.js";
import UnauthenticatedHome from "../components/UnauthenticatedHome.jsx";

/** `/` — гість бачить лендінг, авторизований — редірект у свою зону */
export default function RoleHomeRedirect() {
    const { user, accounts, currentAccountId, loading } = useUser();
    const token = localStorage.getItem("accessToken");

    const role = useMemo(() => {
        const acc = accounts.find((a) => a.id === currentAccountId) ?? accounts[0];
        return resolveAccountRole(acc?.accountType);
    }, [accounts, currentAccountId]);

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
