// src/components/business/BusinessSidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Package, Filter, Users } from "lucide-react";
import { resolveRestaurantImage, handleImageError } from "../../utils/images.js";

const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Панель", icon: BarChart2, path: "/dashboard" },
    { id: "orders", label: "Замовлення", icon: Package, path: "/business/orders" },
    { id: "dishes", label: "Меню", icon: Filter, path: "/business/dishes" },
    { id: "staff", label: "Персонал", icon: Users, path: "/profile" },
];

export default function BusinessSidebar({ userData }) {
    const navigate = useNavigate();
    const location = useLocation();

    const businessName = userData?.currentAccount?.name || "My Restaurant";
    const businessLogo = resolveRestaurantImage(
        userData?.currentAccount,
        userData?.currentAccount?.id,
        businessName
    );

    const activeId =
        SIDEBAR_ITEMS.find((item) => location.pathname === item.path)?.id ||
        "dashboard";

    return (
        <aside className="bh-sidebar">
            <div className="bh-brand">
                <div className="bh-logo">
                    <img
                        src={businessLogo}
                        alt="Logo"
                        onError={(e) =>
                            handleImageError(
                                e,
                                resolveRestaurantImage(null, userData?.currentAccount?.id, businessName)
                            )
                        }
                    />
                </div>
                <div className="bh-title">{businessName}</div>
            </div>

            <nav className="bh-nav">
                {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;

                    return (
                        <button
                            key={item.id}
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