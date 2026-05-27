import React, { useMemo } from "react";
import { useUser } from "../context/UserContext.jsx";
import BusinessHomePage from "../components/BusinessHomePage.jsx";
import { buildBusinessUserData } from "../utils/businessUserData.js";
import "../components/styles/BusinessHomePage.css";

export default function BusinessDishesPage() {
    const { user, accounts, currentAccountId, loading } = useUser();

    const userData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    if (loading) {
        return (
            <main className="bh-main" style={{ placeItems: "center" }}>
                <div className="bh-empty">Завантаження…</div>
            </main>
        );
    }

    return <BusinessHomePage userData={userData} />;
}
