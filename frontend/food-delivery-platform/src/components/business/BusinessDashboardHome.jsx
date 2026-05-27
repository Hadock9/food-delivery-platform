import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, UtensilsCrossed, BarChart2, User, ChefHat } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import WelcomeBanner from '../WelcomeBanner.jsx';
import { ROUTES } from '../../utils/roleRoutes.js';
import '../styles/BusinessHomePage.css';

const QUICK_LINKS = [
    {
        id: 'orders',
        title: 'Замовлення',
        description: 'Переглядайте та оновлюйте статуси замовлень',
        path: ROUTES.business.orders,
        icon: Package,
    },
    {
        id: 'dishes',
        title: 'Меню та страви',
        description: 'Додавайте, редагуйте та керуйте позиціями меню',
        path: ROUTES.business.dishes,
        icon: UtensilsCrossed,
    },
    {
        id: 'dashboard',
        title: 'Статистика',
        description: 'Огляд показників закладу (скоро)',
        path: ROUTES.business.analytics,
        icon: BarChart2,
    },
    {
        id: 'profile',
        title: 'Профіль закладу',
        description: 'Налаштування акаунта та перемикання ролей',
        path: ROUTES.profile,
        icon: User,
    },
];

export default function BusinessDashboardHome() {
    const navigate = useNavigate();
    const { userData } = useOutletContext() ?? {};
    const businessName = userData?.currentAccount?.name ?? 'Ваш заклад';

    return (
            <main className="bh-main bh-dashboard">
                <WelcomeBanner userData={userData} role="business" />
                <header className="bh-dashboard-hero">
                    <div className="bh-dashboard-icon">
                        <ChefHat size={28} />
                    </div>
                    <div>
                        <p className="bh-dashboard-greeting">Панель керування</p>
                        <h1 className="bh-heading">{businessName}</h1>
                        <p className="bh-dashboard-sub">
                            Ласкаво просимо! Оберіть розділ або перейдіть до керування меню.
                        </p>
                    </div>
                </header>

                <div className="bh-dashboard-grid">
                    {QUICK_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="bh-dashboard-card"
                                onClick={() => navigate(item.path)}
                            >
                                <span className="bh-dashboard-card-icon">
                                    <Icon size={22} />
                                </span>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </button>
                        );
                    })}
                </div>

                <p className="bh-dashboard-hint">
                    Повне керування стравами — у розділі{' '}
                    <button type="button" className="bh-link-btn" onClick={() => navigate(ROUTES.business.dishes)}>
                        Меню
                    </button>
                </p>
            </main>
    );
}
