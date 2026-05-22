import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout.jsx";
import CustomerLayout from "./layouts/CustomerLayout.jsx";
import BusinessLayout from "./layouts/BusinessLayout.jsx";
import RoleHomeRedirect from "./pages/RoleHomeRedirect.jsx";
import LoginForm from "./pages/LoginForm.jsx";
import RegisterForm from "./pages/RegisterForm.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import CustomerHomePage from "./components/CustomerHomePage.jsx";
import RestaurantsPage from "./pages/RestaurantsPage.jsx";
import RestaurantDetailsPage from "./pages/RestaurantDetailsPage.jsx";
import DishPage from "./pages/DishPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import CustomerOrdersPage from "./pages/CustomerOrdersPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import BusinessOrdersPage from "./pages/BusinessOrdersPage";
import BusinessDishesPage from "./pages/BusinessDishesPage.jsx";
import BusinessStubPage from "./pages/BusinessStubPage.jsx";
import BusinessDashboardHome from "./components/business/BusinessDashboardHome.jsx";
import CourierHomePage from "./components/curier/CourierHomePage.jsx";
import GroupCartPage from "./features/food-split/GroupCartPage.jsx";
import CreateGroupSplitPage from "./features/food-split/CreateGroupSplitPage.jsx";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import RequireActiveRole from "./utils/RequireActiveRole.jsx";
import { ROUTES } from "./utils/roleRoutes.js";
import { Tag, LineChart } from "lucide-react";

const LegacyRedirect = ({ to }) => <Navigate to={to} replace />;

const LegacyRestaurantRedirect = () => {
    const { id } = useParams();
    return <Navigate to={ROUTES.customer.restaurant(id)} replace />;
};

const LegacyDishRedirect = () => {
    const { id } = useParams();
    return <Navigate to={ROUTES.customer.dish(id)} replace />;
};

const LegacyTrackingRedirect = () => {
    const { orderId } = useParams();
    return <Navigate to={ROUTES.customer.tracking(orderId)} replace />;
};

const LegacySplitRedirect = () => {
    const { sessionId } = useParams();
    return <Navigate to={ROUTES.customer.split(sessionId)} replace />;
};

const AppRouter = () => {
    return (
        <Router basename="/food-delivery-platform">
            <Routes>
                {/* ——— Публічна зона (хедер, без сайдбару) ——— */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<RoleHomeRedirect />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
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
                </Route>

                {/* ——— Клієнтська зона ——— */}
                <Route
                    path="/customer"
                    element={
                        <RequireActiveRole role="Customer">
                            <CustomerLayout />
                        </RequireActiveRole>
                    }
                >
                    <Route
                        index
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CustomerHomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="restaurants" element={<RestaurantsPage />} />
                    <Route path="restaurant/:id" element={<RestaurantDetailsPage />} />
                    <Route path="dish/:id" element={<DishPage />} />
                    <Route
                        path="cart"
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CartPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="checkout"
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CheckoutPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="orders"
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CustomerOrdersPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="tracking/:orderId"
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <TrackingPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="split/create"
                        element={
                            <ProtectedRoute roles={["Customer"]}>
                                <CreateGroupSplitPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="split/:sessionId" element={<GroupCartPage />} />
                </Route>

                {/* ——— Бізнес-зона ——— */}
                <Route
                    path="/business"
                    element={
                        <ProtectedRoute roles={["Business"]}>
                            <RequireActiveRole role="Business">
                                <BusinessLayout />
                            </RequireActiveRole>
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<BusinessDashboardHome />} />
                    <Route path="orders" element={<BusinessOrdersPage />} />
                    <Route path="dishes" element={<BusinessDishesPage />} />
                    <Route
                        path="promos"
                        element={
                            <BusinessStubPage
                                title="Промокоди"
                                description="Розділ у розробці. Тут буде керування промокодами для вашого закладу."
                                icon={Tag}
                            />
                        }
                    />
                    <Route
                        path="analytics"
                        element={
                            <BusinessStubPage
                                title="Аналітика"
                                description="Розділ у розробці. Тут буде статистика продажів та замовлень."
                                icon={LineChart}
                            />
                        }
                    />
                </Route>

                {/* ——— Курʼєр ——— */}
                <Route
                    path="/courier"
                    element={
                        <ProtectedRoute roles={["Courier"]}>
                            <RequireActiveRole role="Courier">
                                <CourierHomePage />
                            </RequireActiveRole>
                        </ProtectedRoute>
                    }
                />

                {/* Старі URL → нова структура */}
                <Route path="/restaurants" element={<LegacyRedirect to={ROUTES.customer.restaurants} />} />
                <Route path="/restaurant/:id" element={<LegacyRestaurantRedirect />} />
                <Route path="/cart" element={<LegacyRedirect to={ROUTES.customer.cart} />} />
                <Route path="/checkout" element={<LegacyRedirect to={ROUTES.customer.checkout} />} />
                <Route path="/orders" element={<LegacyRedirect to={ROUTES.customer.orders} />} />
                <Route path="/tracking/:orderId" element={<LegacyTrackingRedirect />} />
                <Route path="/dish/:id" element={<LegacyDishRedirect />} />
                <Route path="/split/create" element={<LegacyRedirect to={ROUTES.customer.splitCreate} />} />
                <Route path="/split/:sessionId" element={<LegacySplitRedirect />} />
                <Route path="/dashboard" element={<LegacyRedirect to={ROUTES.business.root} />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
