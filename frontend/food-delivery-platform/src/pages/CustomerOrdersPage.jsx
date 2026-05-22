import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./styles/CustomerOrdersPage.css";
import { ROUTES } from "../utils/roleRoutes.js";
import OrderDetailsComponent from "../components/OrderDetailsComponent.jsx";
import DeliveryMapWidget from "../components/map/DeliveryMapWidget.jsx";
import { getCustomerOrders, getCustomerOrderHistory } from "../api/Order.jsx";
import { useUser } from "../context/UserContext.jsx";
import { resolveAccountRole } from "../utils/accountRole.js";
import { mapCustomerOrder, getStatusDisplay } from "../utils/orderStatus.js";

const CustomerOrdersPage = () => {
    const { loading: userLoading, accounts, currentAccountId } = useUser();
    const [activeTab, setActiveTab] = useState("active");
    const [activeOrders, setActiveOrders] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const currentAcc = accounts.find((a) => a.id === currentAccountId);
    const isCustomer =
        resolveAccountRole(currentAcc?.accountType) === "Customer" ||
        resolveAccountRole(localStorage.getItem("currentAccountType")) === "Customer";

    const customerId =
        isCustomer && currentAccountId
            ? currentAccountId
            : accounts.find((a) => resolveAccountRole(a.accountType) === "Customer")?.id;

    const loadOrders = useCallback(async () => {
        if (!customerId) {
            setActiveOrders([]);
            setHistoryOrders([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const [active, history] = await Promise.all([
                getCustomerOrders(customerId),
                getCustomerOrderHistory(customerId),
            ]);
            setActiveOrders((active ?? []).map(mapCustomerOrder));
            setHistoryOrders((history ?? []).map(mapCustomerOrder));
        } catch (e) {
            console.error("Failed to load orders", e);
            const msg =
                e?.response?.status === 401
                    ? "Увійдіть у систему, щоб переглянути замовлення"
                    : e?.response?.status === 403
                      ? "Немає доступу до замовлень"
                      : "Не вдалося завантажити замовлення. Перевірте, що OrderService запущений (порт 5005).";
            setError(msg);
            setActiveOrders([]);
            setHistoryOrders([]);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (!userLoading) {
            loadOrders();
        }
    }, [userLoading, loadOrders]);

    const orders = activeTab === "active" ? activeOrders : historyOrders;

    const statusMapForModal = {
        preparing: { label: "Готується", color: "#ffb86b", emoji: "🍳" },
        ready: { label: "Готово", color: "#50fa7b", emoji: "✅" },
        "on-the-way": { label: "В дорозі", color: "#00d4ff", emoji: "🏍️" },
        delivered: { label: "Доставлено", color: "#7c5cff", emoji: "✓" },
        canceled: { label: "Скасовано", color: "#ff6b6b", emoji: "✕" },
        new: { label: "Нове", color: "#7c5cff", emoji: "📦" },
    };

    if (!userLoading && !customerId) {
        return (
            <main className="auth-homepage customer-orders-page">
                    <div className="no-active-orders">
                        <div className="big-icon">👤</div>
                        <h3>Потрібен акаунт клієнта</h3>
                        <p>Увійдіть або перемкніть на Customer-акаунт у профілі</p>
                        <Link to={ROUTES.profile} className="big-cta-btn">Перейти до профілю</Link>
                        <Link to={ROUTES.login} className="big-cta-btn secondary">Увійти</Link>
                    </div>
                </main>
        );
    }

    return (
        <>
            <main className="auth-homepage customer-orders-page">
                <div className="page-header orders-page-header">
                    <h1 className="gradient-title">Мої замовлення</h1>
                    <div className="orders-tabs">
                        <button
                            type="button"
                            className={activeTab === "active" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("active")}
                        >
                            Активні ({activeOrders.length})
                        </button>
                        <button
                            type="button"
                            className={activeTab === "history" ? "tab active" : "tab"}
                            onClick={() => setActiveTab("history")}
                        >
                            Історія ({historyOrders.length})
                        </button>
                        <button type="button" className="tab refresh" onClick={loadOrders} disabled={loading}>
                            ↻ Оновити
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="orders-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="active-orders-list">
                        <div className="active-order-card skeleton" />
                        <div className="active-order-card skeleton" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="no-active-orders">
                        <div className="big-icon">🍕</div>
                        <h3>
                            {activeTab === "active"
                                ? "Немає активних замовлень"
                                : "Історія порожня"}
                        </h3>
                        <p>
                            {activeTab === "active"
                                ? "Коли ви замовите їжу — статус з’явиться тут"
                                : "Завершені замовлення з’являться в цій вкладці"}
                        </p>
                        {activeTab === "active" && (
                            <Link to={ROUTES.customer.root} className="big-cta-btn">Замовити зараз</Link>
                        )}
                    </div>
                ) : (
                    <div className="active-orders-list">
                        {orders.map((order) => {
                            const s = getStatusDisplay(order.status);
                            const canTrack =
                                order.status === "on-the-way" ||
                                order.status === "preparing" ||
                                order.status === "ready";

                            return (
                                <div key={order.id} className="active-order-card">
                                    <div className="active-order-header">
                                        <div className="order-id">#{String(order.id).slice(0, 8)}</div>
                                        <div className="live-status" style={{ color: s.color }}>
                                            {s.emoji} {s.text}
                                        </div>
                                    </div>

                                    <div className="active-order-body">
                                        <h3>{order.restaurant}</h3>
                                        <p className="order-date-muted">{order.createdAt}</p>

                                        <div className="order-items-list">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item">
                                                    <span className="item-name">{item.name}</span>
                                                    <span className="item-details">
                                                        {item.quantity} × {item.price} ₴
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.status === "on-the-way" && order.courier && (
                                            <div className="courier-info">
                                                <div className="courier-avatar">👤</div>
                                                <div className="courier-name">{order.courier.name}</div>
                                            </div>
                                        )}

                                        <div className="order-total-row">
                                            До сплати: <strong>{order.total} ₴</strong>
                                        </div>

                                        {canTrack && activeTab === "active" && (
                                            <div className="order-map-preview">
                                                <DeliveryMapWidget
                                                    fallbackAddress={order.address}
                                                    height={200}
                                                    compact
                                                    title="Куди їхати"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="active-order-footer">
                                        {canTrack && activeTab === "active" && (
                                            <Link to={ROUTES.customer.tracking(order.id)} className="track-btn">
                                                Відстежити
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            className="details-btn"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            Деталі
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {selectedOrder && (
                <OrderDetailsComponent
                    order={selectedOrder}
                    statusMap={statusMapForModal}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </>
    );
};

export default CustomerOrdersPage;
