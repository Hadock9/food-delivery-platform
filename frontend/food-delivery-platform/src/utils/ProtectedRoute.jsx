import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { resolveAccountRole } from './accountRole.js';
import { resolveAppRole } from './appRole.js';
import { homePathForRole, ROUTES } from './roleRoutes.js';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - "Admin" | "Customer" | "Business" | "Courier"
 */
const ProtectedRoute = ({ children, roles }) => {
    const location = useLocation();
    const { loading, user, accounts, currentAccountId, currentSystemRole } = useUser();
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
    }

    if (loading) {
        return (
            <div className="page-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
                Завантаження...
            </div>
        );
    }

    if (roles?.length) {
        const currentRole = resolveAppRole(user, accounts, currentAccountId, currentSystemRole);
        const hasRequiredAccount = accounts.some((a) =>
            roles.includes(resolveAccountRole(a.accountType))
        );
        const hasAccess = roles.includes("Admin")
            ? currentRole === "Admin"
            : hasRequiredAccount;

        if (!hasAccess) {
            const fallback = accounts[0]
                ? homePathForRole(resolveAppRole(user, accounts, accounts[0].id, currentSystemRole))
                : ROUTES.profile;
            return <Navigate to={fallback} replace />;
        }

        const activeRoleOk = currentRole && roles.includes(currentRole);
        if (!activeRoleOk && !roles.includes("Admin")) {
            return <Navigate to={homePathForRole(currentRole) || ROUTES.profile} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
