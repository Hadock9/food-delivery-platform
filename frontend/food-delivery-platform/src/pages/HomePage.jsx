import React, { useMemo } from 'react';
import './styles/HomePage.css';

import UnauthenticatedHome from '../components/UnauthenticatedHome';
import CustomerHomePage from '../components/CustomerHomePage.jsx';
import BusinessDashboardHome from '../components/business/BusinessDashboardHome.jsx';
import CourierHomePage from '../components/curier/CourierHomePage.jsx';
import AdminHomePage from './AdminHomePage.jsx';
import { useUser } from '../context/UserContext.jsx';
import { resolveAppRole } from '../utils/appRole.js';
import { buildBusinessUserData } from '../utils/businessUserData.js';

const HomePage = () => {
    const { user, accounts, currentAccountId, currentSystemRole, loading } = useUser();
    const token = localStorage.getItem('accessToken');

    const userData = useMemo(() => {
        if (!user) return null;
        const currentAccount =
            accounts.find((a) => a.id === currentAccountId) ?? accounts[0] ?? null;
        return {
            user,
            accounts,
            currentAccount,
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
        };
    }, [user, accounts, currentAccountId]);

    const appRole = useMemo(
        () => resolveAppRole(user, accounts, currentAccountId, currentSystemRole),
        [user, accounts, currentAccountId, currentSystemRole]
    );

    const businessUserData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    if (loading) {
        return (
            <div
                className="page-wrapper"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <div className="loading-spinner">Завантаження…</div>
            </div>
        );
    }

    if (!token || !user) {
        return <UnauthenticatedHome />;
    }

    switch (appRole) {
        case 'Admin':
            return <AdminHomePage />;
        case 'Customer':
            return <CustomerHomePage userData={userData} />;
        case 'Business':
            return <BusinessDashboardHome userData={businessUserData} />;
        case 'Courier':
            return <CourierHomePage userData={userData} />;
        default:
            return <UnauthenticatedHome />;
    }
};

export default HomePage;
