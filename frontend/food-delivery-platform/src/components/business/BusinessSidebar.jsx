import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Package, UtensilsCrossed, Tag, LineChart, User } from "lucide-react";
import { ROUTES } from "../../utils/roleRoutes.js";
import { resolveRestaurantImage, handleImageError } from "../../utils/images.js";

const SIDEBAR_ITEMS = [
    { id: "dashboard", label: "Головна", icon: BarChart2, path: ROUTES.business.root },
    { id: "orders", label: "Замовлення", icon: Package, path: ROUTES.business.orders },
    { id: "dishes", label: "Меню", icon: UtensilsCrossed, path: ROUTES.business.dishes },
    { id: "promos", label: "Промокоди", icon: Tag, path: ROUTES.business.promos },
    { id: "analytics", label: "Аналітика", icon: LineChart, path: ROUTES.business.analytics },
    { id: "profile", label: "Профіль", icon: User, path: ROUTES.profile },
];

function resolveActiveId(pathname) {
    const exact = SIDEBAR_ITEMS.find((item) => item.path === pathname);
    if (exact) return exact.id;
    if (pathname === ROUTES.business.root || pathname.startsWith(`${ROUTES.business.root}/`) && pathname.split("/").length <= 3) {
        if (pathname === ROUTES.business.root) return "dashboard";
    }
    if (pathname.startsWith(ROUTES.business.orders)) return "orders";
    if (pathname.startsWith(ROUTES.business.dishes)) return "dishes";
    if (pathname.startsWith(ROUTES.business.promos)) return "promos";
    if (pathname.startsWith(ROUTES.business.analytics)) return "analytics";
    if (pathname.startsWith(ROUTES.profile)) return "profile";
    if (pathname === ROUTES.business.root) return "dashboard";
    return "dashboard";
}

export default function BusinessSidebar({ userData }) {
    const navigate = useNavigate();
    const location = useLocation();

    const businessName = userData?.currentAccount?.name || "Мій заклад";
    const businessLogo = resolveRestaurantImage(
        userData?.currentAccount,
        userData?.currentAccount?.id,
        businessName
    );

    const activeId = resolveActiveId(location.pathname);

    return (
        <aside className="bh-sidebar">
            <div className="bh-brand">
                <div className="bh-logo">
                    <img
                        src={businessLogo}
                        alt="Логотип"
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
