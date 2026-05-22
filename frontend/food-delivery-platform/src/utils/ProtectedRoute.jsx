import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { resolveAccountRole } from './accountRole.js';
import { homePathForRole, ROUTES } from './roleRoutes.js';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - "Customer" | "Business" | "Courier"
 */
const ProtectedRoute = ({ children, roles }) => {
    const location = useLocation();
    const { loading, accounts, currentAccountId } = useUser();
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
        const hasRequiredAccount = accounts.some((a) =>
            roles.includes(resolveAccountRole(a.accountType))
        );

        if (!hasRequiredAccount) {
            const fallback = accounts[0]
                ? homePathForRole(resolveAccountRole(accounts[0].accountType))
                : ROUTES.profile;
            return <Navigate to={fallback} replace />;
        }

        const currentAcc = accounts.find((a) => a.id === currentAccountId);
        const fromContext = resolveAccountRole(currentAcc?.accountType);
        const fromStorage = resolveAccountRole(localStorage.getItem('currentAccountType'));
        const currentRole = fromContext ?? fromStorage;

        const activeRoleOk = currentRole && roles.includes(currentRole);
        if (!activeRoleOk && !hasRequiredAccount) {
            return <Navigate to={homePathForRole(currentRole) || ROUTES.profile} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
