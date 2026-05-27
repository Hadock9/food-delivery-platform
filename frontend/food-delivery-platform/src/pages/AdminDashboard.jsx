import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart2, Package, UtensilsCrossed, Tag, User, LineChart } from "lucide-react";
import BusinessSidebar from "../components/business/BusinessSidebar.jsx";
import { useUser } from "../context/UserContext.jsx";
import { buildBusinessUserData } from "../utils/businessUserData.js";
import "../components/styles/BusinessHomePage.css";
import "./styles/AdminDashboard.css";

const AdminDashboard = () => {
    const { user, accounts, currentAccountId, loading } = useUser();
    const userData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    const cards = [
        { title: "Замовлення", icon: Package, path: "/business/orders", desc: "Статуси та фільтри" },
        { title: "Меню", icon: UtensilsCrossed, path: "/business/dishes", desc: "Додавання та редагування страв" },
        { title: "Промокоди", icon: Tag, path: "/business/promos", desc: "Незабаром (MVP)" },
        { title: "Аналітика", icon: LineChart, path: "/business/analytics", desc: "Незабаром (MVP)" },
        { title: "Профіль", icon: User, path: "/profile", desc: "Акаунт та адреси закладу" },
    ];

    if (loading) {
        return (
            <div className="bh-page" style={{ placeItems: "center" }}>
                <div className="bh-empty">Завантаження…</div>
            </div>
        );
    }

    return (
        <div className="bh-page">
            <BusinessSidebar userData={userData} />
            <main className="bh-main admin-dashboard">
                <header className="bh-top">
                    <h1 className="bh-heading">
                        <BarChart2 size={28} style={{ marginRight: 10, verticalAlign: "middle" }} />
                        Панель керування
                    </h1>
                </header>
                <p className="admin-subtitle">Керування рестораном</p>
                <section className="bh-content">
                    <div className="admin-cards">
                        {cards.map((c) => (
                            <Link key={c.title} to={c.path} className="admin-card">
                                <c.icon size={28} />
                                <h3>{c.title}</h3>
                                <p>{c.desc}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
