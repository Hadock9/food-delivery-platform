import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { resolveAccountRole } from './accountRole.js';

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
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (loading) {
        return (
            <div className="page-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
                Завантаження...
            </div>
        );
    }

    if (roles?.length) {
        const currentAcc = accounts.find((a) => a.id === currentAccountId);
        const fromContext = resolveAccountRole(currentAcc?.accountType);
        const fromStorage = resolveAccountRole(localStorage.getItem('currentAccountType'));
        const currentRole = fromContext ?? fromStorage;

        if (!currentRole || !roles.includes(currentRole)) {
            const hasNeededAccount = accounts.some((a) =>
                roles.includes(resolveAccountRole(a.accountType))
            );
            if (hasNeededAccount) {
                return (
                    <Navigate
                        to="/profile"
                        replace
                        state={{
                            cartHint: true,
                            neededRole: roles[0],
                            from: location.pathname,
                        }}
                    />
                );
            }
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
