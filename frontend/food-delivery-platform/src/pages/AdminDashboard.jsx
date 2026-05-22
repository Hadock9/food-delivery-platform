import React from "react";
import { Link } from "react-router-dom";
import { BarChart2, Package, Users, UtensilsCrossed, Tag } from "lucide-react";
import BusinessSidebar from "../components/business/BusinessSidebar.jsx";
import { useUser } from "../context/UserContext.jsx";
import { buildBusinessUserData } from "../utils/businessUserData.js";
import "./styles/AdminDashboard.css";

const AdminDashboard = () => {
    const { user, accounts, currentAccountId } = useUser();
    const userData = buildBusinessUserData(user, accounts, currentAccountId);

    const cards = [
        { title: "Замовлення", icon: Package, path: "/business/orders", desc: "Статуси та фільтри" },
        { title: "Меню", icon: UtensilsCrossed, path: "/business/dishes", desc: "CRUD страв" },
        { title: "Промокоди", icon: Tag, path: "/checkout", desc: "WELCOME10, SAVE50 (MVP)" },
        { title: "Профіль", icon: Users, path: "/profile", desc: "Акаунт бізнесу" },
    ];

    return (
        <div className="admin-dashboard-layout">
            <BusinessSidebar userData={userData} />
            <main className="admin-dashboard">
                <h1><BarChart2 size={32} /> Адмін-панель</h1>
                <p className="subtitle">Керування рестораном (MVP)</p>
                <div className="admin-cards">
                    {cards.map((c) => (
                        <Link key={c.title} to={c.path} className="admin-card">
                            <c.icon size={28} />
                            <h3>{c.title}</h3>
                            <p>{c.desc}</p>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
