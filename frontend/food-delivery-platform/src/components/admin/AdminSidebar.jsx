import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Package, UtensilsCrossed, TicketPercent, User } from "lucide-react";
import { ROUTES } from "../../utils/roleRoutes.js";
import "../styles/BusinessHomePage.css";

const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Головна", icon: LayoutDashboard, path: ROUTES.admin },
    { id: "users", label: "Користувачі", icon: Users, path: ROUTES.adminUsers },
    { id: "orders", label: "Замовлення", icon: Package, path: ROUTES.adminOrders },
    { id: "menu", label: "Меню", icon: UtensilsCrossed, path: ROUTES.adminMenu },
    { id: "promos", label: "Промокоди", icon: TicketPercent, path: ROUTES.adminPromos },
    { id: "profile", label: "Профіль", icon: User, path: ROUTES.profile },
];

function resolveActiveId(pathname) {
    if (pathname.startsWith(ROUTES.adminUsers)) return "users";
    if (pathname.startsWith(ROUTES.adminOrders)) return "orders";
    if (pathname.startsWith(ROUTES.adminMenu)) return "menu";
    if (pathname.startsWith(ROUTES.adminPromos)) return "promos";
    if (pathname.startsWith(ROUTES.profile)) return "profile";
    return "dashboard";
}

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeId = resolveActiveId(location.pathname);

    return (
        <aside className="bh-sidebar">
            <div className="bh-brand">
                <div className="bh-logo" aria-hidden="true">
                    AD
                </div>
                <div className="bh-title">Адмінка</div>
            </div>

            <nav className="bh-nav">
                {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`bh-nav-item ${isActive ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
