// src/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/HeaderComponent.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginForm from "./pages/LoginForm.jsx";
import RegisterForm from "./pages/RegisterForm.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import DishPage from "./pages/DishPage.jsx";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx"; // ← НОВИЙ ІМПОРТ
import RestaurantsPage from "./pages/RestaurantsPage.jsx";
import RestaurantDetailsPage from './pages/RestaurantDetailsPage';
import CustomerOrdersPage from "./pages/CustomerOrdersPage.jsx";
import BusinessOrdersPage from "./pages/BusinessOrdersPage";
import BusinessDishesPage from "./pages/BusinessDishesPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const AppRouter = () => {
    return (
        <Router basename="/food-delivery-platform">
            <div className="app-container">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/dish/:id" element={<DishPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CheckoutPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/restaurants" element={<RestaurantsPage />} />
                        <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} />
                        <Route path="/customer/orders" element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CustomerOrdersPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/orders" element={<Navigate to="/customer/orders" replace />} />
                        <Route path="/tracking/:orderId" element={
                            <ProtectedRoute roles={["Customer"]}>
                                <TrackingPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/business/orders" element={
                            <ProtectedRoute roles={["Business"]}>
                                <BusinessOrdersPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/business/dishes" element={
                            <ProtectedRoute roles={["Business"]}>
                                <BusinessDishesPage />
                            </ProtectedRoute>
                        } />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/account/create"
                            element={
                                <ProtectedRoute>
                                    <CreateAccountPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute roles={["Business"]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default AppRouter;