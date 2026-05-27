import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Package, TicketPercent, Users, UtensilsCrossed } from "lucide-react";
import { getAdminDashboard } from "../api/Admin.jsx";
import { ROUTES } from "../utils/roleRoutes.js";
import "./styles/AdminDashboard.css";
import "./styles/AdminPanels.css";

export default function AdminHomePage() {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminDashboard()
            .then(setDashboard)
            .catch((err) => {
                console.error("Failed to load admin dashboard", err);
                setError("Не вдалося завантажити статистику адмінки.");
            });
    }, []);

    const metrics = [
        { label: "Замовлення", value: dashboard?.totalOrders ?? "—" },
        { label: "Активні доставки", value: dashboard?.activeDeliveries ?? "—" },
        { label: "Продажі, ₴", value: dashboard?.grossSales ?? "—" },
        { label: "Заклади", value: dashboard?.businessCount ?? "—" },
    ];

    return (
        <main className="bh-main admin-panel">
            <header className="bh-top">
                <div>
                    <h1 className="bh-heading">
                        <LayoutDashboard size={26} style={{ marginRight: 10, verticalAlign: "middle" }} />
                        Admin Dashboard
                    </h1>
                    <p className="admin-subtitle">
                        Глобальний огляд користувачів, меню, замовлень і промокодів.
                    </p>
                </div>
            </header>

            {error && <div className="bh-empty error">{error}</div>}

            <section className="admin-metrics">
                {metrics.map((metric) => (
                    <article key={metric.label} className="admin-metric-card">
                        <div className="label">{metric.label}</div>
                        <div className="value">{metric.value}</div>
                    </article>
                ))}
            </section>

            <section className="admin-grid-2">
                <div className="admin-panel-card">
                    <h3>Швидкі переходи</h3>
                    <div className="admin-cards">
                        <Link to={ROUTES.adminUsers} className="admin-card">
                            <Users size={24} />
                            <h3>Користувачі</h3>
                            <p>Ролі, блокування та редагування профілів.</p>
                        </Link>
                        <Link to={ROUTES.adminOrders} className="admin-card">
                            <Package size={24} />
                            <h3>Замовлення</h3>
                            <p>Глобальна стрічка з фільтрами та зміною статусів.</p>
                        </Link>
                        <Link to={ROUTES.adminMenu} className="admin-card">
                            <UtensilsCrossed size={24} />
                            <h3>Меню</h3>
                            <p>Страви, категорії та керування закладами.</p>
                        </Link>
                        <Link to={ROUTES.adminPromos} className="admin-card">
                            <TicketPercent size={24} />
                            <h3>Промокоди</h3>
                            <p>CRUD промо та аналітика використання.</p>
                        </Link>
                    </div>
                </div>

                <div className="admin-panel-card">
                    <h3>Топ-страви</h3>
                    <div className="admin-list">
                        {(dashboard?.topDishes ?? []).length === 0 ? (
                            <div className="bh-empty">Поки немає даних.</div>
                        ) : (
                            dashboard.topDishes.map((dish) => (
                                <div key={dish.id} className="admin-list-item">
                                    <div>
                                        <strong>{dish.name}</strong>
                                    </div>
                                    <span className="admin-pill">{dish.orderCount} замовлень</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
