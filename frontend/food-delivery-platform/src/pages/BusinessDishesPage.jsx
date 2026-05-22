import React, { useMemo } from "react";
import { useUser } from "../context/UserContext.jsx";
import BusinessHomePage from "../components/BusinessHomePage.jsx";
import { buildBusinessUserData } from "../utils/businessUserData.js";

export default function BusinessDishesPage() {
    const { user, accounts, currentAccountId, loading } = useUser();

    const userData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    if (loading) {
        return (
            <div className="page-wrapper" style={{ padding: "2rem", textAlign: "center" }}>
                Завантаження...
            </div>
        );
    }

    return <BusinessHomePage userData={userData} />;
}
