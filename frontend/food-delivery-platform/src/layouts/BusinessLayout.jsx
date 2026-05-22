import React, { useMemo } from "react";
import { Outlet } from "react-router-dom";
import BusinessSidebar from "../components/business/BusinessSidebar.jsx";
import { useUser } from "../context/UserContext.jsx";
import { buildBusinessUserData } from "../utils/businessUserData.js";
import "../components/styles/BusinessHomePage.css";
import "../components/styles/Layout.css";

/** Зона бізнесу: панель закладу */
export default function BusinessLayout() {
    const { user, accounts, currentAccountId, loading } = useUser();

    const userData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    if (loading) {
        return (
            <div className="bh-page bh-page--loading">
                <div className="bh-empty">Завантаження…</div>
            </div>
        );
    }

    return (
        <div className="app-shell app-shell--business bh-page">
            <BusinessSidebar userData={userData} />
            <div className="bh-main-wrap">
                <Outlet context={{ userData }} />
            </div>
        </div>
    );
}
