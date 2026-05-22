import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Store, User, Package } from "lucide-react";
import { ROUTES } from "../../utils/roleRoutes.js";
import "../styles/CustomerHomePage.css";

const NAV = [
    { path: ROUTES.customer.root, label: "Головна", icon: Home, end: true },
    { path: ROUTES.customer.restaurants, label: "Заклади", icon: Store },
    { path: ROUTES.customer.cart, label: "Кошик", icon: ShoppingCart },
    { path: ROUTES.customer.orders, label: "Замовлення", icon: Package },
    { path: ROUTES.profile, label: "Профіль", icon: User },
];

const CustomerSidebar = () => {
    const location = useLocation();

    const isActive = (path, end) => {
        if (end) return location.pathname === path;
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <aside className="customer-sidebar">
            <Link to={ROUTES.customer.root} className="sidebar-logo">
                FoodEx
            </Link>

            <nav className="sidebar-nav">
                {NAV.map(({ path, label, icon: Icon, end }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`sidebar-item ${isActive(path, end) ? "active" : ""}`}
                    >
                        <Icon size={22} /> <span>{label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default CustomerSidebar;
