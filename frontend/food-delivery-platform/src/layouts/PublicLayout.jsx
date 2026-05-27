import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/HeaderComponent.jsx";
import "../components/styles/Layout.css";

/** Публічні сторінки: головна для гостей, вхід, реєстрація, профіль */
export default function PublicLayout() {
    return (
        <div className="app-shell app-shell--public">
            <Header />
            <main className="app-shell-main">
                <Outlet />
            </main>
        </div>
    );
}
