import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '../utils/roleRoutes.js';
import './styles/WelcomeBanner.css';

const ROLE_COPY = {
    customer: {
        subtitle: 'Обирайте страви, додавайте в кошик і замовляйте доставку.',
        cta: { to: ROUTES.customer.restaurants, label: 'Заклади' },
    },
    business: {
        subtitle: 'Керуйте меню, замовленнями та статистикою вашого закладу.',
        cta: { to: ROUTES.business.orders, label: 'Замовлення' },
    },
    courier: {
        subtitle: 'Переглядайте нові доставки та оновлюйте статус замовлень.',
        cta: { to: ROUTES.courier.root, label: 'Доставки' },
    },
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Доброго ранку';
    if (h < 18) return 'Доброго дня';
    return 'Доброго вечора';
}

const WelcomeBanner = ({ userData, role = 'customer' }) => {
    const roleKey = role?.toLowerCase() ?? 'customer';
    const copy = ROLE_COPY[roleKey] ?? ROLE_COPY.customer;

    const displayName =
        userData?.currentAccount?.name ||
        userData?.user?.name ||
        userData?.name ||
        'друже';

    return (
        <section className="welcome-banner" aria-label="Привітання">
            <div className="welcome-banner-glow" aria-hidden="true" />
            <div className="welcome-banner-inner">
                <span className="welcome-banner-icon">
                    <Sparkles size={20} />
                </span>
                <div className="welcome-banner-text">
                    <p className="welcome-banner-greeting">
                        {getGreeting()}, <strong>{displayName}</strong>
                    </p>
                    <p className="welcome-banner-sub">{copy.subtitle}</p>
                </div>
                {copy.cta && (
                    <Link to={copy.cta.to} className="welcome-banner-cta">
                        {copy.cta.label}
                    </Link>
                )}
            </div>
        </section>
    );
};

export default WelcomeBanner;
