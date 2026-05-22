import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    UtensilsCrossed, Clock, ShieldCheck, Store, ChevronRight,
    Truck, Users, Sparkles
} from 'lucide-react';
import { getAllBusinessAccounts } from '../api/Account.jsx';
import { getAllDishesForCustomer } from '../api/Dish.jsx';
import { CategoryMap } from '../constants/category.jsx';
import { resolveDishImage, resolveRestaurantImage, handleImageError } from '../utils/images.js';
import DishCardComponent from './customer-components/DishCardComponent';
import { ROUTES } from '../utils/roleRoutes.js';
import '../pages/styles/HomePage.css';

const mapDish = (d) => {
    const image = resolveDishImage(
        d,
        CategoryMap[d.category],
        d.name,
        d.businessDetails?.id
    );
    return {
        id: d.id,
        name: d.name,
        businessId: d.businessDetails?.id,
        image,
        imageUrl: image,
        rating: 4.5,
        restaurant: d.businessDetails?.name ?? 'Ресторан',
        price: d.price,
        category: CategoryMap[d.category],
        popular: false,
    };
};

const UnauthenticatedHome = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadPreview = async () => {
            try {
                const [businesses, allDishes] = await Promise.all([
                    getAllBusinessAccounts().catch(() => []),
                    getAllDishesForCustomer().catch(() => []),
                ]);

                if (cancelled) return;

                setRestaurants(
                    (businesses ?? []).slice(0, 6).map((r) => ({
                        id: r.id,
                        name: r.name,
                        image: resolveRestaurantImage(r, r.id, r.name),
                        description: r.description ?? 'Смачні страви з доставкою',
                    }))
                );

                const mapped = (allDishes ?? []).map(mapDish);
                setDishes(mapped.slice(0, 8));
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        };

        loadPreview();
        return () => {
            cancelled = true;
        };
    }, []);

    const stats = [
        { value: restaurants.length > 0 ? `${restaurants.length}+` : '50+', label: 'Закладів' },
        { value: dishes.length > 0 ? `${dishes.length}+` : '200+', label: 'Страв у меню' },
        { value: '25 хв', label: 'Середня доставка' },
        { value: '4.8', label: 'Середній рейтинг' },
    ];

    return (
        <div className="guest-home">
            <section className="guest-hero">
                <div className="guest-hero-visual" aria-hidden="true">
                    <div className="guest-hero-orb guest-hero-orb--1" />
                    <div className="guest-hero-orb guest-hero-orb--2" />
                </div>
                <motion.div
                    className="guest-hero-card"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="guest-badge">
                        <Sparkles size={14} /> Ласкаво просимо до FoodEx
                    </p>
                    <h1 className="guest-title">Ваша улюблена їжа — за кілька кліків</h1>
                    <p className="guest-subtitle">
                        Відкрийте меню ресторанів міста, оберіть страви та замовте доставку додому.
                        Без реєстрації можна переглядати заклади — увійдіть, щоб оформити замовлення.
                    </p>
                    <div className="cta-buttons">
                        <Link className="cta-button cta-button--primary" to={ROUTES.customer.restaurants}>
                            Переглянути заклади
                        </Link>
                        <Link className="cta-button cta-button--register" to="/register">
                            Створити акаунт
                        </Link>
                        <Link className="cta-button" to="/login">
                            Увійти
                        </Link>
                    </div>
                </motion.div>
            </section>

            <section className="guest-stats" aria-label="Статистика сервісу">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="guest-stat"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                    >
                        <span className="guest-stat-value">{s.value}</span>
                        <span className="guest-stat-label">{s.label}</span>
                    </motion.div>
                ))}
            </section>

            <section className="guest-features">
                <div className="guest-feature">
                    <UtensilsCrossed size={22} />
                    <div>
                        <strong>Сотні страв</strong>
                        <span>Різні кухні та заклади</span>
                    </div>
                </div>
                <div className="guest-feature">
                    <Clock size={22} />
                    <div>
                        <strong>Швидка доставка</strong>
                        <span>Відстеження замовлення</span>
                    </div>
                </div>
                <div className="guest-feature">
                    <Truck size={22} />
                    <div>
                        <strong>Надійні курʼєри</strong>
                        <span>Доставка до дверей</span>
                    </div>
                </div>
                <div className="guest-feature">
                    <ShieldCheck size={22} />
                    <div>
                        <strong>Зручна оплата</strong>
                        <span>Безпечне оформлення</span>
                    </div>
                </div>
            </section>

            <section className="guest-how">
                <h2 className="guest-section-title guest-how-title">Як це працює</h2>
                <ol className="guest-how-steps">
                    <li><Users size={18} /> Оберіть заклад або страву</li>
                    <li><UtensilsCrossed size={18} /> Додайте позиції в кошик</li>
                    <li><Truck size={18} /> Оформіть доставку та відстежуйте</li>
                </ol>
            </section>

            {(previewLoading || restaurants.length > 0) && (
                <section className="guest-section">
                    <div className="guest-section-header">
                        <h2 className="guest-section-title">Популярні заклади</h2>
                        <Link to={ROUTES.customer.restaurants} className="guest-section-link">
                            Усі заклади
                        </Link>
                    </div>
                    {previewLoading ? (
                        <div className="guest-skeleton-row">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="guest-skeleton-card" />
                            ))}
                        </div>
                    ) : (
                        <div className="guest-restaurants-scroll">
                            {restaurants.map((r, index) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                >
                                    <Link to={ROUTES.customer.restaurant(r.id)} className="guest-restaurant-card">
                                        <img
                                            src={r.image}
                                            alt={r.name}
                                            onError={(e) =>
                                                handleImageError(
                                                    e,
                                                    resolveRestaurantImage(null, r.id, r.name)
                                                )
                                            }
                                        />
                                        <div className="guest-restaurant-info">
                                            <Store size={16} />
                                            <h3>{r.name}</h3>
                                            <p>{r.description}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {(previewLoading || dishes.length > 0) && (
                <section className="guest-section">
                    <div className="guest-section-header">
                        <h2 className="guest-section-title">Спробуйте зараз</h2>
                        <p className="guest-section-hint">Увійдіть, щоб додати в кошик</p>
                    </div>
                    {previewLoading ? (
                        <div className="guest-dishes-grid guest-dishes-grid--loading">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="guest-skeleton-dish" />
                            ))}
                        </div>
                    ) : (
                        <div className="guest-dishes-grid">
                            {dishes.map((dish, index) => (
                                <motion.div
                                    key={dish.id}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <DishCardComponent dish={dish} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <section className="guest-footer-cta">
                <h2>Готові замовляти?</h2>
                <p>Створіть акаунт клієнта за хвилину — і ваше улюблене меню завжди під рукою.</p>
                <div className="cta-buttons">
                    <Link className="cta-button cta-button--primary" to="/register">
                        Почати
                    </Link>
                    <Link className="cta-button" to="/login">
                        У мене вже є акаунт
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default UnauthenticatedHome;
