import React from "react";
import { Outlet } from "react-router-dom";
import CustomerSidebar from "../components/customer-components/CustomerSidebar.jsx";
import "../components/styles/CustomerHomePage.css";
import "../components/styles/Layout.css";

/** Зона клієнта: меню зліва, без глобального хедера */
export default function CustomerLayout() {
    return (
        <div className="app-shell app-shell--customer app-wrapper">
            <CustomerSidebar />
            <main className="app-shell-main layout-main customer-layout-main">
                <Outlet />
            </main>
        </div>
    );
}
