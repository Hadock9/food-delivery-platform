import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import "../components/styles/BusinessHomePage.css";

export default function AdminLayout() {
    return (
        <div className="bh-page">
            <AdminSidebar />
            <Outlet />
        </div>
    );
}
