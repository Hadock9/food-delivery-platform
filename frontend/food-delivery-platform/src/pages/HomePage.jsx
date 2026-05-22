import React, { useMemo } from 'react';
import './styles/HomePage.css';

import UnauthenticatedHome from '../components/UnauthenticatedHome';
import CustomerHomePage from '../components/CustomerHomePage.jsx';
import BusinessDashboardHome from '../components/business/BusinessDashboardHome.jsx';
import CourierHomePage from '../components/curier/CourierHomePage.jsx';
import { useUser } from '../context/UserContext.jsx';
import { resolveAccountRole } from '../utils/accountRole.js';
import { buildBusinessUserData } from '../utils/businessUserData.js';

const HomePage = () => {
    const { user, accounts, currentAccountId, loading } = useUser();
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

    const accountType = useMemo(() => {
        const acc = accounts.find((a) => a.id === currentAccountId) ?? accounts[0];
        return resolveAccountRole(acc?.accountType)?.toLowerCase() ?? null;
    }, [accounts, currentAccountId]);

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

    switch (accountType) {
        case 'customer':
            return <CustomerHomePage userData={userData} />;
        case 'business':
            return <BusinessDashboardHome userData={businessUserData} />;
        case 'courier':
            return <CourierHomePage userData={userData} />;
        default:
            return <UnauthenticatedHome />;
    }
};

export default HomePage;
